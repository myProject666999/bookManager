package main

import (
	"bookManager/config"
	"bookManager/models"
	"bookManager/routes"
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	fmt.Println("Starting BookManager Server...")

	config.Init()

	models.InitDB()

	r := gin.Default()

	routes.InitRoutes(r)

	log.Printf("Server running on port %s", config.Server.Port)
	if err := r.Run(":" + config.Server.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
