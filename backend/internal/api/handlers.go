package api

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/oneliang/forecaster/backend/internal/store"
	"github.com/oneliang/forecaster/backend/internal/forecaster"
	"github.com/shopspring/decimal"
)

// --- Project handlers ---

func (h *Handlers) CreateProject(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	p := &store.Project{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		CreatedAt:   time.Now(),
	}
	if err := h.store.SaveProject(p); err != nil {
		slog.Error("CreateProject failed", "error", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}

func (h *Handlers) ListProjects(w http.ResponseWriter, r *http.Request) {
	projects, err := h.store.ListProjects()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if projects == nil {
		projects = []*store.Project{}
	}
	json.NewEncoder(w).Encode(projects)
}

func (h *Handlers) GetProject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	p, err := h.store.GetProject(vars["id"])
	if err != nil {
		http.Error(w, "project not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(p)
}

func (h *Handlers) DeleteProject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if err := h.store.DeleteProject(vars["id"]); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// --- Record handlers ---

func (h *Handlers) CreateRecord(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]

	var req struct {
		Amount     string `json:"amount"`
		Direction  int    `json:"direction"`
		Type       int    `json:"type"`
		Time       string `json:"time"`
		AmountTime string `json:"amount_time"`
		Key        string `json:"key"`
		Note       string `json:"note"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	t, err := time.Parse("2006-01-02", req.Time)
	if err != nil {
		http.Error(w, "invalid time format, use YYYY-MM-DD", http.StatusBadRequest)
		return
	}
	at, err := time.Parse("2006-01-02", req.AmountTime)
	if err != nil {
		http.Error(w, "invalid amount_time format, use YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	rec := &store.Record{
		ProjectID:  projectID,
		Amount:     req.Amount,
		Direction:  req.Direction,
		Type:       req.Type,
		Time:       t,
		AmountTime: at,
		Key:        req.Key,
		Note:       req.Note,
	}
	if err := h.store.CreateRecord(rec); err != nil {
		slog.Error("CreateRecord failed", "error", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(rec)
}

func (h *Handlers) ListRecords(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	records, err := h.store.ListRecords(vars["id"])
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if records == nil {
		records = []*store.Record{}
	}
	json.NewEncoder(w).Encode(records)
}

func (h *Handlers) UpdateRecord(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]
	recordID := vars["rid"]

	var req struct {
		Amount     string `json:"amount"`
		Direction  int    `json:"direction"`
		Type       int    `json:"type"`
		Time       string `json:"time"`
		AmountTime string `json:"amount_time"`
		Key        string `json:"key"`
		Note       string `json:"note"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	t, err := time.Parse("2006-01-02", req.Time)
	if err != nil {
		http.Error(w, "invalid time format", http.StatusBadRequest)
		return
	}
	at, err := time.Parse("2006-01-02", req.AmountTime)
	if err != nil {
		http.Error(w, "invalid amount_time format", http.StatusBadRequest)
		return
	}

	rec := &store.Record{
		ID:         recordID,
		ProjectID:  projectID,
		Amount:     req.Amount,
		Direction:  req.Direction,
		Type:       req.Type,
		Time:       t,
		AmountTime: at,
		Key:        req.Key,
		Note:       req.Note,
	}
	if err := h.store.UpdateRecord(projectID, rec); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(rec)
}

func (h *Handlers) DeleteRecord(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if err := h.store.DeleteRecord(vars["id"], vars["rid"]); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// --- Forecast handler ---

func (h *Handlers) Forecast(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]

	records, err := h.store.ListRecords(projectID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	inputs := make([]forecaster.Input, 0, len(records))
	for _, rec := range records {
		amount, err := decimal.NewFromString(rec.Amount)
		if err != nil {
			slog.Warn("skip record with invalid amount", "record_id", rec.ID, "amount", rec.Amount)
			continue
		}
		inputs = append(inputs, forecaster.Input{
			Amount:     amount,
			Direction:  forecaster.Direction(rec.Direction),
			Type:       forecaster.ItemType(rec.Type),
			Time:       rec.Time,
			AmountTime: rec.AmountTime,
			Key:        rec.Key,
		})
	}

	result := forecaster.Forecast(inputs, forecaster.Total{})
	if result == nil {
		result = []forecaster.Output{}
	}
	json.NewEncoder(w).Encode(result)
}
