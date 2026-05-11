package tasks

import "testing"

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
