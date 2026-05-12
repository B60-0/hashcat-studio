package hashescom

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"
)

const defaultBaseURL = "https://hashes.com"

type Client struct {
	baseURL    string
	httpClient *http.Client
}

type EscrowJob struct {
	ID              int    `json:"id"`
	State           string `json:"state,omitempty"`
	CreatedAt       string `json:"createdAt"`
	LastUpdate      string `json:"lastUpdate"`
	AlgorithmName   string `json:"algorithmName"`
	AlgorithmID     int    `json:"algorithmId"`
	TotalHashes     int    `json:"totalHashes"`
	FoundHashes     int    `json:"foundHashes"`
	LeftHashes      int    `json:"leftHashes"`
	Currency        string `json:"currency"`
	PricePerHash    string `json:"pricePerHash"`
	PricePerHashUSD string `json:"pricePerHashUsd"`
	MaxCracksNeeded int    `json:"maxCracksNeeded"`
	LeftList        string `json:"leftList"`
	FoundList       string `json:"foundList,omitempty"`
}

type jobsResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	List    []EscrowJob `json:"list"`
}

func NewClient(baseURL string) *Client {
	if baseURL == "" {
		baseURL = defaultBaseURL
	}

	return &Client{
		baseURL: strings.TrimRight(baseURL, "/"),
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) ListJobs(ctx context.Context, apiKey string, accountJobs bool) ([]EscrowJob, error) {
	endpoint := "/en/api/jobs"
	if accountJobs {
		endpoint = "/en/api/jobs_self"
	}

	u, err := url.Parse(c.baseURL + endpoint)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(apiKey) != "" {
		q := u.Query()
		q.Set("key", strings.TrimSpace(apiKey))
		u.RawQuery = q.Encode()
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}

	res, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(io.LimitReader(res.Body, 4<<20))
	if err != nil {
		return nil, err
	}

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("hashes.com returned HTTP %d", res.StatusCode)
	}

	var parsed jobsResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("failed to parse hashes.com jobs response: %w", err)
	}
	if !parsed.Success {
		if parsed.Message != "" {
			return nil, errors.New(parsed.Message)
		}
		return nil, fmt.Errorf("hashes.com returned an unsuccessful jobs response")
	}

	return parsed.List, nil
}

func (c *Client) DownloadLeftList(ctx context.Context, jobID int, leftList string, apiKey string, hashesDir string) (string, error) {
	leftListURL, err := c.leftListURL(leftList, apiKey)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, leftListURL, nil)
	if err != nil {
		return "", err
	}

	res, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return "", fmt.Errorf("hashes.com returned HTTP %d while downloading the hash list", res.StatusCode)
	}

	if hashesDir == "" {
		return "", fmt.Errorf("hashes directory is not configured")
	}
	if err := os.MkdirAll(hashesDir, 0755); err != nil {
		return "", err
	}

	filename := fmt.Sprintf("hashes-com-job-%d-unfound.txt", jobID)
	if jobID <= 0 {
		filename = path.Base(leftList)
	}
	filename = sanitizeFilename(filename)
	if filename == "" || filename == "." {
		filename = "hashes-com-unfound.txt"
	}

	target := filepath.Join(hashesDir, filename)
	out, err := os.Create(target)
	if err != nil {
		return "", err
	}
	defer out.Close()

	if _, err := io.Copy(out, io.LimitReader(res.Body, 512<<20)); err != nil {
		return "", err
	}

	return target, nil
}

func (c *Client) leftListURL(leftList string, apiKey string) (string, error) {
	leftList = strings.TrimSpace(leftList)
	if leftList == "" {
		return "", fmt.Errorf("job does not include a hash list")
	}

	u, err := url.Parse(leftList)
	if err != nil {
		return "", err
	}
	if u.IsAbs() || u.Host != "" {
		return "", fmt.Errorf("unexpected hashes.com hash list URL")
	}
	cleanPath := path.Clean(u.Path)
	if !strings.HasPrefix(cleanPath, "/unfound/") {
		return "", fmt.Errorf("unexpected hashes.com hash list path")
	}

	base, err := url.Parse(c.baseURL)
	if err != nil {
		return "", err
	}
	base.Path = cleanPath
	if strings.TrimSpace(apiKey) != "" {
		q := base.Query()
		q.Set("key", strings.TrimSpace(apiKey))
		base.RawQuery = q.Encode()
	}

	return base.String(), nil
}

func sanitizeFilename(name string) string {
	return strings.Map(func(r rune) rune {
		switch r {
		case '/', '\\', ':', '*', '?', '"', '<', '>', '|':
			return '-'
		default:
			return r
		}
	}, name)
}
