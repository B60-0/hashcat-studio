package main

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"hashcat-studio/internal/hashcat"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/bodgit/sevenzip"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const hashcatLatestReleaseURL = "https://api.github.com/repos/hashcat/hashcat/releases/latest"

type SetupState struct {
	Required          bool   `json:"required"`
	Running           bool   `json:"running"`
	HashcatBinaryPath string `json:"hashcatBinaryPath"`
	HashcatInstallDir string `json:"hashcatInstallDir"`
	Valid             bool   `json:"valid"`
	Version           string `json:"version"`
	Error             string `json:"error"`
}

type SetupProgress struct {
	Percent           int    `json:"percent"`
	Step              string `json:"step"`
	Message           string `json:"message"`
	Log               string `json:"log"`
	Finished          bool   `json:"finished"`
	Error             string `json:"error"`
	HashcatBinaryPath string `json:"hashcatBinaryPath"`
}

type githubRelease struct {
	TagName string `json:"tag_name"`
	Assets  []struct {
		Name               string `json:"name"`
		BrowserDownloadURL string `json:"browser_download_url"`
		Size               int64  `json:"size"`
	} `json:"assets"`
}

// GetSetupState returns whether the first-run setup screen should be shown.
func (a *App) GetSetupState() SetupState {
	if a.settingsManager == nil {
		return SetupState{Required: true, Error: "settings manager not initialized"}
	}

	s := a.settingsManager.Get()
	state := SetupState{
		HashcatBinaryPath: s.HashcatBinaryPath,
		HashcatInstallDir: s.HashcatInstallDir,
	}

	if s.HashcatBinaryPath != "" {
		info := hashcat.ValidateHashcatBinary(s.HashcatBinaryPath)
		state.Valid = info.Valid
		state.Version = info.Version
		state.Error = info.Error
	}

	a.setupMu.Lock()
	state.Running = a.setupRunning
	a.setupMu.Unlock()

	state.Required = !s.SetupComplete || !state.Valid
	return state
}

// UseSystemHashcat validates and saves the hashcat binary available on PATH.
func (a *App) UseSystemHashcat() (SetupState, error) {
	return a.completeSetupWithBinary("hashcat")
}

// SelectHashcatBinary lets the user point directly at a hashcat executable.
func (a *App) SelectHashcatBinary() (SetupState, error) {
	if a.ctx == nil {
		return SetupState{Required: true}, errors.New("app context not ready")
	}

	path, err := wailsruntime.OpenFileDialog(a.ctx, wailsruntime.OpenDialogOptions{
		Title: "Choose Hashcat Binary",
		Filters: []wailsruntime.FileFilter{
			{DisplayName: "Hashcat binary", Pattern: executableDialogPattern()},
			{DisplayName: "All files", Pattern: "*"},
		},
	})
	if err != nil || path == "" {
		return a.GetSetupState(), err
	}
	return a.completeSetupWithBinary(path)
}

// SelectHashcatDirectory lets the user choose an existing Hashcat folder.
func (a *App) SelectHashcatDirectory() (SetupState, error) {
	if a.ctx == nil {
		return SetupState{Required: true}, errors.New("app context not ready")
	}

	dir, err := wailsruntime.OpenDirectoryDialog(a.ctx, wailsruntime.OpenDialogOptions{
		Title: "Choose Hashcat Folder",
	})
	if err != nil || dir == "" {
		return a.GetSetupState(), err
	}

	binary, err := findHashcatBinary(dir)
	if err != nil {
		return a.GetSetupState(), err
	}
	return a.completeSetupWithBinary(binary)
}

// StartHashcatDownload installs the latest official Hashcat release in the background.
func (a *App) StartHashcatDownload() error {
	if a.settingsManager == nil {
		return errors.New("settings manager not initialized")
	}

	a.setupMu.Lock()
	if a.setupRunning {
		a.setupMu.Unlock()
		return errors.New("setup already running")
	}
	a.setupRunning = true
	a.setupMu.Unlock()

	go func() {
		defer func() {
			a.setupMu.Lock()
			a.setupRunning = false
			a.setupMu.Unlock()
		}()

		if err := a.installHashcat(); err != nil {
			a.emitSetup(SetupProgress{
				Percent: 100,
				Step:    "Setup failed",
				Message: "Hashcat was not installed.",
				Log:     fmt.Sprintf("[error] %s", err),
				Error:   err.Error(),
			})
		}
	}()

	return nil
}

