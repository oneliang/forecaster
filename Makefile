.PHONY: all dev test build clean

all: test build

# Run all tests
test:
	cd backend && go test -v ./internal/forecaster/...

# Build backend
build:
	cd backend && go build -o ../bin/forecaster-server ./cmd/server

# Run backend dev server
dev-backend:
	cd backend && go run cmd/server/main.go

# Run frontend dev server
dev-frontend:
	cd frontend && npm run dev

# Run both dev servers
dev:
	@echo "Starting backend on :8484 and frontend on :8400..."
	@make dev-backend &
	@make dev-frontend

# Install frontend deps
setup-frontend:
	cd frontend && npm install

# Clean build artifacts
clean:
	rm -rf bin/
	rm -rf frontend/dist/
	rm -rf frontend/node_modules/
