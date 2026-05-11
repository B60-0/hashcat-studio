package assets

import (
	"os"
	"path/filepath"
)

// AssetManager handles wordlists, rules, and masks.
type AssetManager struct {
}

func New() *AssetManager {
	return &AssetManager{}
}

// MaxWalkDepth prevents runaway recursion from cyclic symlinks.
// filepath.Walk follows symlinks transparently, so we guard via depth instead.
const MaxWalkDepth = 32

// ScanDir safely scans a directory and returns a list of regular files.
func (am *AssetManager) ScanDir(dir string) ([]string, error) {
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		return []string{}, nil
	}

	absDir, err := filepath.Abs(dir)
	if err != nil {
		return []string{}, nil
	}

	var files []string
	err = filepath.Walk(absDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info == nil {
			return nil // skip permission errors, broken symlinks, etc.
		}

		// Skip the root directory itself
		if path == absDir {
			return nil
		}

		// Depth guard: count separators relative to root
		rel, relErr := filepath.Rel(absDir, path)
		if relErr == nil {
			depth := len(filepath.SplitList(rel))
			// A simpler depth count: count os.PathSeparator
			sepCount := 0
			for _, c := range rel {
				if c == os.PathSeparator {
					sepCount++
				}
			}
			if sepCount > MaxWalkDepth {
				if info.IsDir() {
					return filepath.SkipDir
				}
				return nil
			}
			_ = depth
		}

		if !info.IsDir() {
			files = append(files, path)
		}
		return nil
	})

	if files == nil {
		files = []string{}
	}
	return files, err
}