func (a *App) installHashcat() error {
	if runtime.GOOS == "darwin" {
		return a.installHashcatWithHomebrew()
	}

	s := a.settingsManager.Get()
	installDir := s.HashcatInstallDir
	if installDir == "" {
		installDir = filepath.Join(a.settingsManager.GetAppDir(), "hashcat")
	}
	cacheDir := filepath.Join(a.settingsManager.GetAppDir(), "downloads")
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		return err
	}
	if err := os.MkdirAll(installDir, 0755); err != nil {
		return err
	}

	a.emitSetup(SetupProgress{Percent: 4, Step: "Finding release", Message: "Checking the latest official Hashcat release.", Log: "$ GET hashcat/hashcat latest release"})
	release, assetURL, assetName, err := latestHashcatAsset()
	if err != nil {
		return err
	}

	archivePath := filepath.Join(cacheDir, assetName)
	a.emitSetup(SetupProgress{
		Percent: 12,
		Step:    "Downloading Hashcat",
		Message: fmt.Sprintf("Downloading %s.", release.TagName),
		Log:     fmt.Sprintf("$ curl -L %s", assetURL),
	})
	if err := downloadFile(assetURL, archivePath, func(percent int64, downloaded int64, total int64) {
		a.emitSetup(SetupProgress{
			Percent: int(12 + percent*38/100),
			Step:    "Downloading Hashcat",
			Message: fmt.Sprintf("Downloaded %s of %s.", byteCount(downloaded), byteCount(total)),
			Log:     fmt.Sprintf("[download] %s / %s", byteCount(downloaded), byteCount(total)),
		})
	}); err != nil {
		return err
	}

	a.emitSetup(SetupProgress{Percent: 55, Step: "Extracting archive", Message: "Unpacking Hashcat into the app folder.", Log: fmt.Sprintf("$ extract %s", archivePath)})
	if err := extractSevenZip(archivePath, installDir, func(current, total int) {
		a.emitSetup(SetupProgress{
			Percent: 55 + int(float64(current)/float64(max(total, 1))*30),
			Step:    "Extracting archive",
			Message: fmt.Sprintf("Extracted %d of %d files.", current, total),
			Log:     fmt.Sprintf("[extract] file %d/%d", current, total),
		})
	}); err != nil {
		return err
	}

	a.emitSetup(SetupProgress{Percent: 88, Step: "Locating binary", Message: "Finding the Hashcat executable.", Log: "$ find hashcat binary"})
	binary, err := findHashcatBinary(installDir)
	if err != nil {
		return err
	}

	if runtime.GOOS != "windows" {
		_ = os.Chmod(binary, 0755)
	}

	a.emitSetup(SetupProgress{Percent: 94, Step: "Validating install", Message: "Running hashcat --version.", Log: fmt.Sprintf("$ %s --version", binary)})
	state, err := a.completeSetupWithBinary(binary)
	if err != nil {
		return err
	}

	a.emitSetup(SetupProgress{
		Percent:           100,
		Step:              "Ready",
		Message:           "Hashcat is installed and ready.",
		Log:               fmt.Sprintf("[done] %s", state.Version),
		Finished:          true,
		HashcatBinaryPath: state.HashcatBinaryPath,
	})
	return nil
}

func (a *App) installHashcatWithHomebrew() error {
	a.emitSetup(SetupProgress{
		Percent: 6,
		Step:    "Checking macOS",
		Message: "Looking for Homebrew and Hashcat.",
		Log:     "$ which hashcat",
	})

	for _, path := range []string{"/opt/homebrew/bin/hashcat", "/usr/local/bin/hashcat"} {
		if info := hashcat.ValidateHashcatBinary(path); info.Valid {
			state, err := a.completeSetupWithBinary(path)
			if err != nil {
				return err
			}
			a.emitSetup(SetupProgress{
				Percent:           100,
				Step:              "Ready",
				Message:           "Hashcat is installed and ready.",
				Log:               fmt.Sprintf("[done] %s", state.Version),
				Finished:          true,
				HashcatBinaryPath: state.HashcatBinaryPath,
			})
			return nil
		}
	}

	brew, err := findHomebrew()
	if err != nil {
		return errors.New("Homebrew was not found. Install Homebrew from https://brew.sh, then reopen Hashcat Studio or use the existing-install link")
	}

	a.emitSetup(SetupProgress{
		Percent: 15,
		Step:    "Installing Hashcat",
		Message: "Installing Hashcat with Homebrew.",
		Log:     fmt.Sprintf("$ %s install hashcat", brew),
	})

	if err := a.runSetupCommand(15, 88, brew, "install", "hashcat"); err != nil {
		return err
	}

	a.emitSetup(SetupProgress{
		Percent: 92,
		Step:    "Validating install",
		Message: "Running hashcat --version.",
		Log:     "$ hashcat --version",
	})

	for _, path := range []string{"/opt/homebrew/bin/hashcat", "/usr/local/bin/hashcat"} {
		if info := hashcat.ValidateHashcatBinary(path); info.Valid {
			state, err := a.completeSetupWithBinary(path)
			if err != nil {
				return err
			}
			a.emitSetup(SetupProgress{
				Percent:           100,
				Step:              "Ready",
				Message:           "Hashcat is installed and ready.",
				Log:               fmt.Sprintf("[done] %s", state.Version),
				Finished:          true,
				HashcatBinaryPath: state.HashcatBinaryPath,
			})
			return nil
		}
	}

	return errors.New("Homebrew finished, but Hashcat could not be found in /opt/homebrew/bin or /usr/local/bin")
}

