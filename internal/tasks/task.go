package tasks

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os/exec"
	"strings"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type Task struct {
	mu         sync.Mutex
	ID         string
	BinaryPath string
	Arguments  []string
	State      string
	CreatedAt  int64
	started    bool

	cmd    *exec.Cmd
	stdin  io.WriteCloser
	ctx    context.Context
	cancel context.CancelFunc

	manager *TaskManager
}

func NewTask(id string, binaryPath string, args []string, manager *TaskManager) *Task {
	return &Task{
		ID:         id,
		BinaryPath: binaryPath,
		Arguments:  args,
		State:      "Not Started",
		CreatedAt:  time.Now().Unix(),
		manager:    manager,
	}
}

func (t *Task) Start() error {
	t.mu.Lock()
	if t.started {
		t.mu.Unlock()
		return fmt.Errorf("task has already been started")
	}
	if t.BinaryPath == "" {
		t.State = "Failed"
		t.mu.Unlock()
		return fmt.Errorf("hashcat binary path is not set")
	}
	ctx, cancel := context.WithCancel(context.Background())
	cmd := exec.CommandContext(ctx, t.BinaryPath, t.Arguments...)
	t.ctx = ctx
	t.cancel = cancel
	t.cmd = cmd
	t.started = true
	t.mu.Unlock()

	stdin, err := cmd.StdinPipe()
	if err != nil {
		t.setState("Failed")
		return err
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		t.setState("Failed")
		return err
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		t.setState("Failed")
		return err
	}

	t.mu.Lock()
	t.stdin = stdin
	t.mu.Unlock()

	if err := cmd.Start(); err != nil {
		t.setState("Failed")
		return err
	}

	t.setState("Running")
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
		err := cmd.Wait()

		if t.getState() != "Quit" { // If user forced quit, keep state as Quit
			if err != nil {
				t.setState("Failed")
			} else {
				t.setState("Finished")
			}
		}

		t.manager.emitUpdate(t.ID)
	}()

	return nil
}

func (t *Task) getState() string {
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.State
}

func (t *Task) setState(state string) {
	t.mu.Lock()
	t.State = state
	t.mu.Unlock()
}

func (t *Task) writeControl(expectedState string, input string) error {
	t.mu.Lock()
	defer t.mu.Unlock()
	if t.State != expectedState {
		return fmt.Errorf("task is not %s", strings.ToLower(expectedState))
	}
	if t.stdin == nil {
		return fmt.Errorf("task stdin is not available")
	}
	_, err := io.WriteString(t.stdin, input)
	return err
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
					State:     t.getState(),
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
	err := t.writeControl("Running", "p\n")
	if err == nil {
		t.setState("Paused")
		t.manager.emitUpdate(t.ID)
	}
	return err
}

func (t *Task) Resume() error {
	err := t.writeControl("Paused", "r\n")
	if err == nil {
		t.setState("Running")
		t.manager.emitUpdate(t.ID)
	}
	return err
}

func (t *Task) Checkpoint() error {
	return t.writeControl("Running", "c\n")
}

func (t *Task) Skip() error {
	return t.writeControl("Running", "b\n")
}

func (t *Task) Quit() error {
	t.mu.Lock()
	state := t.State
	stdin := t.stdin
	cmd := t.cmd
	cancel := t.cancel
	t.mu.Unlock()

	if state == "Not Started" || state == "Finished" || state == "Failed" || state == "Quit" {
		return fmt.Errorf("task is not active")
	}

	// Try graceful quit
	if stdin != nil {
		_, _ = io.WriteString(stdin, "q\n")
	}

	t.setState("Quit")
	t.manager.emitUpdate(t.ID)

	// Hard kill as fallback after slight delay if it doesn't stop
	go func() {
		time.Sleep(2 * time.Second)
		if cmd != nil && cmd.ProcessState == nil && cancel != nil {
			cancel()
		}
	}()

	return nil
}

func (t *Task) ToInfo() TaskInfo {
	t.mu.Lock()
	defer t.mu.Unlock()
	return TaskInfo{
		ID:        t.ID,
		Arguments: t.Arguments,
		State:     t.State,
		CreatedAt: t.CreatedAt,
	}
}
