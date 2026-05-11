package hashcat

import (
	"bytes"
	"fmt"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

var (
	reMode = regexp.MustCompile(`^\s*(\d+)\s*\|\s*(.*)$`)
)

type HashcatBinaryInfo struct {
	Valid      bool             `json:"valid"`
	Version    string           `json:"version"`
	Algorithms map[int]string `json:"algorithms"`
	Error      string           `json:"error"`
}

// ValidateHashcatBinary checks if the hashcat binary exists and extracts its version and algorithms.
func ValidateHashcatBinary(binaryPath string) HashcatBinaryInfo {
	info := HashcatBinaryInfo{
		Valid:      false,
		Algorithms: make(map[int]string),
	}

	// 1. Check version
	wdir := filepath.Dir(binaryPath)
	cmd := exec.Command(binaryPath, "--version")
	cmd.Dir = wdir
	
	versionBytes, err := cmd.CombinedOutput()
	if err != nil {
		info.Error = fmt.Sprintf("Failed to run binary: %v", err)
		return info
	}
	info.Version = strings.TrimSpace(string(versionBytes))

	// 2. Load algorithms
	cmdAlgorithms := exec.Command(binaryPath, "--hash-info", "--quiet")
	cmdAlgorithms.Dir = wdir
	
	algorithmsBytes, err := cmdAlgorithms.CombinedOutput()
	if err != nil {
		info.Error = fmt.Sprintf("Failed to load algorithms: %v", err)
		return info
	}

	// Parse algorithms
	lines := bytes.Split(algorithmsBytes, []byte("\n"))
	for _, line := range lines {
		strLine := strings.TrimSpace(string(line))
		if strLine == "" {
			continue
		}
		
		// Typically Hashcat outputs:
		// 900 | MD4 | Raw Hash
		parts := strings.SplitN(strLine, "|", 3)
		if len(parts) >= 2 {
			modeStr := strings.TrimSpace(parts[0])
			nameStr := strings.TrimSpace(parts[1])
			
			mode, err := strconv.Atoi(modeStr)
			if err == nil {
				info.Algorithms[mode] = nameStr
			}
		}
	}

	info.Valid = true
	return info
}

// GetDevices returns the device string output from 'hashcat -I'
func GetDevices(binaryPath string) (string, error) {
	wdir := filepath.Dir(binaryPath)
	cmd := exec.Command(binaryPath, "-I", "--quiet")
	cmd.Dir = wdir
	
	devicesBytes, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to get devices: %v", err)
	}
	
	return strings.TrimSpace(string(devicesBytes)), nil
}

// RunBenchmark runs a benchmark for a specific hash mode and returns the output
func RunBenchmark(binaryPath string, hashMode int) (string, error) {
	wdir := filepath.Dir(binaryPath)
	cmd := exec.Command(binaryPath, "-b", fmt.Sprintf("-m%d", hashMode), "--quiet")
	cmd.Dir = wdir
	
	benchmarkBytes, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("benchmark failed: %v", err)
	}
	
	return strings.TrimSpace(string(benchmarkBytes)), nil
}
