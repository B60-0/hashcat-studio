package hashcat

import (
	"os"
	"path/filepath"
	"testing"
)

func TestValidateHashcatBinary_NotFound(t *testing.T) {
	info := ValidateHashcatBinary("/invalid/path/to/hashcat")
	if info.Valid {
		t.Errorf("Expected valid to be false for non-existent binary")
	}
	if info.Error == "" {
		t.Errorf("Expected an error message for non-existent binary")
	}
}

func TestGetDevices_NotFound(t *testing.T) {
	_, err := GetDevices("/invalid/path/to/hashcat")
	if err == nil {
		t.Errorf("Expected error when getting devices with invalid path")
	}
}

func TestRunBenchmark_NotFound(t *testing.T) {
	_, err := RunBenchmark("/invalid/path/to/hashcat", 0)
	if err == nil {
		t.Errorf("Expected error when running benchmark with invalid path")
	}
}

// Test with mocked shell scripts acting as hashcat binary
func TestMockedBinary(t *testing.T) {
	tempDir := t.TempDir()
	mockBin := filepath.Join(tempDir, "mock_hashcat")

	// Create a mock bash script that acts like hashcat
	mockScript := `#!/bin/sh
if [ "$1" = "--version" ]; then
	echo "v6.2.6"
elif [ "$1" = "--hash-info" ]; then
	echo "   0 | MD5 | Raw Hash"
	echo " 100 | SHA1 | Raw Hash"
elif [ "$1" = "-I" ]; then
	echo "Device #1: Mock GPU"
elif [ "$1" = "-b" ]; then
	echo "Benchmark m$2 result: 1000H/s"
fi
`
	err := os.WriteFile(mockBin, []byte(mockScript), 0755)
	if err != nil {
		t.Fatalf("Failed to write mock binary: %v", err)
	}

	// 1. Test ValidateHashcatBinary
	info := ValidateHashcatBinary(mockBin)
	if !info.Valid {
		t.Errorf("Expected valid to be true, got error: %s", info.Error)
	}
	if info.Version != "v6.2.6" {
		t.Errorf("Expected version v6.2.6, got %s", info.Version)
	}
	if info.Algorithms[0] != "MD5" {
		t.Errorf("Expected mode 0 to be MD5, got %s", info.Algorithms[0])
	}
	if info.Algorithms[100] != "SHA1" {
		t.Errorf("Expected mode 100 to be SHA1, got %s", info.Algorithms[100])
	}

	// 2. Test GetDevices
	devs, err := GetDevices(mockBin)
	if err != nil {
		t.Errorf("Unexpected error from GetDevices: %v", err)
	}
	if devs != "Device #1: Mock GPU" {
		t.Errorf("Expected mock device output, got %s", devs)
	}

	// 3. Test RunBenchmark
	bench, err := RunBenchmark(mockBin, 0)
	if err != nil {
		t.Errorf("Unexpected error from RunBenchmark: %v", err)
	}
	if bench != "Benchmark m-m0 result: 1000H/s" { // The mock script parses $2 which is "-m0"
		t.Errorf("Expected benchmark output, got %s", bench)
	}
}
