package tasks

// StatusJSON represents the JSON object emitted by Hashcat via --status-json
type StatusJSON struct {
	Session           string        `json:"session"`
	GuessBase         string        `json:"guess_base"`
	GuessBaseOffset   int64         `json:"guess_base_offset"`
	GuessBaseCount    int64         `json:"guess_base_count"`
	GuessMod          string        `json:"guess_mod"`
	GuessModOffset    int64         `json:"guess_mod_offset"`
	GuessModCount     int64         `json:"guess_mod_count"`
	TimeStart         int64         `json:"time_start"`
	EstimatedStop     int64         `json:"estimated_stop"`
	Cracked           int64         `json:"cracked"`
	Rejected          int64         `json:"rejected"`
	RestorePoint      int64         `json:"restore_point"`
	RestoreTotal      int64         `json:"restore_total"`
	RestorePercent    float64       `json:"restore_percent"`
	Progress          []int64       `json:"progress"`
	RecoveredHashes   []int64       `json:"recovered_hashes"`
	RecoveredSalts    []int64       `json:"recovered_salts"`
	Devices           []DeviceJSON  `json:"devices"`
	TimeStartAbsolute int64         `json:"time_start_absolute"`
	EstimatedStopAbsolute int64     `json:"estimated_stop_absolute"`
}

type DeviceJSON struct {
	DeviceID   int    `json:"device_id"`
	DeviceName string `json:"device_name"`
	DeviceType string `json:"device_type"`
	Speed      int64  `json:"speed"`
	Util       int    `json:"util"`
	Temp       int    `json:"temp"`
}

// LogEvent is emitted for standard log strings
type LogEvent struct {
	TaskID    string `json:"task_id"`
	Message   string `json:"message"`
	Source    string `json:"source"`
	Timestamp int64  `json:"timestamp"`
}

// UpdateEvent is emitted for JSON status updates
type UpdateEvent struct {
	TaskID    string     `json:"task_id"`
	Status    StatusJSON `json:"status"`
	State     string     `json:"state"` // e.g. "Running", "Paused", "Finished"
	Timestamp int64      `json:"timestamp"`
}

// TaskInfo is the metadata of a task sent to the frontend
type TaskInfo struct {
	ID        string   `json:"id"`
	Arguments []string `json:"arguments"`
	State     string   `json:"state"`
	CreatedAt int64    `json:"created_at"`
}
