package hashcat

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

type AttackMode int

const (
	AttackModeDictionary AttackMode = 0
	AttackModeMask       AttackMode = 3
)

// HashcatArgs represents the parameters to build a hashcat command.
// We use pointers for optional fields to differentiate between zero-values and unset values.
type HashcatArgs struct {
	Session *string

	AttackMode *AttackMode
	HashMode   *int

	Dictionaries *[]string // Files (for attack mode 0)
	Rules        *[]string // Files (for attack mode 0)

	Mask                    *string // Direct Input (for attack mode 3)
	MaskFile                *string // File (for attack mode 3)
	CustomCharset1          *string
	CustomCharset2          *string
	CustomCharset3          *string
	CustomCharset4          *string
	EnableMaskIncrementMode *bool
	MaskIncrementMin        *int
	MaskIncrementMax        *int

	Hash *string // The hash file or input hash string

	Quiet                           *bool
	DisablePotFile                  *bool
	DisableLogFile                  *bool
	EnableOptimizedKernel           *bool
	EnableSlowerCandidateGenerators *bool
	RemoveFoundHashes               *bool
	IgnoreUsernames                 *bool
	DisableSelfTest                 *bool
	IgnoreWarnings                  *bool

	DevicesIDs      *[]int
	DevicesTypes    *[]int
	WorkloadProfile *int

	DisableMonitor *bool
	TempAbort      *int

	MarkovDisable   *bool
	MarkovClassic   *bool
	MarkovThreshold *int

	ExtraArguments *[]string

	StatusTimer *int

	OutputFile   *string
	OutputFormat *[]int
}

