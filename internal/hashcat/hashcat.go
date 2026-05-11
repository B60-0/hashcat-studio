package hashcat

// Hashcat manages the core interaction with the hashcat binary.
type Hashcat struct {
	BinaryPath string
}

func New() *Hashcat {
	return &Hashcat{}
}

// Version returns the current hashcat version.
func (h *Hashcat) Version() string {
	return "v0.0.0-placeholder"
}
