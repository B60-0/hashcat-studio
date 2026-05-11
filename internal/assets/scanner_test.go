package assets

import (
	"os"
	"path/filepath"
	"testing"
)

func TestScanDir(t *testing.T) {
	tempDir := t.TempDir()

	// Create a test file
	file1Path := filepath.Join(tempDir, "file1.txt")
	err := os.WriteFile(file1Path, []byte("test"), 0644)
	if err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	// Create a subdirectory
	subDir := filepath.Join(tempDir, "subdir")
	err = os.Mkdir(subDir, 0755)
	if err != nil {
		t.Fatalf("Failed to create subdir: %v", err)
	}

	file2Path := filepath.Join(subDir, "file2.txt")
	err = os.WriteFile(file2Path, []byte("test"), 0644)
	if err != nil {
		t.Fatalf("Failed to create test file 2: %v", err)
	}

	am := New()
	files, err := am.ScanDir(tempDir)
	if err != nil {
		t.Fatalf("ScanDir failed: %v", err)
	}

	if len(files) != 2 {
		t.Errorf("Expected 2 files, found %d", len(files))
	}

	foundFile1 := false
	foundFile2 := false
	for _, f := range files {
		if f == file1Path {
			foundFile1 = true
		}
		if f == file2Path {
			foundFile2 = true
		}
	}

	if !foundFile1 || !foundFile2 {
		t.Errorf("Files not found correctly. Files array: %v", files)
	}
}
