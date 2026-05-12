package tasks

import (
	"os"
	"path/filepath"
	"testing"
)

func TestCreateTaskGeneratesUniqueIDs(t *testing.T) {
	manager := NewManager()

	first, err := manager.CreateTask("hashcat", []string{"--version"})
	if err != nil {
		t.Fatalf("failed to create first task: %v", err)
	}
	second, err := manager.CreateTask("hashcat", []string{"--version"})
	if err != nil {
		t.Fatalf("failed to create second task: %v", err)
	}

	if first == second {
		t.Fatalf("expected unique task IDs, got %s", first)
	}
	if len(manager.ListTasks()) != 2 {
		t.Fatalf("expected two tasks")
	}
}

func TestTaskLifecycleControls(t *testing.T) {
	dir := t.TempDir()
	script := filepath.Join(dir, "fake-hashcat.sh")
	if err := os.WriteFile(script, []byte(`#!/bin/sh
echo '{"session":"hashcat","progress":[1,2],"recovered_hashes":[0,1]}'
while IFS= read -r line; do
  case "$line" in
    p) echo paused ;;
    r) echo resumed ;;
    c) echo checkpoint ;;
    b) echo skipped ;;
    q) echo quitting; exit 0 ;;
  esac
done
`), 0755); err != nil {
		t.Fatalf("failed to write fake hashcat: %v", err)
	}

	manager := NewManager()
	id, err := manager.CreateTask(script, []string{"--status-json"})
	if err != nil {
		t.Fatalf("failed to create task: %v", err)
	}

	if err := manager.StartTask(id); err != nil {
		t.Fatalf("failed to start task: %v", err)
	}
	if got := manager.ListTasks()[0].State; got != "Running" {
		t.Fatalf("expected running task, got %s", got)
	}

	if err := manager.PauseTask(id); err != nil {
		t.Fatalf("failed to pause task: %v", err)
	}
	if got := manager.ListTasks()[0].State; got != "Paused" {
		t.Fatalf("expected paused task, got %s", got)
	}

	if err := manager.ResumeTask(id); err != nil {
		t.Fatalf("failed to resume task: %v", err)
	}
	if got := manager.ListTasks()[0].State; got != "Running" {
		t.Fatalf("expected resumed task, got %s", got)
	}

	if err := manager.CheckpointTask(id); err != nil {
		t.Fatalf("failed to checkpoint task: %v", err)
	}
	if err := manager.SkipTask(id); err != nil {
		t.Fatalf("failed to skip task: %v", err)
	}
	if err := manager.QuitTask(id); err != nil {
		t.Fatalf("failed to quit task: %v", err)
	}
	if got := manager.ListTasks()[0].State; got != "Quit" {
		t.Fatalf("expected quit task, got %s", got)
	}
	if err := manager.DeleteTask(id); err != nil {
		t.Fatalf("failed to delete inactive task: %v", err)
	}
	if got := len(manager.ListTasks()); got != 0 {
		t.Fatalf("expected deleted task, got %d tasks", got)
	}
}
