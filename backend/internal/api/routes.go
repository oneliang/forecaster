package api

import (
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/oneliang/forecaster/backend/internal/store"
)

// Handlers holds API handler dependencies.
type Handlers struct {
	store *store.Store
}

// NewHandlers creates API handlers.
func NewHandlers(s *store.Store) *Handlers {
	return &Handlers{store: s}
}

// NewRouter sets up all API routes.
func NewRouter(h *Handlers) *mux.Router {
	r := mux.NewRouter()
	r.Use(corsMiddleware)

	// Projects
	r.HandleFunc("/api/projects", h.CreateProject).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/projects", h.ListProjects).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/projects/{id}", h.GetProject).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/projects/{id}", h.DeleteProject).Methods("DELETE", "OPTIONS")

	// Records
	r.HandleFunc("/api/projects/{id}/records", h.CreateRecord).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/projects/{id}/records", h.ListRecords).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/projects/{id}/records/{rid}", h.UpdateRecord).Methods("PUT", "OPTIONS")
	r.HandleFunc("/api/projects/{id}/records/{rid}", h.DeleteRecord).Methods("DELETE", "OPTIONS")

	// Forecast
	r.HandleFunc("/api/projects/{id}/forecast", h.Forecast).Methods("GET", "OPTIONS")

	return r
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := os.Getenv("CORS_ORIGIN")
		if origin == "" {
			origin = "http://localhost:8400"
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}
