package tasks

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestParseStatusJSON(t *testing.T) {
	rawJSON := `{"session":"hashcat","guess_base":"admin","guess_base_offset":1,"guess_base_count":1,"guess_mod":"","guess_mod_offset":1,"guess_mod_count":1,"time_start":1,"estimated_stop":10,"cracked":0,"rejected":0,"restore_point":0,"restore_total":100,"restore_percent":0,"progress":[0,100],"recovered_hashes":[0,1],"recovered_salts":[0,1],"devices":[{"device_id":1,"device_name":"Mock GPU","device_type":"GPU","speed":1000,"util":99,"temp":65}],"time_start_absolute":1600000000,"estimated_stop_absolute":1600000010}`

	var status StatusJSON
	err := json.Unmarshal([]byte(rawJSON), &status)
	if err != nil {
		t.Fatalf("Failed to parse JSON: %v", err)
	}

	if status.Session != "hashcat" {
		t.Errorf("Expected session 'hashcat', got %s", status.Session)
	}
	if status.RestoreTotal != 100 {
		t.Errorf("Expected restore total 100, got %d", status.RestoreTotal)
	}
	if len(status.Devices) != 1 {
		t.Fatalf("Expected 1 device, got %d", len(status.Devices))
	}
	if status.Devices[0].Speed != 1000 {
		t.Errorf("Expected device speed 1000, got %d", status.Devices[0].Speed)
	}
}

func TestIdentifyJSONLine(t *testing.T) {
	line := `{"session":"hashcat"}`
	if !strings.HasPrefix(strings.TrimSpace(line), "{") {
		t.Errorf("Expected to identify as JSON")
	}

	line2 := `hashcat starting...`
	if strings.HasPrefix(strings.TrimSpace(line2), "{") {
		t.Errorf("Expected to not identify as JSON")
	}
}
