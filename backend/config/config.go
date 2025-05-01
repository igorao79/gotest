package config

import (
	"fmt"
	"os"
)

// Configuration содержит все настройки приложения
type Configuration struct {
	DBUrl     string
	JWTSecret string
	Port      string
}

// LoadConfig загружает конфигурацию
func LoadConfig() (*Configuration, error) {
	// Жестко заданные значения, если переменные среды не установлены
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		// Используем Session pooler (IPv4)
		dbURL = "postgres://postgres.vgpeaourpdsgahsreyln:Bytccf240281@aws-0-eu-north-1.pooler.supabase.com:5432/postgres"

		// Альтернативы:
		// Transaction pooler (IPv4, не поддерживает PREPARE statements):
		// dbURL = "postgres://postgres.vgpeaourpdsgahsreyln:Bytccf240281@aws-0-eu-north-1.pooler.supabase.com:6543/postgres"

		// Прямое подключение (IPv6):
		// dbURL = "postgresql://postgres:Bytccf240281@db.vgpeaourpdsgahsreyln.supabase.co:5432/postgres"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your_jwt_secret_key"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Using database URL: %s\n", dbURL)

	return &Configuration{
		DBUrl:     dbURL,
		JWTSecret: jwtSecret,
		Port:      port,
	}, nil
}
