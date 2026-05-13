package main

import (
	"context"
	"fmt"
	"hashcat-studio/internal/assets"
	"hashcat-studio/internal/hashcat"
	"hashcat-studio/internal/hashescom"
	"hashcat-studio/internal/settings"
	"hashcat-studio/internal/tasks"
	"strings"
	"sync"
)

// App struct
type App struct {
	ctx             context.Context
	settingsManager *settings.SettingsManager
	assetManager    *assets.AssetManager
	hashesClient    *hashescom.Client
	taskManager     *tasks.TaskManager
	setupMu         sync.Mutex
	setupRunning    bool
}

// NewApp creates a new App application struct
func NewApp() *App {
	sm, err := settings.New()
	if err != nil {
		fmt.Printf("Failed to initialize settings manager: %v\n", err)
	}

	am := assets.New()
	hc := hashescom.NewClient("")
	tm := tasks.NewManager()

	return &App{
		settingsManager: sm,
		assetManager:    am,
		hashesClient:    hc,
		taskManager:     tm,
	}
}

func (a *App) requestContext() context.Context {
	if a.ctx != nil {
		return a.ctx
	}
	return context.Background()
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.taskManager.SetContext(ctx)
}

// GetSettings returns the current user settings
func (a *App) GetSettings() settings.Settings {
	if a.settingsManager == nil {
		return settings.Settings{}
	}
	return a.settingsManager.Get()
}

// UpdateSettings updates the user settings and saves them
func (a *App) UpdateSettings(s settings.Settings) error {
	if a.settingsManager == nil {
		return fmt.Errorf("settings manager not initialized")
	}
	return a.settingsManager.Update(s)
}

type AssetFolders struct {
	HashesDir       string `json:"hashesDir"`
	DictionariesDir string `json:"dictionariesDir"`
	RulesDir        string `json:"rulesDir"`
	MasksDir        string `json:"masksDir"`
}

// GetAssetFolders returns the configured asset directories
func (a *App) GetAssetFolders() AssetFolders {
	if a.settingsManager == nil {
		return AssetFolders{}
	}
	s := a.settingsManager.Get()
	return AssetFolders{
		HashesDir:       s.HashesDir,
		DictionariesDir: s.DictionariesDir,
		RulesDir:        s.RulesDir,
		MasksDir:        s.MasksDir,
	}
}

type ScannedAssets struct {
	Hashes       []string `json:"hashes"`
	Dictionaries []string `json:"dictionaries"`
	Rules        []string `json:"rules"`
	Masks        []string `json:"masks"`
}

type HashesComEscrowJobsResult struct {
	Enabled       bool                  `json:"enabled"`
	Authenticated bool                  `json:"authenticated"`
	Jobs          []hashescom.EscrowJob `json:"jobs"`
}

// ListHashesComEscrowJobs returns active hashes.com escrow jobs.
func (a *App) ListHashesComEscrowJobs() (HashesComEscrowJobsResult, error) {
	result := HashesComEscrowJobsResult{
		Jobs: []hashescom.EscrowJob{},
	}

	if a.settingsManager == nil {
		return result, fmt.Errorf("settings manager not initialized")
	}
	if a.hashesClient == nil {
		return result, fmt.Errorf("hashes.com client not initialized")
	}

	s := a.settingsManager.Get()
	result.Enabled = s.EscrowEnabled
	if !s.EscrowEnabled {
		return result, fmt.Errorf("escrow is disabled")
	}

	apiKey := strings.TrimSpace(s.HashesComAPIKey)
	result.Authenticated = apiKey != ""

	jobs, err := a.hashesClient.ListJobs(a.requestContext(), apiKey, result.Authenticated)
	if err != nil {
		return result, err
	}
	result.Jobs = jobs

	return result, nil
}

// DownloadHashesComEscrowJobHashes saves a hashes.com unfound list into the configured hashes directory.
func (a *App) DownloadHashesComEscrowJobHashes(jobID int, leftList string) (string, error) {
	if a.settingsManager == nil {
		return "", fmt.Errorf("settings manager not initialized")
	}
	if a.hashesClient == nil {
		return "", fmt.Errorf("hashes.com client not initialized")
	}

	s := a.settingsManager.Get()
	if !s.EscrowEnabled {
		return "", fmt.Errorf("escrow is disabled")
	}

	return a.hashesClient.DownloadLeftList(a.requestContext(), jobID, leftList, strings.TrimSpace(s.HashesComAPIKey), s.HashesDir)
}

