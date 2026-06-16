package store

import (
	"bufio"
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Project represents a resource forecasting project.
type Project struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

// Record represents a single resource flow entry.
type Record struct {
	ID         string    `json:"id"`
	ProjectID  string    `json:"project_id"`
	Amount     string    `json:"amount"`      // decimal string
	Direction  int       `json:"direction"`   // 0=收 1=付
	Type       int       `json:"type"`        // 0=计划应该 1=实际应该 2=实际
	Time       time.Time `json:"time"`        // 录入时间
	AmountTime time.Time `json:"amount_time"` // 发生时间
	Key        string    `json:"key"`         // 分组标识
	Note       string    `json:"note"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// Store provides file-based persistence for projects and records.
type Store struct {
	dataDir string
	mu      sync.Mutex
}

// NewStore creates a Store.
func NewStore(dataDir string) (*Store, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, err
	}
	return &Store{dataDir: dataDir}, nil
}

func (s *Store) projectDir(projectID string) string {
	return filepath.Join(s.dataDir, "projects", projectID)
}

// --- Project CRUD ---

// SaveProject persists a project.
func (s *Store) SaveProject(p *Project) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	dir := s.projectDir(p.ID)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	data, err := json.Marshal(p)
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(dir, "project.json"), data, 0644)
}

// GetProject retrieves a project by ID.
func (s *Store) GetProject(id string) (*Project, error) {
	data, err := os.ReadFile(filepath.Join(s.projectDir(id), "project.json"))
	if err != nil {
		return nil, err
	}
	var p Project
	if err := json.Unmarshal(data, &p); err != nil {
		return nil, err
	}
	return &p, nil
}

// ListProjects returns all projects.
func (s *Store) ListProjects() ([]*Project, error) {
	base := filepath.Join(s.dataDir, "projects")
	entries, err := os.ReadDir(base)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	var projects []*Project
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		p, err := s.GetProject(e.Name())
		if err != nil {
			continue
		}
		projects = append(projects, p)
	}
	return projects, nil
}

// DeleteProject removes a project and its records.
func (s *Store) DeleteProject(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return os.RemoveAll(s.projectDir(id))
}

// --- Record CRUD (JSONL) ---

func (s *Store) recordsPath(projectID string) string {
	return filepath.Join(s.projectDir(projectID), "records.jsonl")
}

// CreateRecord appends a record to the project's JSONL file.
func (s *Store) CreateRecord(r *Record) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if r.ID == "" {
		r.ID = uuid.New().String()
	}
	now := time.Now()
	if r.CreatedAt.IsZero() {
		r.CreatedAt = now
	}
	r.UpdatedAt = now

	dir := s.projectDir(r.ProjectID)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	f, err := os.OpenFile(s.recordsPath(r.ProjectID), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()

	data, err := json.Marshal(r)
	if err != nil {
		return err
	}
	_, err = f.WriteString(string(data) + "\n")
	return err
}

// ListRecords reads all records for a project.
func (s *Store) ListRecords(projectID string) ([]*Record, error) {
	f, err := os.Open(s.recordsPath(projectID))
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	defer f.Close()

	var records []*Record
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}
		var r Record
		if err := json.Unmarshal(line, &r); err != nil {
			continue
		}
		records = append(records, &r)
	}
	return records, scanner.Err()
}

// UpdateRecord replaces a record (rewrite entire JSONL).
func (s *Store) UpdateRecord(projectID string, updated *Record) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	records, err := s.readRecords(projectID)
	if err != nil {
		return err
	}

	found := false
	updated.UpdatedAt = time.Now()
	for i, r := range records {
		if r.ID == updated.ID {
			records[i] = updated
			found = true
			break
		}
	}
	if !found {
		return os.ErrNotExist
	}
	return s.writeRecords(projectID, records)
}

// DeleteRecord removes a record by ID (rewrite entire JSONL).
func (s *Store) DeleteRecord(projectID, recordID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	records, err := s.readRecords(projectID)
	if err != nil {
		return err
	}

	var filtered []*Record
	for _, r := range records {
		if r.ID != recordID {
			filtered = append(filtered, r)
		}
	}
	return s.writeRecords(projectID, filtered)
}

func (s *Store) readRecords(projectID string) ([]*Record, error) {
	f, err := os.Open(s.recordsPath(projectID))
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	defer f.Close()

	var records []*Record
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}
		var r Record
		if err := json.Unmarshal(line, &r); err != nil {
			continue
		}
		records = append(records, &r)
	}
	return records, scanner.Err()
}

func (s *Store) writeRecords(projectID string, records []*Record) error {
	dir := s.projectDir(projectID)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	f, err := os.Create(s.recordsPath(projectID))
	if err != nil {
		return err
	}
	defer f.Close()

	for _, r := range records {
		data, err := json.Marshal(r)
		if err != nil {
			return err
		}
		if _, err := f.WriteString(string(data) + "\n"); err != nil {
			return err
		}
	}
	return nil
}
