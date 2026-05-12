package hashcat

import (
	"reflect"
	"testing"
)

func TestParseRawArgs(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  []string
	}{
		{
			name:  "bare args",
			input: "-m 0 -a 3 hashes.txt '?a?a?a'",
			want:  []string{"-m", "0", "-a", "3", "hashes.txt", "?a?a?a"},
		},
		{
			name:  "full command",
			input: "hashcat --show -m 1000 hashes.txt",
			want:  []string{"--show", "-m", "1000", "hashes.txt"},
		},
		{
			name:  "quoted file paths",
			input: `hashcat -m 0 "hash files/client a.txt" "word lists/rock you.txt"`,
			want:  []string{"-m", "0", "hash files/client a.txt", "word lists/rock you.txt"},
		},
		{
			name:  "escaped spaces",
			input: `hashcat -m 0 hash\ files/a.txt word\ lists/a.txt`,
			want:  []string{"-m", "0", "hash files/a.txt", "word lists/a.txt"},
		},
		{
			name:  "windows executable",
			input: `hashcat.exe --version`,
			want:  []string{"--version"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseRawArgs(tt.input)
			if err != nil {
				t.Fatalf("ParseRawArgs failed: %v", err)
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Fatalf("got %v, want %v", got, tt.want)
			}
		})
	}
}

func TestParseRawArgsRejectsEmptyInput(t *testing.T) {
	if _, err := ParseRawArgs("   "); err == nil {
		t.Fatal("expected empty input to fail")
	}
}

func TestParseRawArgsRejectsUnterminatedQuote(t *testing.T) {
	if _, err := ParseRawArgs(`hashcat -m 0 "hashes.txt`); err == nil {
		t.Fatal("expected unterminated quote to fail")
	}
}
