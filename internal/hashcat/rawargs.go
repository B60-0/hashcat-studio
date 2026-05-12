package hashcat

import (
	"fmt"
	"path/filepath"
	"strings"
	"unicode"
)

// ParseRawArgs parses a shell-style hashcat argument string without invoking a shell.
// If the user pasted a full "hashcat ..." command, the leading executable is removed.
func ParseRawArgs(input string) ([]string, error) {
	tokens, err := splitCommandLine(input)
	if err != nil {
		return nil, err
	}
	if len(tokens) == 0 {
		return nil, fmt.Errorf("missing hashcat arguments")
	}

	if isHashcatExecutable(tokens[0]) {
		tokens = tokens[1:]
	}
	if len(tokens) == 0 {
		return nil, fmt.Errorf("missing hashcat arguments")
	}

	return tokens, nil
}

func isHashcatExecutable(token string) bool {
	base := strings.ToLower(filepath.Base(token))
	return base == "hashcat" || base == "hashcat.exe" || base == "hashcat.bin"
}

func splitCommandLine(input string) ([]string, error) {
	var tokens []string
	var current strings.Builder
	var quote rune
	escaped := false
	inToken := false

	for _, r := range input {
		if escaped {
			current.WriteRune(r)
			escaped = false
			inToken = true
			continue
		}

		if r == '\\' {
			escaped = true
			inToken = true
			continue
		}

		if quote != 0 {
			if r == quote {
				quote = 0
				inToken = true
				continue
			}
			current.WriteRune(r)
			inToken = true
			continue
		}

		switch {
		case r == '\'' || r == '"':
			quote = r
			inToken = true
		case unicode.IsSpace(r):
			if inToken {
				tokens = append(tokens, current.String())
				current.Reset()
				inToken = false
			}
		default:
			current.WriteRune(r)
			inToken = true
		}
	}

	if escaped {
		current.WriteRune('\\')
	}
	if quote != 0 {
		return nil, fmt.Errorf("unterminated quote in raw arguments")
	}
	if inToken {
		tokens = append(tokens, current.String())
	}

	return tokens, nil
}
