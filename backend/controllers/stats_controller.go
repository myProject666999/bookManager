package controllers

import (
	"bookManager/models"
	"bookManager/utils"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type DailyBorrowStats struct {
	Date         string `json:"date"`
	BorrowCount  int64  `json:"borrow_count"`
	ReturnCount  int64  `json:"return_count"`
}

func GetDashboardStats(c *gin.Context) {
	var totalUsers int64
	models.DB.Model(&models.User{}).Where("role = ?", "user").Count(&totalUsers)

	var totalBooks int64
	models.DB.Model(&models.Book{}).Where("status = 1").Count(&totalBooks)

	var totalCategories int64
	models.DB.Model(&models.Category{}).Count(&totalCategories)

	var totalBorrows int64
	models.DB.Model(&models.BorrowRecord{}).Count(&totalBorrows)

	var borrowingCount int64
	models.DB.Model(&models.BorrowRecord{}).Where("status = ?", "borrowing").Count(&borrowingCount)

	var overdueCount int64
	now := time.Now()
	models.DB.Model(&models.BorrowRecord{}).
		Where("status = ? AND due_date < ?", "borrowing", now).
		Count(&overdueCount)

	var pendingReserves int64
	models.DB.Model(&models.ReserveRecord{}).Where("status = ?", "pending").Count(&pendingReserves)

	var totalStock int64
	models.DB.Model(&models.Book{}).Select("SUM(total_stock)").Scan(&totalStock)

	var availableStock int64
	models.DB.Model(&models.Book{}).Select("SUM(available_stock)").Scan(&availableStock)

	c.JSON(http.StatusOK, utils.Success(gin.H{
		"total_users":      totalUsers,
		"total_books":      totalBooks,
		"total_categories": totalCategories,
		"total_borrows":    totalBorrows,
		"borrowing_count":  borrowingCount,
		"overdue_count":    overdueCount,
		"pending_reserves": pendingReserves,
		"total_stock":      totalStock,
		"available_stock":  availableStock,
	}))
}

func GetBorrowStats(c *gin.Context) {
	daysStr := c.DefaultQuery("days", "30")
	days, _ := strconv.Atoi(daysStr)

	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -days)

	var stats []DailyBorrowStats

	for i := 0; i <= days; i++ {
		date := startDate.AddDate(0, 0, i).Format("2006-01-02")
		nextDate := startDate.AddDate(0, 0, i+1).Format("2006-01-02")

		var borrowCount int64
		models.DB.Model(&models.BorrowRecord{}).
			Where("created_at >= ? AND created_at < ?", date, nextDate).
			Count(&borrowCount)

		var returnCount int64
		models.DB.Model(&models.BorrowRecord{}).
			Where("return_date >= ? AND return_date < ? AND status = ?", date, nextDate, "returned").
			Count(&returnCount)

		stats = append(stats, DailyBorrowStats{
			Date:        date,
			BorrowCount: borrowCount,
			ReturnCount: returnCount,
		})
	}

	c.JSON(http.StatusOK, utils.Success(stats))
}

func GetHotBooksRanking(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	limit, _ := strconv.Atoi(limitStr)

	var books []models.Book
	models.DB.Model(&models.Book{}).
		Where("status = 1").
		Preload("Category").
		Order("borrow_count DESC").
		Limit(limit).
		Find(&books)

	result := make([]map[string]interface{}, 0)
	for _, book := range books {
		result = append(result, map[string]interface{}{
			"id":            book.ID,
			"title":         book.Title,
			"author":        book.Author,
			"cover":         book.Cover,
			"category_name": book.Category.Name,
			"borrow_count":  book.BorrowCount,
			"average_rating": book.AverageRating,
		})
	}

	c.JSON(http.StatusOK, utils.Success(result))
}

