package main

import (
	"fmt"
	"log"

	"github.com/user/auth-app/config"
	"github.com/user/auth-app/handlers"
	"github.com/user/auth-app/models"

	"github.com/gin-gonic/gin"
)

func main() {
	// Включаем отладочный режим для Gin
	gin.SetMode(gin.DebugMode)

	// Загружаем конфигурацию
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Подключаемся к базе данных
	db, err := models.NewDB(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Создаем таблицу пользователей, если она не существует
	if err := db.CreateUsersTableIfNotExists(); err != nil {
		log.Fatalf("Failed to create users table: %v", err)
	}

	// Создаем экземпляр gin
	r := gin.Default()

	// Добавляем middleware для CORS
	r.Use(handlers.CORSMiddleware())

	// Создаем обработчик аутентификации
	authHandler := handlers.NewAuthHandler(db, cfg)

	// Определяем маршруты
	api := r.Group("/api")
	{
		api.POST("/register", authHandler.Register)
		api.POST("/login", authHandler.Login)
		api.POST("/logout", authHandler.Logout)

		// Отдельный защищенный маршрут для смены пароля
		api.POST("/change-password", handlers.JWTMiddleware(cfg), authHandler.ChangePassword)

		// Другие защищенные маршруты
		protected := api.Group("/user")
		protected.Use(handlers.JWTMiddleware(cfg))
		{
			protected.GET("", func(c *gin.Context) {
				userID, _ := c.Get("user_id")
				c.JSON(200, gin.H{
					"user_id": userID,
					"message": "Вы авторизованы",
				})
			})
		}
	}

	// Выводим все зарегистрированные маршруты для отладки
	fmt.Println("Registered routes:")
	for _, route := range r.Routes() {
		fmt.Printf("Method: %s, Path: %s\n", route.Method, route.Path)
	}

	// Запускаем сервер
	port := fmt.Sprintf(":%s", cfg.Port)
	fmt.Printf("Starting server on port %s\n", cfg.Port)
	if err := r.Run(port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
