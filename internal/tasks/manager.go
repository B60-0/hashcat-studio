package tasks

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type TaskManager struct {
	mu       sync.Mutex
	nextID   uint64
	tasks    map[string]*Task
	wailsCtx context.Context
}

func NewManager() *TaskManager {
	return &TaskManager{
		tasks: make(map[string]*Task),
	}
}

func (m *TaskManager) SetContext(ctx context.Context) {
	m.mu.Lock()
	m.wailsCtx = ctx
	m.mu.Unlock()
}

func (m *TaskManager) emitUpdate(taskID string) {
	if m.wailsCtx == nil {
		return
	}
	m.mu.Lock()
	t, ok := m.tasks[taskID]
	m.mu.Unlock()

	if ok {
		runtime.EventsEmit(m.wailsCtx, "task:info", t.ToInfo())
	}
}

func (m *TaskManager) CreateTask(binaryPath string, args []string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	id := fmt.Sprintf("Task-%d", atomic.AddUint64(&m.nextID, 1))
	t := NewTask(id, binaryPath, args, m)
	m.tasks[id] = t

	if m.wailsCtx != nil {
		runtime.EventsEmit(m.wailsCtx, "task:created", t.ToInfo())
	}

	return id, nil
}

func (m *TaskManager) StartTask(id string) error {
	m.mu.Lock()
	t, ok := m.tasks[id]
	m.mu.Unlock()

	if !ok {
		return fmt.Errorf("task not found")
	}

	return t.Start()
}

func (m *TaskManager) PauseTask(id string) error {
	m.mu.Lock()
	t, ok := m.tasks[id]
	m.mu.Unlock()

	if !ok {
		return fmt.Errorf("task not found")
	}
	return t.Pause()
}

func (m *TaskManager) ResumeTask(id string) error {
	m.mu.Lock()
	t, ok := m.tasks[id]
	m.mu.Unlock()

	if !ok {
		return fmt.Errorf("task not found")
	}
	return t.Resume()
}

func (m *TaskManager) CheckpointTask(id string) error {
	m.mu.Lock()
	t, ok := m.tasks[id]
	m.mu.Unlock()

	if !ok {
		return fmt.Errorf("task not found")
	}
	return t.Checkpoint()
}

func (m *TaskManager) SkipTask(id string) error {
	m.mu.Lock()
	t, ok := m.tasks[id]
	m.mu.Unlock()

	if !ok {
		return fmt.Errorf("task not found")
	}
	return t.Skip()
}

func (m *TaskManager) QuitTask(id string) error {
	m.mu.Lock()
	t, ok := m.tasks[id]
	m.mu.Unlock()

	if !ok {
		return fmt.Errorf("task not found")
	}
	return t.Quit()
}

func (m *TaskManager) DeleteTask(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	t, ok := m.tasks[id]
	if !ok {
		return fmt.Errorf("task not found")
	}

	state := t.getState()
	if state == "Running" || state == "Paused" {
		return fmt.Errorf("task is active, quit it first")
	}

	delete(m.tasks, id)

	if m.wailsCtx != nil {
		runtime.EventsEmit(m.wailsCtx, "task:deleted", id)
	}

	return nil
}

func (m *TaskManager) ListTasks() []TaskInfo {
	m.mu.Lock()
	defer m.mu.Unlock()

	var list []TaskInfo
	for _, t := range m.tasks {
		list = append(list, t.ToInfo())
	}
	return list
}