func GetUserBorrowRanking(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	limit, _ := strconv.Atoi(limitStr)

	type UserRanking struct {
		UserID      uint   `json:"user_id"`
		Username    string `json:"username"`
		Nickname    string `json:"nickname"`
		BorrowCount int64  `json:"borrow_count"`
	}

	var rankings []UserRanking
	models.DB.Model(&models.BorrowRecord{}).
		Select("borrow_records.user_id, users.username, users.nickname, COUNT(borrow_records.id) as borrow_count").
		Joins("LEFT JOIN users ON borrow_records.user_id = users.id").
		Where("users.role = ?", "user").
		Group("borrow_records.user_id").
		Order("borrow_count DESC").
		Limit(limit).
		Scan(&rankings)

	c.JSON(http.StatusOK, utils.Success(rankings))
}

func GetStockStats(c *gin.Context) {
	type CategoryStock struct {
		CategoryID     uint   `json:"category_id"`
		CategoryName   string `json:"category_name"`
		BookCount      int64  `json:"book_count"`
		TotalStock     int64  `json:"total_stock"`
		AvailableStock int64  `json:"available_stock"`
	}

	var stats []CategoryStock
	models.DB.Model(&models.Book{}).
		Select("books.category_id, categories.name as category_name, "+
			"COUNT(books.id) as book_count, "+
			"SUM(books.total_stock) as total_stock, "+
			"SUM(books.available_stock) as available_stock").
		Joins("LEFT JOIN categories ON books.category_id = categories.id").
		Where("books.status = 1").
		Group("books.category_id").
		Order("book_count DESC").
		Scan(&stats)

	c.JSON(http.StatusOK, utils.Success(stats))
}

func GetOverdueStats(c *gin.Context) {
	now := time.Now()

	var totalOverdue int64
	models.DB.Model(&models.BorrowRecord{}).
		Where("status = ? AND due_date < ?", "borrowing", now).
		Count(&totalOverdue)

	var totalFine float64
	models.DB.Model(&models.BorrowRecord{}).
		Where("status = ? AND fine > 0", "returned").
		Select("SUM(fine)").Scan(&totalFine)

	var unpaidFine float64
	models.DB.Model(&models.BorrowRecord{}).
		Where("status = ? AND fine > 0 AND is_fine_paid = ?", "returned", false).
		Select("SUM(fine)").Scan(&unpaidFine)

	type UserOverdue struct {
		UserID      uint   `json:"user_id"`
		Username    string `json:"username"`
		Nickname    string `json:"nickname"`
		OverdueCount int64 `json:"overdue_count"`
		TotalFine   float64 `json:"total_fine"`
	}

	var userOverdues []UserOverdue
	models.DB.Model(&models.BorrowRecord{}).
		Select("borrow_records.user_id, users.username, users.nickname, "+
			"COUNT(borrow_records.id) as overdue_count, "+
			"SUM(borrow_records.fine) as total_fine").
		Joins("LEFT JOIN users ON borrow_records.user_id = users.id").
		Where("borrow_records.status = ? AND borrow_records.due_date < ?", "borrowing", now).
		Group("borrow_records.user_id").
		Order("overdue_count DESC").
		Limit(20).
		Scan(&userOverdues)

	c.JSON(http.StatusOK, utils.Success(gin.H{
		"total_overdue":    totalOverdue,
		"total_fine":       totalFine,
		"unpaid_fine":      unpaidFine,
		"user_overdue_list": userOverdues,
	}))
}

func GetCategoryStats(c *gin.Context) {
	type CategoryBorrowStats struct {
		CategoryID   uint   `json:"category_id"`
		CategoryName string `json:"category_name"`
		BookCount    int64  `json:"book_count"`
		BorrowCount  int64  `json:"borrow_count"`
	}

	var stats []CategoryBorrowStats
	models.DB.Model(&models.Book{}).
		Select("books.category_id, categories.name as category_name, "+
			"COUNT(DISTINCT books.id) as book_count, "+
			"SUM(books.borrow_count) as borrow_count").
		Joins("LEFT JOIN categories ON books.category_id = categories.id").
		Where("books.status = 1").
		Group("books.category_id").
		Order("borrow_count DESC").
		Scan(&stats)

	c.JSON(http.StatusOK, utils.Success(stats))
}
