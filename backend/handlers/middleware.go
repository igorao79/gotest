package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/user/auth-app/config"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
)

// JWTMiddleware создает middleware для проверки JWT-токена
func JWTMiddleware(config *config.Configuration) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Требуется аутентификация"})
			c.Abort()
			return
		}

		// Проверяем формат заголовка: "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Неверный формат токена"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Парсим токен
		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			// Проверяем, что используется правильный алгоритм подписи
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(config.JWTSecret), nil
		})

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Недействительный токен"})
			c.Abort()
			return
		}

		// Проверяем, что токен действителен
		if claims, ok := token.Claims.(*Claims); ok && token.Valid {
			// Сохраняем ID пользователя в контексте запроса
			c.Set("user_id", claims.UserID)
			c.Next()
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Недействительный токен"})
			c.Abort()
			return
		}
	}
}

// CORSMiddleware создает middleware для обработки CORS
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Принимаем любые запросы в режиме разработки
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400") // 24 часа

		// Обработка preflight запросов - важно для CORS
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
