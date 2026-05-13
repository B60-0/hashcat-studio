package hashcat

import (
	"fmt"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

var (
	reHashInfoMode = regexp.MustCompile(`^Hash mode #(\d+)$`)
	reHashInfoName = regexp.MustCompile(`^\s*Name\.*:\s*(.+)$`)
	reTableMode    = regexp.MustCompile(`^\s*(\d+)\s*\|\s*([^|]+)`)
)

type HashcatBinaryInfo struct {
	Valid      bool           `json:"valid"`
	Version    string         `json:"version"`
	Algorithms map[int]string `json:"algorithms"`
	Error      string         `json:"error"`
}

type BenchmarkOptions struct {
	DeviceIDs   []int `json:"deviceIDs"`
	DeviceTypes []int `json:"deviceTypes"`
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

	lines := strings.Split(string(algorithmsBytes), "\n")
	currentMode := -1
	for _, line := range lines {
		strLine := strings.TrimSpace(line)
		if strLine == "" {
			continue
		}

		if match := reHashInfoMode.FindStringSubmatch(strLine); len(match) == 2 {
			mode, err := strconv.Atoi(match[1])
			if err == nil {
				currentMode = mode
			}
			continue
		}

		if match := reHashInfoName.FindStringSubmatch(line); len(match) == 2 && currentMode >= 0 {
			info.Algorithms[currentMode] = strings.TrimSpace(match[1])
			currentMode = -1
			continue
		}

		if match := reTableMode.FindStringSubmatch(strLine); len(match) == 3 {
			mode, err := strconv.Atoi(match[1])
			if err == nil {
				info.Algorithms[mode] = strings.TrimSpace(match[2])
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
	return RunBenchmarkWithOptions(binaryPath, hashMode, BenchmarkOptions{})
}

// RunBenchmarkWithOptions runs a benchmark for a specific hash mode and hardware selection.
func RunBenchmarkWithOptions(binaryPath string, hashMode int, options BenchmarkOptions) (string, error) {
	wdir := filepath.Dir(binaryPath)
	cmd := exec.Command(binaryPath, benchmarkArgs(hashMode, options)...)
	cmd.Dir = wdir

	benchmarkBytes, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("benchmark failed: %v", err)
	}

	return strings.TrimSpace(string(benchmarkBytes)), nil
}

func benchmarkArgs(hashMode int, options BenchmarkOptions) []string {
	args := []string{"-b", fmt.Sprintf("-m%d", hashMode), "--quiet"}
	if len(options.DeviceIDs) > 0 {
		args = append(args, "-d", joinInts(options.DeviceIDs, ","))
	}
	if len(options.DeviceTypes) > 0 {
		args = append(args, "-D", joinInts(options.DeviceTypes, ","))
	}
	return args
}
