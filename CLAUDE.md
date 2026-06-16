# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Forecaster is a full-stack resource forecasting application translated from a Kotlin original. It provides a generic resource income/expense forecasting engine for scenarios involving "inflow/outflow + planned/actual" resources (funds, manpower, materials, etc.). It works by accumulating values over time granularity to help users identify future resource bottleneck timing.

## Commands

```bash
# Development
make dev                  # Run both backend (:8484) and frontend (:8400)
make dev-backend          # Backend only
make dev-frontend         # Frontend only (Vite dev server)

# Testing
make test                 # Run all backend tests (Go testing, forecaster engine only)

# Build
make build                # Build backend binary to bin/forecaster-server
cd frontend && npm run build   # Build frontend (tsc + vite build)

# Setup
make setup-frontend       # Install frontend dependencies

# Start/stop script
./start.sh                # Interactive start (prompts on port conflicts)
./start.sh --force        # Force restart (kill existing processes)
./start.sh --stop         # Stop all services
./start.sh --prod         # Production mode (CORS=*, builds static assets)

# Clean
make clean                # Remove bin/, frontend/dist/, frontend/node_modules/
```

## Architecture

Full-stack monorepo: Go backend + React SPA frontend.

### Backend (`backend/`)

- **Go 1.26** + `gorilla/mux` (router), `shopspring/decimal` (precision math), `google/uuid`, `gopkg.in/yaml.v3`
- **Entry point**: `backend/cmd/server/main.go` — loads `configs/config.yaml`, sets up structured JSON logging (`log/slog`), wires store → handlers → router → `http.ListenAndServe`
- **API layer**: `backend/internal/api/` — `routes.go` defines all routes + CORS middleware; `handlers.go` contains REST handlers
- **Forecasting engine**: `backend/internal/forecaster/` — `model.go` (Input/Output/Total/Option types) and `forecaster.go` (`Forecast()` core algorithm, 1:1 translation from Kotlin `ResourceForecaster.forecast()`)
- **Storage layer**: `backend/internal/store/record_store.go` — JSONL file-based persistence at `backend/data/projects/{project_id}/project.json` + `records.jsonl`, mutex-protected writes
- **Config**: `backend/configs/config.yaml` — port, CORS origin, data dir, log settings
- **No database** — all persistence is JSONL files on disk

### Frontend (`frontend/`)

- **React 18** + **TypeScript 5** + **Vite 5** + **Tailwind CSS v4**
- **Entry point**: `frontend/src/main.tsx` → `App.tsx` (react-router-dom v7)
- **Routes**: `/dashboard`, `/projects`, `/projects/:id`
- **Pages**: `Dashboard.tsx`, `ProjectList.tsx`, `ProjectDetail.tsx`
- **API client**: `frontend/src/api/client.ts` — Axios instance pointing to `http://localhost:8484/api` in dev, `/api` in production
- **Custom hooks**: `useAsync`, `useModal`, `useMutation`
- **No test framework** is configured for the frontend
- **No linter or formatter** is configured (TypeScript strict mode provides compile-time checks only)

### API Endpoints

All under `/api/`:
- `POST/GET /api/projects`, `GET/DELETE /api/projects/{id}`
- `POST/GET /api/projects/{id}/records`, `PUT/DELETE /api/projects/{id}/records/{rid}`
- `GET /api/projects/{id}/forecast` — reads records → converts to `[]forecaster.Input` → calls `forecaster.Forecast()` → returns `[]forecaster.Output`

### Key Design Decisions

- **Decimal precision**: All monetary/amount calculations use `shopspring/decimal` to avoid floating-point errors, matching Kotlin's `BigDecimal` behavior
- **Time granularity**: Configurable via `Option.Granularity` (default 24h), uses `time.Duration`
- **Two time fields per record**: `Time` (data entry time) and `AmountTime` (amount occurrence time) — grouped independently by date for different calculation paths
- **Design doc**: `docs/superpowers/specs/2026-06-12-forecaster-design.md` — contains the full algorithm spec, data model, and phase plan (note: the design doc references a standalone `pkg/forecaster/` module with `go.work`, but the engine was collapsed into `backend/internal/forecaster/`)

### Ports

- Backend: **8484**
- Frontend dev server: **8400**
- CORS origin configured in `backend/configs/config.yaml` (default `http://localhost:8400`)
