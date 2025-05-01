package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/user/auth-app/config"
	"github.com/user/auth-app/models"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
)

// AuthHandler обрабатывает запросы, связанные с аутентификацией
type AuthHandler struct {
	db        *models.DB
	jwtSecret string
}

// NewAuthHandler создает новый обработчик аутентификации
func NewAuthHandler(db *models.DB, config *config.Configuration) *AuthHandler {
	return &AuthHandler{
		db:        db,
		jwtSecret: config.JWTSecret,
	}
}

// LoginResponse представляет ответ при успешном входе
type LoginResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

// Login обрабатывает запрос на вход в систему
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Неверный формат данных"})
		return
	}

	// Ищем пользователя по email
	user, err := h.db.GetUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Неверный email или пароль"})
		return
	}

	// Проверяем пароль
	if !models.CheckPasswordHash(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Неверный email или пароль"})
		return
	}

	// Генерируем JWT токен
	token, err := h.generateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка генерации токена"})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{
		Token: token,
		User: models.User{
			ID:        user.ID,
			Email:     user.Email,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
		},
	})
}

// Register обрабатывает запрос на регистрацию
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Неверный формат данных", "error": err.Error()})
		return
	}

	// Проверяем, не существует ли уже пользователь с таким email
	existingUser, err := h.db.GetUserByEmail(req.Email)
	if err != nil {
		fmt.Printf("Error checking existing user: %v\n", err)
	}

	if existingUser != nil {
		c.JSON(http.StatusConflict, gin.H{"message": "Пользователь с таким email уже существует"})
		return
	}

	// Хешируем пароль
	hashedPassword, err := models.HashPassword(req.Password)
	if err != nil {
		fmt.Printf("Error hashing password: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка хеширования пароля", "error": err.Error()})
		return
	}

	// Регистрируем пользователя
	user, err := h.db.RegisterUser(req.Email, hashedPassword)
	if err != nil {
		fmt.Printf("Database error during registration: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка при регистрации пользователя", "error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Пользователь успешно зарегистрирован",
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
		},
	})
}

// Logout обрабатывает запрос на выход из системы
func (h *AuthHandler) Logout(c *gin.Context) {
	// В JWT-аутентификации выход обычно обрабатывается на клиенте
	// путем удаления токена, но можно добавить токен в черный список или установить куки
	c.JSON(http.StatusOK, gin.H{"message": "Выход выполнен успешно"})
}

// ChangePasswordRequest структура запроса для смены пароля
type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

// ChangePassword обрабатывает запрос на смену пароля
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	// Получаем ID пользователя из контекста (установлен JWTMiddleware)
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Пользователь не авторизован"})
		return
	}

	userID, ok := userIDInterface.(int)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка получения ID пользователя"})
		return
	}

	// Парсим запрос
	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Неверный формат данных"})
		return
	}

	// Получаем пользователя из базы данных
	user, err := h.db.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка получения данных пользователя"})
		return
	}

	// Проверяем текущий пароль
	if !models.CheckPasswordHash(req.CurrentPassword, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Неверный текущий пароль"})
		return
	}

	// Хешируем новый пароль
	newHashedPassword, err := models.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка хеширования пароля"})
		return
	}

	// Обновляем пароль в базе данных
	if err := h.db.UpdateUserPassword(userID, newHashedPassword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка при обновлении пароля"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Пароль успешно изменен"})
}

// Claims представляет данные JWT токена
type Claims struct {
	UserID int `json:"user_id"`
	jwt.StandardClaims
}

// generateJWT генерирует JWT токен для пользователя
func (h *AuthHandler) generateJWT(user *models.User) (string, error) {
	// Устанавливаем срок действия токена (24 часа)
	expirationTime := time.Now().Add(24 * time.Hour)

	// Создаем claims
	claims := &Claims{
		UserID: user.ID,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
			IssuedAt:  time.Now().Unix(),
		},
	}

	// Создаем токен с выбранным алгоритмом подписи
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Подписываем токен нашим секретным ключом
	tokenString, err := token.SignedString([]byte(h.jwtSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
