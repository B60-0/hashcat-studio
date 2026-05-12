package settings

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

// Settings represents the application settings.
type Settings struct {
	HashcatBinaryPath      string `json:"hashcatBinaryPath"`
	HashcatInstallDir      string `json:"hashcatInstallDir"`
	SetupComplete          bool   `json:"setupComplete"`
	HashesDir              string `json:"hashesDir"`
	DictionariesDir        string `json:"dictionariesDir"`
	RulesDir               string `json:"rulesDir"`
	MasksDir               string `json:"masksDir"`
	OutputDir              string `json:"outputDir"`
	DefaultStatusTimer     int    `json:"defaultStatusTimer"`
	DefaultWorkloadProfile int    `json:"defaultWorkloadProfile"`
	Theme                  string `json:"theme"`
	EscrowEnabled          bool   `json:"escrowEnabled"`
	HashesComAPIKey        string `json:"hashesComApiKey"`
}

// SettingsManager handles application configuration and preferences.
type SettingsManager struct {
	mu       sync.Mutex
	settings Settings
	filePath string
	appDir   string
}

// New initializes the SettingsManager, setting up the configuration paths and loading existing settings if any.
func New() (*SettingsManager, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		// Fallback to current directory if user config dir is not available
		configDir = "."
	}

	appDir := filepath.Join(configDir, "HashcatStudio")
	if err := os.MkdirAll(appDir, 0755); err != nil {
		return nil, err
	}

	sm := &SettingsManager{
		filePath: filepath.Join(appDir, "settings.json"),
		appDir:   appDir,
		settings: Settings{
			HashcatBinaryPath:      "",
			HashcatInstallDir:      filepath.Join(appDir, "hashcat"),
			SetupComplete:          false,
			HashesDir:              filepath.Join(appDir, "hashes"),
			DictionariesDir:        filepath.Join(appDir, "dictionaries"),
			RulesDir:               filepath.Join(appDir, "rules"),
			MasksDir:               filepath.Join(appDir, "masks"),
			OutputDir:              filepath.Join(appDir, "output"),
			DefaultStatusTimer:     10,
			DefaultWorkloadProfile: 2,
			Theme:                  "dark",
			EscrowEnabled:          false,
			HashesComAPIKey:        "",
		},
	}

	// Try loading existing settings
	_ = sm.Load()
	sm.applyDefaults()

	// Ensure asset directories exist
	_ = sm.EnsureDirectories()

	return sm, nil
}

func (sm *SettingsManager) applyDefaults() {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if sm.settings.HashcatInstallDir == "" {
		sm.settings.HashcatInstallDir = filepath.Join(sm.appDir, "hashcat")
	}
	if sm.settings.HashesDir == "" {
		sm.settings.HashesDir = filepath.Join(sm.appDir, "hashes")
	}
	if sm.settings.DictionariesDir == "" {
		sm.settings.DictionariesDir = filepath.Join(sm.appDir, "dictionaries")
	}
	if sm.settings.RulesDir == "" {
		sm.settings.RulesDir = filepath.Join(sm.appDir, "rules")
	}
	if sm.settings.MasksDir == "" {
		sm.settings.MasksDir = filepath.Join(sm.appDir, "masks")
	}
	if sm.settings.OutputDir == "" {
		sm.settings.OutputDir = filepath.Join(sm.appDir, "output")
	}
	if sm.settings.DefaultStatusTimer == 0 {
		sm.settings.DefaultStatusTimer = 10
	}
	if sm.settings.DefaultWorkloadProfile == 0 {
		sm.settings.DefaultWorkloadProfile = 2
	}
	if sm.settings.Theme != "light" && sm.settings.Theme != "dark" {
		sm.settings.Theme = "dark"
	}
}

// Load reads settings from the settings file.
func (sm *SettingsManager) Load() error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	b, err := os.ReadFile(sm.filePath)
	if err != nil {
		return err // Could be file not found on first run, which is fine
	}

	return json.Unmarshal(b, &sm.settings)
}

// Save writes current settings to the settings file.
func (sm *SettingsManager) Save() error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	b, err := json.MarshalIndent(sm.settings, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(sm.filePath, b, 0644)
}

// Get returns a copy of the current settings.
func (sm *SettingsManager) Get() Settings {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	return sm.settings
}

// Update saves new settings.
func (sm *SettingsManager) Update(newSettings Settings) error {
	sm.mu.Lock()
	sm.settings = newSettings
	sm.mu.Unlock()

	err := sm.Save()
	if err == nil {
		_ = sm.EnsureDirectories()
	}
	return err
}

// EnsureDirectories creates the required directories if they don't exist.
func (sm *SettingsManager) EnsureDirectories() error {
	s := sm.Get()
	dirs := []string{
		s.HashesDir,
		s.DictionariesDir,
		s.RulesDir,
		s.MasksDir,
		s.OutputDir,
	}

	for _, d := range dirs {
		if d != "" {
			if err := os.MkdirAll(d, 0755); err != nil {
				return err
			}
		}
	}
	return nil
}

// GetAppDir returns the root application configuration directory.
func (sm *SettingsManager) GetAppDir() string {
	return sm.appDir
}