func (a *App) runSetupCommand(startPercent int, endPercent int, name string, args ...string) error {
	cmd := exec.Command(name, args...)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return err
	}
	if err := cmd.Start(); err != nil {
		return err
	}

	var wg sync.WaitGroup
	var countMu sync.Mutex
	lineCount := 0
	emitLine := func(source string, line string) {
		countMu.Lock()
		lineCount++
		next := startPercent + min(lineCount, 60)*(endPercent-startPercent)/60
		countMu.Unlock()
		a.emitSetup(SetupProgress{
			Percent: next,
			Step:    "Installing Hashcat",
			Message: "Homebrew is installing Hashcat and its dependencies.",
			Log:     fmt.Sprintf("[%s] %s", source, line),
		})
	}

	wg.Add(2)
	go scanCommandOutput(&wg, stdout, "brew", emitLine)
	go scanCommandOutput(&wg, stderr, "brew", emitLine)
	wg.Wait()

	if err := cmd.Wait(); err != nil {
		return fmt.Errorf("Homebrew install failed: %w", err)
	}
	return nil
}

func (a *App) completeSetupWithBinary(path string) (SetupState, error) {
	if a.settingsManager == nil {
		return SetupState{Required: true}, errors.New("settings manager not initialized")
	}

	info := hashcat.ValidateHashcatBinary(path)
	if !info.Valid {
		if info.Error == "" {
			info.Error = "selected file is not a valid Hashcat binary"
		}
		return a.GetSetupState(), errors.New(info.Error)
	}

	s := a.settingsManager.Get()
	s.HashcatBinaryPath = path
	if s.HashcatInstallDir == "" {
		s.HashcatInstallDir = filepath.Join(a.settingsManager.GetAppDir(), "hashcat")
	}
	s.SetupComplete = true
	if err := a.settingsManager.Update(s); err != nil {
		return a.GetSetupState(), err
	}

	return SetupState{
		Required:          false,
		HashcatBinaryPath: path,
		HashcatInstallDir: s.HashcatInstallDir,
		Valid:             true,
		Version:           info.Version,
	}, nil
}

func (a *App) emitSetup(progress SetupProgress) {
	if a.ctx == nil {
		return
	}
	if progress.Percent < 0 {
		progress.Percent = 0
	}
	if progress.Percent > 100 {
		progress.Percent = 100
	}
	wailsruntime.EventsEmit(a.ctx, "setup:progress", progress)
}

func latestHashcatAsset() (githubRelease, string, string, error) {
	req, err := http.NewRequest(http.MethodGet, hashcatLatestReleaseURL, nil)
	if err != nil {
		return githubRelease{}, "", "", err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "Hashcat-Studio")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return githubRelease{}, "", "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return githubRelease{}, "", "", fmt.Errorf("release lookup failed: %s", resp.Status)
	}

	var release githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return githubRelease{}, "", "", err
	}

	for _, asset := range release.Assets {
		if strings.HasSuffix(strings.ToLower(asset.Name), ".7z") {
			return release, asset.BrowserDownloadURL, asset.Name, nil
		}
	}
	return githubRelease{}, "", "", errors.New("latest Hashcat release did not include a .7z binary archive")
}

