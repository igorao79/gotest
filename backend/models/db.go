package models

import (
	"context"
	"fmt"

	"github.com/user/auth-app/config"

	"github.com/jackc/pgx/v4/pgxpool"
)

// DB представляет соединение с базой данных
type DB struct {
	pool *pgxpool.Pool
}

// NewDB создает новое соединение с базой данных
func NewDB(config *config.Configuration) (*DB, error) {
	pool, err := pgxpool.Connect(context.Background(), config.DBUrl)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %v", err)
	}

	// Проверяем соединение
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("unable to ping database: %v", err)
	}

	return &DB{pool: pool}, nil
}

// CreateUsersTableIfNotExists создает таблицу пользователей, если она не существует
func (db *DB) CreateUsersTableIfNotExists() error {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		email VARCHAR(255) UNIQUE NOT NULL,
		password VARCHAR(255) NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);
	`

	_, err := db.pool.Exec(context.Background(), query)
	return err
}

// RegisterUser регистрирует нового пользователя
func (db *DB) RegisterUser(email, hashedPassword string) (*User, error) {
	var user User

	query := `
	INSERT INTO users (email, password) 
	VALUES ($1, $2) 
	RETURNING id, email, created_at, updated_at
	`

	err := db.pool.QueryRow(context.Background(), query, email, hashedPassword).Scan(
		&user.ID, &user.Email, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to insert user: %v", err)
	}

	return &user, nil
}

// GetUserByEmail находит пользователя по электронной почте
func (db *DB) GetUserByEmail(email string) (*User, error) {
	var user User

	query := `
	SELECT id, email, password, created_at, updated_at
	FROM users
	WHERE email = $1
	`

	err := db.pool.QueryRow(context.Background(), query, email).Scan(
		&user.ID, &user.Email, &user.Password, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("user not found: %v", err)
	}

	return &user, nil
}

// GetUserByID находит пользователя по ID
func (db *DB) GetUserByID(id int) (*User, error) {
	var user User

	query := `
	SELECT id, email, password, created_at, updated_at
	FROM users
	WHERE id = $1
	`

	err := db.pool.QueryRow(context.Background(), query, id).Scan(
		&user.ID, &user.Email, &user.Password, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("user not found: %v", err)
	}

	return &user, nil
}

// UpdateUserPassword обновляет пароль пользователя
func (db *DB) UpdateUserPassword(userID int, newHashedPassword string) error {
	query := `
	UPDATE users
	SET password = $1, updated_at = NOW()
	WHERE id = $2
	`

	_, err := db.pool.Exec(context.Background(), query, newHashedPassword, userID)
	if err != nil {
		return fmt.Errorf("failed to update password: %v", err)
	}

	return nil
}

// Close закрывает соединение с базой данных
func (db *DB) Close() {
	if db.pool != nil {
		db.pool.Close()
	}
}
