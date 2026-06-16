package main

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"

	"github.com/oneliang/forecaster/backend/internal/api"
	"github.com/oneliang/forecaster/backend/internal/store"
	"gopkg.in/yaml.v3"
)

type config struct {
	Server struct {
		Port       int    `yaml:"port"`
		CORSOrigin string `yaml:"cors_origin"`
	} `yaml:"server"`
	Storage struct {
		DataDir string `yaml:"data_dir"`
	} `yaml:"storage"`
	Log struct {
		Level string `yaml:"level"`
		File  string `yaml:"file"`
	} `yaml:"log"`
}

func loadConfig(path string) (*config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var cfg config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}

func main() {
	configPath := "configs/config.yaml"
	// Try backend/configs/config.yaml if running from project root
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		configPath = "backend/configs/config.yaml"
	}

	cfg, err := loadConfig(configPath)
	if err != nil {
		slog.Warn("config not loaded, using defaults", "error", err)
		cfg = &config{}
		cfg.Server.Port = 8080
		cfg.Storage.DataDir = "./data"
		cfg.Log.Level = "info"
	}

	// Setup logging
	var logLevel slog.Level
	switch cfg.Log.Level {
	case "debug":
		logLevel = slog.LevelDebug
	case "warn":
		logLevel = slog.LevelWarn
	case "error":
		logLevel = slog.LevelError
	default:
		logLevel = slog.LevelInfo
	}

	if cfg.Log.File != "" {
		os.MkdirAll("logs", 0755)
		f, err := os.OpenFile(cfg.Log.File, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
		if err == nil {
			logger := slog.New(slog.NewJSONHandler(f, &slog.HandlerOptions{Level: logLevel}))
			slog.SetDefault(logger)
			defer f.Close()
		}
	}

	slog.Info("Forecaster server starting", "port", cfg.Server.Port)

	dataDir := cfg.Storage.DataDir
	if cfg.Server.CORSOrigin != "" {
		os.Setenv("CORS_ORIGIN", cfg.Server.CORSOrigin)
	}

	s, err := store.NewStore(dataDir)
	if err != nil {
		slog.Error("Failed to create store", "error", err)
		os.Exit(1)
	}

	handlers := api.NewHandlers(s)
	router := api.NewRouter(handlers)

	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	if cfg.Server.Port <= 0 {
		addr = ":8080"
	}
	slog.Info("Server listening", "addr", addr)
	if err := http.ListenAndServe(addr, router); err != nil {
		slog.Error("Server failed", "error", err)
		os.Exit(1)
	}
}