func downloadFile(url string, destination string, onProgress func(percent int64, downloaded int64, total int64)) error {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Hashcat-Studio")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("download failed: %s", resp.Status)
	}

	out, err := os.Create(destination)
	if err != nil {
		return err
	}
	defer out.Close()

	total := resp.ContentLength
	var downloaded int64
	lastEmit := time.Now().Add(-time.Second)
	buf := make([]byte, 64*1024)
	for {
		n, readErr := resp.Body.Read(buf)
		if n > 0 {
			if _, err := out.Write(buf[:n]); err != nil {
				return err
			}
			downloaded += int64(n)
			if onProgress != nil && time.Since(lastEmit) > 250*time.Millisecond {
				onProgress(progressPercent(downloaded, total), downloaded, total)
				lastEmit = time.Now()
			}
		}
		if errors.Is(readErr, io.EOF) {
			break
		}
		if readErr != nil {
			return readErr
		}
	}
	if onProgress != nil {
		onProgress(100, downloaded, total)
	}
	return nil
}

func extractSevenZip(archivePath string, destination string, onProgress func(current int, total int)) error {
	reader, err := sevenzip.OpenReader(archivePath)
	if err != nil {
		return err
	}
	defer reader.Close()

	total := len(reader.File)
	for i, file := range reader.File {
		target, err := safeJoin(destination, file.Name)
		if err != nil {
			return err
		}

		info := file.FileInfo()
		if info.IsDir() {
			if err := os.MkdirAll(target, info.Mode()); err != nil {
				return err
			}
			continue
		}

		if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
			return err
		}

		src, err := file.Open()
		if err != nil {
			return err
		}
		dst, err := os.OpenFile(target, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, info.Mode())
		if err != nil {
			_ = src.Close()
			return err
		}
		_, copyErr := io.Copy(dst, src)
		closeErr := dst.Close()
		_ = src.Close()
		if copyErr != nil {
			return copyErr
		}
		if closeErr != nil {
			return closeErr
		}
		if onProgress != nil && (i%8 == 0 || i == total-1) {
			onProgress(i+1, total)
		}
	}
	return nil
}

func findHashcatBinary(root string) (string, error) {
	candidates := candidateBinaryNames()
	var fallback string
	err := filepath.WalkDir(root, func(path string, entry os.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if entry.IsDir() {
			name := strings.ToLower(entry.Name())
			if name == ".git" || name == "__macosx" {
				return filepath.SkipDir
			}
			return nil
		}

		name := strings.ToLower(entry.Name())
		for _, candidate := range candidates {
			if name == candidate {
				fallback = path
				return filepath.SkipAll
			}
		}
		return nil
	})
	if err != nil {
		return "", err
	}
	if fallback == "" {
		return "", fmt.Errorf("no hashcat binary found in %s", root)
	}
	return fallback, nil
}

func candidateBinaryNames() []string {
	switch runtime.GOOS {
	case "windows":
		return []string{"hashcat.exe", "hashcat64.exe"}
	case "darwin":
		return []string{"hashcat"}
	default:
		return []string{"hashcat", "hashcat.bin"}
	}
}

func executableDialogPattern() string {
	if runtime.GOOS == "windows" {
		return "*.exe"
	}
	return "*"
}

func safeJoin(root string, name string) (string, error) {
	cleanName := filepath.Clean(filepath.FromSlash(name))
	target := filepath.Join(root, cleanName)
	cleanRoot, err := filepath.Abs(root)
	if err != nil {
		return "", err
	}
	cleanTarget, err := filepath.Abs(target)
	if err != nil {
		return "", err
	}
	if cleanTarget != cleanRoot && !strings.HasPrefix(cleanTarget, cleanRoot+string(os.PathSeparator)) {
		return "", fmt.Errorf("archive path escapes destination: %s", name)
	}
	return cleanTarget, nil
}

func progressPercent(downloaded int64, total int64) int64 {
	if total <= 0 {
		return 0
	}
	return min(downloaded*100/total, 100)
}

func byteCount(n int64) string {
	if n <= 0 {
		return "unknown"
	}
	const unit = 1024
	if n < unit {
		return fmt.Sprintf("%d B", n)
	}
	div, exp := int64(unit), 0
	for n/div >= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %ciB", float64(n)/float64(div), "KMGTPE"[exp])
}

func findHomebrew() (string, error) {
	for _, path := range []string{"/opt/homebrew/bin/brew", "/usr/local/bin/brew"} {
		if _, err := os.Stat(path); err == nil {
			return path, nil
		}
	}
	if path, err := exec.LookPath("brew"); err == nil {
		return path, nil
	}
	return "", errors.New("brew not found")
}

func scanCommandOutput(wg *sync.WaitGroup, reader io.Reader, source string, emit func(string, string)) {
	defer wg.Done()
	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" {
			emit(source, line)
		}
	}
}