// ScanAssets recursively scans all the asset folders and returns the results
func (a *App) ScanAssets() (ScannedAssets, error) {
	folders := a.GetAssetFolders()
	result := ScannedAssets{
		Hashes:       []string{},
		Dictionaries: []string{},
		Rules:        []string{},
		Masks:        []string{},
	}

	if a.assetManager == nil {
		return result, fmt.Errorf("asset manager not initialized")
	}

	if folders.HashesDir != "" {
		if files, err := a.assetManager.ScanDir(folders.HashesDir); err == nil {
			result.Hashes = files
		}
	}
	if folders.DictionariesDir != "" {
		if files, err := a.assetManager.ScanDir(folders.DictionariesDir); err == nil {
			result.Dictionaries = files
		}
	}
	if folders.RulesDir != "" {
		if files, err := a.assetManager.ScanDir(folders.RulesDir); err == nil {
			result.Rules = files
		}
	}
	if folders.MasksDir != "" {
		if files, err := a.assetManager.ScanDir(folders.MasksDir); err == nil {
			result.Masks = files
		}
	}

	return result, nil
}

// ValidateHashcatBinary checks if the specified hashcat binary is valid
func (a *App) ValidateHashcatBinary(path string) hashcat.HashcatBinaryInfo {
	return hashcat.ValidateHashcatBinary(path)
}

// GetDevices returns the output of hashcat -I
func (a *App) GetDevices() (string, error) {
	if a.settingsManager == nil {
		return "", fmt.Errorf("settings manager not initialized")
	}
	path := a.settingsManager.Get().HashcatBinaryPath
	if path == "" {
		return "", fmt.Errorf("hashcat binary path not set")
	}
	return hashcat.GetDevices(path)
}

// RunBenchmark runs a hashcat benchmark for a specific mode
func (a *App) RunBenchmark(hashMode int) (string, error) {
	if a.settingsManager == nil {
		return "", fmt.Errorf("settings manager not initialized")
	}
	path := a.settingsManager.Get().HashcatBinaryPath
	if path == "" {
		return "", fmt.Errorf("hashcat binary path not set")
	}
	return hashcat.RunBenchmark(path, hashMode)
}

// RunBenchmarkWithOptions runs a hashcat benchmark for a specific mode and hardware selection.
func (a *App) RunBenchmarkWithOptions(hashMode int, options hashcat.BenchmarkOptions) (string, error) {
	if a.settingsManager == nil {
		return "", fmt.Errorf("settings manager not initialized")
	}
	path := a.settingsManager.Get().HashcatBinaryPath
	if path == "" {
		return "", fmt.Errorf("hashcat binary path not set")
	}
	return hashcat.RunBenchmarkWithOptions(path, hashMode, options)
}

// --- Task Manager APIs ---

// CreateTask builds args and creates a queued task
func (a *App) CreateTask(config hashcat.HashcatArgs) (string, error) {
	if a.settingsManager == nil {
		return "", fmt.Errorf("settings manager not initialized")
	}
	path := a.settingsManager.Get().HashcatBinaryPath

	args, err := config.Build()
	if err != nil {
		return "", err
	}

	return a.taskManager.CreateTask(path, args)
}

// PreviewTask returns the string array of arguments without creating a task
func (a *App) PreviewTask(config hashcat.HashcatArgs) ([]string, error) {
	return config.Build()
}

// CreateRawTask creates a queued task from direct hashcat arguments.
func (a *App) CreateRawTask(rawArgs string) (string, error) {
	if a.settingsManager == nil {
		return "", fmt.Errorf("settings manager not initialized")
	}
	path := a.settingsManager.Get().HashcatBinaryPath

	args, err := hashcat.ParseRawArgs(rawArgs)
	if err != nil {
		return "", err
	}

	return a.taskManager.CreateTask(path, args)
}

// PreviewRawTask parses direct hashcat arguments without creating a task.
func (a *App) PreviewRawTask(rawArgs string) ([]string, error) {
	return hashcat.ParseRawArgs(rawArgs)
}

func (a *App) StartTask(id string) error {
	return a.taskManager.StartTask(id)
}

func (a *App) PauseTask(id string) error {
	return a.taskManager.PauseTask(id)
}

func (a *App) ResumeTask(id string) error {
	return a.taskManager.ResumeTask(id)
}

func (a *App) CheckpointTask(id string) error {
	return a.taskManager.CheckpointTask(id)
}

func (a *App) SkipTask(id string) error {
	return a.taskManager.SkipTask(id)
}

func (a *App) QuitTask(id string) error {
	return a.taskManager.QuitTask(id)
}

func (a *App) DeleteTask(id string) error {
	return a.taskManager.DeleteTask(id)
}

func (a *App) ListTasks() []tasks.TaskInfo {
	return a.taskManager.ListTasks()
}
