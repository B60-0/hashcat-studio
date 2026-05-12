package hashescom

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestListJobsUsesPublicEndpointWithoutKey(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/en/api/jobs" {
			t.Fatalf("expected public jobs path, got %s", r.URL.Path)
		}
		if r.URL.Query().Get("key") != "" {
			t.Fatalf("did not expect key query parameter")
		}
		_, _ = w.Write([]byte(`{"success":true,"list":[{"id":5,"algorithmName":"MD5","algorithmId":0,"totalHashes":2,"foundHashes":1,"leftHashes":1,"currency":"XMR","pricePerHash":"0.1","pricePerHashUsd":"1.00","maxCracksNeeded":1,"leftList":"\/unfound\/5-test.txt"}]}`))
	}))
	defer server.Close()

	client := NewClient(server.URL)
	jobs, err := client.ListJobs(context.Background(), "", false)
	if err != nil {
		t.Fatalf("ListJobs failed: %v", err)
	}
	if len(jobs) != 1 || jobs[0].ID != 5 || jobs[0].LeftList != "/unfound/5-test.txt" {
		t.Fatalf("unexpected jobs: %#v", jobs)
	}
}

func TestListJobsUsesAccountEndpointWithKey(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/en/api/jobs_self" {
			t.Fatalf("expected account jobs path, got %s", r.URL.Path)
		}
		if r.URL.Query().Get("key") != "secret" {
			t.Fatalf("expected API key query parameter")
		}
		_, _ = w.Write([]byte(`{"success":true,"list":[]}`))
	}))
	defer server.Close()

	client := NewClient(server.URL)
	if _, err := client.ListJobs(context.Background(), "secret", true); err != nil {
		t.Fatalf("ListJobs failed: %v", err)
	}
}

func TestDownloadLeftListSavesIntoHashesDir(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/unfound/12-list.txt" {
			t.Fatalf("expected left list path, got %s", r.URL.Path)
		}
		_, _ = w.Write([]byte("hash-one\nhash-two\n"))
	}))
	defer server.Close()

	dir := t.TempDir()
	client := NewClient(server.URL)
	target, err := client.DownloadLeftList(context.Background(), 12, "/unfound/12-list.txt", "", dir)
	if err != nil {
		t.Fatalf("DownloadLeftList failed: %v", err)
	}

	if target != filepath.Join(dir, "hashes-com-job-12-unfound.txt") {
		t.Fatalf("unexpected target path: %s", target)
	}
	content, err := os.ReadFile(target)
	if err != nil {
		t.Fatalf("failed to read downloaded file: %v", err)
	}
	if string(content) != "hash-one\nhash-two\n" {
		t.Fatalf("unexpected content: %q", string(content))
	}
}

func TestDownloadLeftListRejectsUnexpectedURL(t *testing.T) {
	client := NewClient("https://hashes.com")
	if _, err := client.DownloadLeftList(context.Background(), 1, "https://example.com/unfound/list.txt", "", t.TempDir()); err == nil {
		t.Fatal("expected absolute URL to be rejected")
	}
}
