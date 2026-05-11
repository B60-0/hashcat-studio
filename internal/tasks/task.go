package tasks

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os/exec"
	"strings"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"context"
)

type Task struct {
	ID        string
	Arguments []string
	State     string
	CreatedAt int64

	cmd    *exec.Cmd
	stdin  io.WriteCloser
	ctx    context.Context
	cancel context.CancelFunc

	manager *TaskManager
}

func NewTask(id string, binaryPath string, args []string, manager *TaskManager) *Task {
	// The underlying context will be bound to the application lifetime, but we add our own cancel for force quit
	ctx, cancel := context.WithCancel(context.Background())
	
	cmd := exec.CommandContext(ctx, binaryPath, args...)
	
	return &Task{
		ID:        id,
		Arguments: args,
		State:     "Not Started",
		CreatedAt: time.Now().Unix(),
		cmd:       cmd,
		ctx:       ctx,
		cancel:    cancel,
		manager:   manager,
	}
}

func (t *Task) Start() error {
	if t.State == "Running" || t.State == "Paused" {
		return fmt.Errorf("task already started")
	}

	stdin, err := t.cmd.StdinPipe()
	if err != nil {
		return err
	}
	t.stdin = stdin

	stdout, err := t.cmd.StdoutPipe()
	if err != nil {
		return err
	}

	stderr, err := t.cmd.StderrPipe()
	if err != nil {
		return err
	}

	if err := t.cmd.Start(); err != nil {
		t.State = "Failed"
		return err
	}

	t.State = "Running"
	t.manager.emitUpdate(t.ID)

	var wg sync.WaitGroup

	wg.Add(1)
	go func() {
		defer wg.Done()
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			line := scanner.Text()
			t.processOutput(line, "stdout")
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			line := scanner.Text()
			t.processOutput(line, "stderr")
		}
	}()

	go func() {
		wg.Wait()
		err := t.cmd.Wait()
		
		if t.State != "Quit" { // If user forced quit, keep state as Quit
			if err != nil {
				t.State = "Failed"
			} else {
				t.State = "Finished"
			}
		}
		
		t.manager.emitUpdate(t.ID)
	}()

	return nil
}

func (t *Task) processOutput(line string, source string) {
	trimmed := strings.TrimSpace(line)
	if trimmed == "" {
		return
	}

	if strings.HasPrefix(trimmed, "{") && strings.HasSuffix(trimmed, "}") {
		var status StatusJSON
		if err := json.Unmarshal([]byte(trimmed), &status); err == nil {
			if t.manager.wailsCtx != nil {
				runtime.EventsEmit(t.manager.wailsCtx, "task:updated", UpdateEvent{
					TaskID:    t.ID,
					Status:    status,
					State:     t.State,
					Timestamp: time.Now().Unix(),
				})
			}
			return
		}
	}

	// Normal log line
	if t.manager.wailsCtx != nil {
		runtime.EventsEmit(t.manager.wailsCtx, "task:log", LogEvent{
			TaskID:    t.ID,
			Message:   trimmed,
			Source:    source,
			Timestamp: time.Now().Unix(),
		})
	}
}

func (t *Task) Pause() error {
	if t.State != "Running" {
		return fmt.Errorf("task is not running")
	}
	_, err := io.WriteString(t.stdin, "p\n")
	if err == nil {
		t.State = "Paused"
		t.manager.emitUpdate(t.ID)
	}
	return err
}

func (t *Task) Resume() error {
	if t.State != "Paused" {
		return fmt.Errorf("task is not paused")
	}
	_, err := io.WriteString(t.stdin, "r\n")
	if err == nil {
		t.State = "Running"
		t.manager.emitUpdate(t.ID)
	}
	return err
}

func (t *Task) Checkpoint() error {
	if t.State != "Running" {
		return fmt.Errorf("task is not running")
	}
	_, err := io.WriteString(t.stdin, "c\n")
	return err
}

func (t *Task) Skip() error {
	if t.State != "Running" {
		return fmt.Errorf("task is not running")
	}
	_, err := io.WriteString(t.stdin, "b\n")
	return err
}

func (t *Task) Quit() error {
	if t.State == "Not Started" || t.State == "Finished" || t.State == "Failed" {
		return fmt.Errorf("task is not active")
	}
	
	// Try graceful quit
	io.WriteString(t.stdin, "q\n")
	
	t.State = "Quit"
	t.manager.emitUpdate(t.ID)
	
	// Hard kill as fallback after slight delay if it doesn't stop
	go func() {
		time.Sleep(2 * time.Second)
		if t.cmd.ProcessState == nil {
			t.cancel()
		}
	}()
	
	return nil
}

func (t *Task) ToInfo() TaskInfo {
	return TaskInfo{
		ID:        t.ID,
		Arguments: t.Arguments,
		State:     t.State,
		CreatedAt: t.CreatedAt,
	}
}