// Build validates the parameters and constructs the argument slice for the Hashcat subprocess.
func (ha *HashcatArgs) Build() ([]string, error) {
	var args []string

	if ha.Hash == nil || *ha.Hash == "" {
		return nil, errors.New("missing hash input")
	}

	if ha.HashMode == nil {
		return nil, errors.New("missing hash mode")
	}

	if ha.AttackMode == nil {
		return nil, errors.New("missing attack mode")
	}

	if ha.OutputFile == nil || *ha.OutputFile == "" {
		return nil, errors.New("missing output file")
	}

	if ha.OutputFormat == nil || len(*ha.OutputFormat) == 0 {
		return nil, errors.New("missing output format")
	}

	session := "hashcat"
	if ha.Session != nil && *ha.Session != "" {
		session = *ha.Session
	}
	args = append(args, fmt.Sprintf("--session=%s", session))

	// Status reporting args
	args = append(args, "--status", "--status-json")
	if ha.StatusTimer != nil {
		args = append(args, fmt.Sprintf("--status-timer=%d", *ha.StatusTimer))
	} else {
		// Default status timer if not provided
		args = append(args, "--status-timer=10")
	}

	if ha.Quiet != nil && *ha.Quiet {
		args = append(args, "--quiet")
	}

	if ha.DisablePotFile != nil && *ha.DisablePotFile {
		args = append(args, "--potfile-disable")
	}

	if ha.DisableLogFile != nil && *ha.DisableLogFile {
		args = append(args, "--logfile-disable")
	}

	if ha.EnableOptimizedKernel != nil && *ha.EnableOptimizedKernel {
		args = append(args, "-O")
	}

	if ha.EnableSlowerCandidateGenerators != nil && *ha.EnableSlowerCandidateGenerators {
		args = append(args, "-S")
	}

	if ha.RemoveFoundHashes != nil && *ha.RemoveFoundHashes {
		args = append(args, "--remove")
	}

	if ha.IgnoreUsernames != nil && *ha.IgnoreUsernames {
		args = append(args, "--username")
	}

	if ha.DisableSelfTest != nil && *ha.DisableSelfTest {
		args = append(args, "--self-test-disable")
	}

	if ha.IgnoreWarnings != nil && *ha.IgnoreWarnings {
		args = append(args, "--force")
	}

	if ha.DisableMonitor != nil && *ha.DisableMonitor {
		args = append(args, "--hwmon-disable")
	} else if ha.TempAbort != nil {
		args = append(args, fmt.Sprintf("--hwmon-temp-abort=%d", *ha.TempAbort))
	}

	if ha.MarkovDisable != nil && *ha.MarkovDisable {
		args = append(args, "--markov-disable")
	}
	if ha.MarkovClassic != nil && *ha.MarkovClassic {
		args = append(args, "--markov-classic")
	}
	if ha.MarkovThreshold != nil {
		args = append(args, fmt.Sprintf("--markov-threshold=%d", *ha.MarkovThreshold))
	}

	if ha.WorkloadProfile != nil {
		args = append(args, fmt.Sprintf("-w%d", *ha.WorkloadProfile))
	}

	args = append(args, fmt.Sprintf("-m%d", *ha.HashMode))
	args = append(args, fmt.Sprintf("-a%d", *ha.AttackMode))
	args = append(args, *ha.Hash)

	if ha.DevicesIDs != nil && len(*ha.DevicesIDs) > 0 {
		args = append(args, "-d", joinInts(*ha.DevicesIDs, ","))
	}

	if ha.DevicesTypes != nil && len(*ha.DevicesTypes) > 0 {
		args = append(args, "-D", joinInts(*ha.DevicesTypes, ","))
	}

	if ha.ExtraArguments != nil && len(*ha.ExtraArguments) > 0 {
		args = append(args, *ha.ExtraArguments...)
	}

	args = append(args, "-o", *ha.OutputFile)
	args = append(args, fmt.Sprintf("--outfile-format=%s", joinInts(*ha.OutputFormat, ",")))

	switch *ha.AttackMode {
	case AttackModeDictionary:
		if ha.Dictionaries == nil || len(*ha.Dictionaries) == 0 {
			return nil, errors.New("missing dictionary for dictionary attack")
		}
		args = append(args, *ha.Dictionaries...)
		if ha.Rules != nil {
			for _, rule := range *ha.Rules {
				args = append(args, "-r", rule)
			}
		}
	case AttackModeMask:
		if ha.MaskFile != nil && *ha.MaskFile != "" {
			args = append(args, *ha.MaskFile)
		} else if ha.Mask != nil && *ha.Mask != "" {
			if ha.CustomCharset1 != nil && *ha.CustomCharset1 != "" {
				args = append(args, "-1", *ha.CustomCharset1)
			}
			if ha.CustomCharset2 != nil && *ha.CustomCharset2 != "" {
				args = append(args, "-2", *ha.CustomCharset2)
			}
			if ha.CustomCharset3 != nil && *ha.CustomCharset3 != "" {
				args = append(args, "-3", *ha.CustomCharset3)
			}
			if ha.CustomCharset4 != nil && *ha.CustomCharset4 != "" {
				args = append(args, "-4", *ha.CustomCharset4)
			}
			args = append(args, *ha.Mask)
		} else {
			return nil, errors.New("missing mask or mask file for mask attack")
		}

		if ha.EnableMaskIncrementMode != nil && *ha.EnableMaskIncrementMode {
			if ha.MaskIncrementMin == nil || ha.MaskIncrementMax == nil {
				return nil, errors.New("missing mask increment min/max")
			}
			if *ha.MaskIncrementMin > *ha.MaskIncrementMax {
				return nil, errors.New("mask increment min cannot be greater than max")
			}
			args = append(args, "-i", fmt.Sprintf("--increment-min=%d", *ha.MaskIncrementMin), fmt.Sprintf("--increment-max=%d", *ha.MaskIncrementMax))
		}
	default:
		return nil, fmt.Errorf("unsupported attack mode: %d", *ha.AttackMode)
	}

	return args, nil
}

// joinInts converts a slice of ints to a comma-separated string
func joinInts(ints []int, sep string) string {
	strs := make([]string, len(ints))
	for i, v := range ints {
		strs[i] = strconv.Itoa(v)
	}
	return strings.Join(strs, sep)
}
