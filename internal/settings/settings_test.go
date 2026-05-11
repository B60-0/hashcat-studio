package settings

import (
	"os"
	"path/filepath"
	"testing"
)

func TestSettingsLoadSave(t *testing.T) {
	// Use a temporary directory for testing
	tempDir := t.TempDir()

	sm := &SettingsManager{
		filePath: filepath.Join(tempDir, "settings.json"),
		appDir:   tempDir,
		settings: Settings{
			HashcatBinaryPath:  "hashcat",
			DefaultStatusTimer: 10,
		},
	}

	// Test Update & Save
	newSet := sm.Get()
	newSet.HashcatBinaryPath = "/usr/bin/hashcat"
	newSet.DefaultStatusTimer = 20

	err := sm.Update(newSet)
	if err != nil {
		t.Fatalf("Failed to update settings: %v", err)
	}

	// Test Load
	sm2 := &SettingsManager{
		filePath: filepath.Join(tempDir, "settings.json"),
	}
	err = sm2.Load()
	if err != nil {
		t.Fatalf("Failed to load settings: %v", err)
	}

	if sm2.settings.HashcatBinaryPath != "/usr/bin/hashcat" {
		t.Errorf("Expected binary path /usr/bin/hashcat, got %s", sm2.settings.HashcatBinaryPath)
	}
	if sm2.settings.DefaultStatusTimer != 20 {
		t.Errorf("Expected timer 20, got %d", sm2.settings.DefaultStatusTimer)
	}
}

func TestEnsureDirectories(t *testing.T) {
	tempDir := t.TempDir()

	sm := &SettingsManager{
		filePath: filepath.Join(tempDir, "settings.json"),
		appDir:   tempDir,
		settings: Settings{
			HashesDir: filepath.Join(tempDir, "hashes_test"),
			MasksDir:  filepath.Join(tempDir, "masks_test"),
		},
	}

	err := sm.EnsureDirectories()
	if err != nil {
		t.Fatalf("Failed to ensure directories: %v", err)
	}

	if _, err := os.Stat(filepath.Join(tempDir, "hashes_test")); os.IsNotExist(err) {
		t.Errorf("Expected hashes_test directory to be created")
	}

	if _, err := os.Stat(filepath.Join(tempDir, "masks_test")); os.IsNotExist(err) {
		t.Errorf("Expected masks_test directory to be created")
	}
}
