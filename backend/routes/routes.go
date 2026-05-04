package routes

import (
	"bookManager/controllers"
	"bookManager/middleware"

	"github.com/gin-gonic/gin"
)

func InitRoutes(r *gin.Engine) {
	r.Use(middleware.CORSMiddleware())

	api := r.Group("/api")
	{
		api.POST("/login", controllers.Login)
		api.POST("/register", controllers.Register)

		api.GET("/books/hot", controllers.GetHotBooks)
		api.GET("/books/recommend", controllers.GetRecommendBooks)
		api.GET("/categories/hot", controllers.GetHotCategories)
		api.GET("/categories", controllers.GetAllCategories)
		api.GET("/books/search", controllers.SearchBooks)
		api.GET("/books/:id", controllers.GetBookDetail)
		api.GET("/books/:id/comments", controllers.GetBookComments)

		auth := api.Group("")
		auth.Use(middleware.JWTAuth())
		{
			auth.GET("/user/info", controllers.GetCurrentUser)
			auth.PUT("/user/info", controllers.UpdateUser)
			auth.POST("/user/password", controllers.ChangePassword)

			auth.POST("/borrow", controllers.BorrowBook)
			auth.POST("/borrow/:id/renew", controllers.RenewBook)
			auth.POST("/borrow/:id/return", controllers.ReturnBook)
			auth.GET("/borrow/my", controllers.GetMyBorrows)

			auth.POST("/reserve", controllers.ReserveBook)
			auth.POST("/reserve/:id/cancel", controllers.CancelReserve)
			auth.GET("/reserve/my", controllers.GetMyReserves)

			auth.POST("/comment", controllers.AddComment)
			auth.GET("/comment/my", controllers.GetMyComments)
			auth.POST("/comment/:id/like", controllers.LikeComment)

			auth.GET("/notifications", controllers.GetMyNotifications)
			auth.POST("/notifications/:id/read", controllers.MarkAsRead)
			auth.POST("/notifications/read-all", controllers.MarkAllAsRead)
			auth.GET("/notifications/unread-count", controllers.GetUnreadCount)

			auth.GET("/ai/sessions", controllers.GetAISessions)
			auth.POST("/ai/sessions", controllers.CreateAISession)
			auth.GET("/ai/sessions/:session_id/messages", controllers.GetAISessionMessages)
			auth.DELETE("/ai/sessions/:session_id", controllers.DeleteAISession)
			auth.POST("/ai/chat", controllers.ChatWithAI)
		}

		admin := api.Group("/admin")
		admin.Use(middleware.JWTAuth(), middleware.AdminAuth())
		{
			admin.GET("/dashboard", controllers.GetDashboardStats)

			admin.GET("/users", controllers.AdminListUsers)
			admin.GET("/users/:id", controllers.AdminGetUser)
			admin.POST("/users/:id/toggle-status", controllers.AdminToggleUserStatus)

			admin.GET("/books", controllers.AdminListBooks)
			admin.POST("/books", controllers.AdminCreateBook)
			admin.GET("/books/:id", controllers.GetBookDetail)
			admin.PUT("/books/:id", controllers.AdminUpdateBook)
			admin.DELETE("/books/:id", controllers.AdminDeleteBook)

			admin.GET("/categories", controllers.AdminListCategories)
			admin.POST("/categories", controllers.AdminCreateCategory)
			admin.PUT("/categories/:id", controllers.AdminUpdateCategory)
			admin.DELETE("/categories/:id", controllers.AdminDeleteCategory)

			admin.GET("/borrows", controllers.AdminListBorrows)
			admin.POST("/borrows/:id/return", controllers.AdminReturnBook)
			admin.POST("/borrows/:id/audit", controllers.AdminAuditBorrow)
			admin.POST("/borrows/update-overdue", controllers.AdminUpdateOverdue)

			admin.GET("/reserves", controllers.AdminListReserves)
			admin.POST("/reserves/:id/cancel", controllers.AdminCancelReserve)
			admin.POST("/reserves/:id/notify", controllers.AdminSendReserveNotify)

			admin.GET("/comments", controllers.AdminListComments)
			admin.DELETE("/comments/:id", controllers.AdminDeleteComment)

			admin.GET("/stats/borrow", controllers.GetBorrowStats)
			admin.GET("/stats/hot-books", controllers.GetHotBooksRanking)
			admin.GET("/stats/user-borrow", controllers.GetUserBorrowRanking)
			admin.GET("/stats/stock", controllers.GetStockStats)
			admin.GET("/stats/overdue", controllers.GetOverdueStats)
			admin.GET("/stats/category", controllers.GetCategoryStats)
		}
	}
}
