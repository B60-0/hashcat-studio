package hashcat

import (
	"reflect"
	"testing"
)

func ptrString(s string) *string { return &s }
func ptrInt(i int) *int          { return &i }
func ptrBool(b bool) *bool       { return &b }
func ptrAttackMode(a AttackMode) *AttackMode { return &a }

func TestBuild_MissingFields(t *testing.T) {
	args := HashcatArgs{}

	_, err := args.Build()
	if err == nil || err.Error() != "missing hash input" {
		t.Errorf("Expected 'missing hash input' error, got %v", err)
	}

	args.Hash = ptrString("hash.txt")
	_, err = args.Build()
	if err == nil || err.Error() != "missing hash mode" {
		t.Errorf("Expected 'missing hash mode' error, got %v", err)
	}

	args.HashMode = ptrInt(1000)
	_, err = args.Build()
	if err == nil || err.Error() != "missing attack mode" {
		t.Errorf("Expected 'missing attack mode' error, got %v", err)
	}

	args.AttackMode = ptrAttackMode(AttackModeDictionary)
	_, err = args.Build()
	if err == nil || err.Error() != "missing output file" {
		t.Errorf("Expected 'missing output file' error, got %v", err)
	}

	args.OutputFile = ptrString("out.txt")
	_, err = args.Build()
	if err == nil || err.Error() != "missing output format" {
		t.Errorf("Expected 'missing output format' error, got %v", err)
	}

	args.OutputFormat = &[]int{1, 2}
	_, err = args.Build()
	if err == nil || err.Error() != "missing dictionary for dictionary attack" {
		t.Errorf("Expected 'missing dictionary' error, got %v", err)
	}
}

func TestBuild_DictionaryAttack(t *testing.T) {
	args := HashcatArgs{
		Hash:         ptrString("hashes.txt"),
		HashMode:     ptrInt(0),
		AttackMode:   ptrAttackMode(AttackModeDictionary),
		OutputFile:   ptrString("found.txt"),
		OutputFormat: &[]int{1, 2},
		Dictionaries: &[]string{"dict1.txt", "dict2.txt"},
		Rules:        &[]string{"rule1.rule"},
		Quiet:        ptrBool(true),
		StatusTimer:  ptrInt(20),
	}

	built, err := args.Build()
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	expectedPrefix := []string{
		"--session=hashcat", "--status", "--status-json", "--status-timer=20", "--quiet",
		"-m0", "-a0", "hashes.txt", "-o", "found.txt", "--outfile-format=1,2",
		"dict1.txt", "dict2.txt", "-r", "rule1.rule",
	}

	if !reflect.DeepEqual(built, expectedPrefix) {
		t.Errorf("Expected %v, got %v", expectedPrefix, built)
	}
}

func TestBuild_MaskAttack(t *testing.T) {
	args := HashcatArgs{
		Hash:         ptrString("hashes.txt"),
		HashMode:     ptrInt(1000),
		AttackMode:   ptrAttackMode(AttackModeMask),
		OutputFile:   ptrString("found.txt"),
		OutputFormat: &[]int{1},
		Mask:         ptrString("?a?a?a?a"),
		CustomCharset1: ptrString("?l?d"),
		EnableMaskIncrementMode: ptrBool(true),
		MaskIncrementMin: ptrInt(1),
		MaskIncrementMax: ptrInt(4),
	}

	built, err := args.Build()
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	expectedPrefix := []string{
		"--session=hashcat", "--status", "--status-json", "--status-timer=10",
		"-m1000", "-a3", "hashes.txt", "-o", "found.txt", "--outfile-format=1",
		"-1", "?l?d", "?a?a?a?a", "-i", "--increment-min=1", "--increment-max=4",
	}

	if !reflect.DeepEqual(built, expectedPrefix) {
		t.Errorf("Expected %v, got %v", expectedPrefix, built)
	}
}

func TestBuild_Formatting(t *testing.T) {
	args := HashcatArgs{
		Hash:         ptrString("hashes.txt"),
		HashMode:     ptrInt(0),
		AttackMode:   ptrAttackMode(AttackModeDictionary),
		OutputFile:   ptrString("found.txt"),
		OutputFormat: &[]int{1, 2, 3},
		Dictionaries: &[]string{"dict.txt"},
		DevicesIDs:   &[]int{1, 3},
		DevicesTypes: &[]int{2},
	}

	built, err := args.Build()
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	devicesFlagFound := false
	devicesTypesFound := false
	outputFormatFound := false

	for i, arg := range built {
		if arg == "-d" && built[i+1] == "1,3" {
			devicesFlagFound = true
		}
		if arg == "-D" && built[i+1] == "2" {
			devicesTypesFound = true
		}
		if arg == "--outfile-format=1,2,3" {
			outputFormatFound = true
		}
	}

	if !devicesFlagFound || !devicesTypesFound || !outputFormatFound {
		t.Errorf("Formatting failed. Built args: %v", built)
	}
}
