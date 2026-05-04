package controllers

import (
	"bookManager/models"
	"bookManager/utils"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	BorrowDays = 30
	MaxRenewCount = 2
)

func BorrowBook(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req struct {
		BookID uint `json:"book_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var book models.Book
	if err := models.DB.First(&book, req.BookID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "图书不存在"))
		return
	}

	if book.AvailableStock <= 0 {
		c.JSON(http.StatusBadRequest, utils.Error(400, "图书库存不足"))
		return
	}

	var borrowCount int64
	models.DB.Model(&models.BorrowRecord{}).Where("user_id = ? AND status = ?", userID, "borrowing").Count(&borrowCount)
	if borrowCount >= 5 {
		c.JSON(http.StatusBadRequest, utils.Error(400, "借阅数量已达上限"))
		return
	}

	var existingBorrow models.BorrowRecord
	if err := models.DB.Where("user_id = ? AND book_id = ? AND status = ?", userID, req.BookID, "borrowing").First(&existingBorrow).Error; err == nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "您已借阅过此书，尚未归还"))
		return
	}

	now := time.Now()
	dueDate := now.AddDate(0, 0, BorrowDays)

	borrowRecord := models.BorrowRecord{
		UserID:         userID.(uint),
		BookID:         req.BookID,
		BorrowDate:     now,
		DueDate:        dueDate,
		Status:         "borrowing",
		RenewCount:     0,
		MaxRenewCount:  MaxRenewCount,
		AuditStatus:    "approved",
	}

	if err := models.DB.Create(&borrowRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "借阅失败"))
		return
	}

	models.DB.Model(&book).Updates(map[string]interface{}{
		"available_stock": book.AvailableStock - 1,
		"borrow_count":    book.BorrowCount + 1,
	})

	models.DB.Model(&models.User{}).Where("id = ?", userID).UpdateColumn("borrow_count", models.DB.Model(&models.BorrowRecord{}).Where("user_id = ?", userID).Select("count(*)"))

	c.JSON(http.StatusOK, utils.SuccessWithMessage("借阅成功", borrowRecord))
}

func RenewBook(c *gin.Context) {
	userID, _ := c.Get("user_id")

	borrowID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var borrowRecord models.BorrowRecord
	if err := models.DB.Preload("Book").First(&borrowRecord, borrowID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "借阅记录不存在"))
		return
	}

	if borrowRecord.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, utils.Error(403, "无权操作此记录"))
		return
	}

	if borrowRecord.Status != "borrowing" {
		c.JSON(http.StatusBadRequest, utils.Error(400, "当前状态不可续借"))
		return
	}

	if borrowRecord.RenewCount >= borrowRecord.MaxRenewCount {
		c.JSON(http.StatusBadRequest, utils.Error(400, "已达到最大续借次数"))
		return
	}

	if time.Now().After(borrowRecord.DueDate) {
		c.JSON(http.StatusBadRequest, utils.Error(400, "图书已逾期，不可续借"))
		return
	}

	newDueDate := borrowRecord.DueDate.AddDate(0, 0, BorrowDays)

	if err := models.DB.Model(&borrowRecord).Updates(map[string]interface{}{
		"due_date":    newDueDate,
		"renew_count": borrowRecord.RenewCount + 1,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "续借失败"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessWithMessage("续借成功", gin.H{
		"id":         borrowRecord.ID,
		"due_date":   newDueDate,
		"renew_count": borrowRecord.RenewCount + 1,
	}))
}

func ReturnBook(c *gin.Context) {
	userID, _ := c.Get("user_id")

	borrowID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var borrowRecord models.BorrowRecord
	if err := models.DB.Preload("Book").First(&borrowRecord, borrowID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "借阅记录不存在"))
		return
	}

	if borrowRecord.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, utils.Error(403, "无权操作此记录"))
		return
	}

	if borrowRecord.Status != "borrowing" {
		c.JSON(http.StatusBadRequest, utils.Error(400, "当前状态不可归还"))
		return
	}

	now := time.Now()
	overdueDays := 0
	fine := 0.0

	if now.After(borrowRecord.DueDate) {
		overdueDays = int(now.Sub(borrowRecord.DueDate).Hours() / 24)
		fine = float64(overdueDays) * 0.5
	}

	if err := models.DB.Model(&borrowRecord).Updates(map[string]interface{}{
		"return_date":  now,
		"status":       "returned",
		"overdue_days": overdueDays,
		"fine":         fine,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "归还失败"))
		return
	}

	models.DB.Model(&models.Book{}).Where("id = ?", borrowRecord.BookID).
		UpdateColumn("available_stock", borrowRecord.Book.AvailableStock+1)

	models.DB.Model(&models.User{}).Where("id = ?", userID).
		UpdateColumn("return_count", models.DB.Model(&models.BorrowRecord{}).Where("user_id = ? AND status = ?", userID, "returned").Select("count(*)"))

	c.JSON(http.StatusOK, utils.SuccessWithMessage("归还成功", gin.H{
		"id":           borrowRecord.ID,
		"return_date":  now,
		"overdue_days": overdueDays,
		"fine":         fine,
	}))
}

func GetMyBorrows(c *gin.Context) {
	userID, _ := c.Get("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	status := c.Query("status")

	query := models.DB.Model(&models.BorrowRecord{}).Where("user_id = ?", userID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var records []models.BorrowRecord
	offset := (page - 1) * pageSize
	query.Preload("Book").Preload("Book.Category").
		Offset(offset).Limit(pageSize).
		Order("created_at DESC").
		Find(&records)

	c.JSON(http.StatusOK, utils.Page(records, total, page, pageSize))
}

func AdminListBorrows(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	status := c.Query("status")
	keyword := c.Query("keyword")
	isOverdue := c.Query("is_overdue")

	query := models.DB.Model(&models.BorrowRecord{})

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if keyword != "" {
		query = query.Joins("LEFT JOIN users ON borrow_records.user_id = users.id").
			Joins("LEFT JOIN books ON borrow_records.book_id = books.id").
			Where("users.username LIKE ? OR users.nickname LIKE ? OR books.title LIKE ?", 
				"%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}

	if isOverdue == "true" {
		query = query.Where("status = ? AND due_date < ?", "borrowing", time.Now())
	}

	var total int64
	query.Count(&total)

	var records []models.BorrowRecord
	offset := (page - 1) * pageSize
	query.Preload("User").Preload("Book").Preload("Book.Category").
		Offset(offset).Limit(pageSize).
		Order("created_at DESC").
		Find(&records)

	c.JSON(http.StatusOK, utils.Page(records, total, page, pageSize))
}

func AdminReturnBook(c *gin.Context) {
	borrowID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var borrowRecord models.BorrowRecord
	if err := models.DB.Preload("Book").First(&borrowRecord, borrowID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "借阅记录不存在"))
		return
	}

	if borrowRecord.Status != "borrowing" {
		c.JSON(http.StatusBadRequest, utils.Error(400, "当前状态不可归还"))
		return
	}

	now := time.Now()
	overdueDays := 0
	fine := 0.0

	if now.After(borrowRecord.DueDate) {
		overdueDays = int(now.Sub(borrowRecord.DueDate).Hours() / 24)
		fine = float64(overdueDays) * 0.5
	}

	if err := models.DB.Model(&borrowRecord).Updates(map[string]interface{}{
		"return_date":  now,
		"status":       "returned",
		"overdue_days": overdueDays,
		"fine":         fine,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "操作失败"))
		return
	}

	models.DB.Model(&models.Book{}).Where("id = ?", borrowRecord.BookID).
		UpdateColumn("available_stock", borrowRecord.Book.AvailableStock+1)

	models.DB.Model(&models.User{}).Where("id = ?", borrowRecord.UserID).
		UpdateColumn("return_count", models.DB.Model(&models.BorrowRecord{}).Where("user_id = ? AND status = ?", borrowRecord.UserID, "returned").Select("count(*)"))

	c.JSON(http.StatusOK, utils.SuccessWithMessage("归还成功", gin.H{
		"id":           borrowRecord.ID,
		"return_date":  now,
		"overdue_days": overdueDays,
		"fine":         fine,
	}))
}

func AdminAuditBorrow(c *gin.Context) {
	borrowID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var req struct {
		AuditStatus string `json:"audit_status" binding:"required"`
		AuditRemark string `json:"audit_remark"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var borrowRecord models.BorrowRecord
	if err := models.DB.First(&borrowRecord, borrowID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "借阅记录不存在"))
		return
	}

	if borrowRecord.AuditStatus != "pending" {
		c.JSON(http.StatusBadRequest, utils.Error(400, "已审核，不可重复操作"))
		return
	}

	adminID, _ := c.Get("user_id")
	now := time.Now()

	updates := map[string]interface{}{
		"audit_status":  req.AuditStatus,
		"auditor_id":    adminID,
		"audit_time":    now,
		"audit_remark":  req.AuditRemark,
	}

	if req.AuditStatus == "approved" {
		updates["status"] = "borrowing"
	} else if req.AuditStatus == "rejected" {
		updates["status"] = "rejected"
	}

	if err := models.DB.Model(&borrowRecord).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "审核失败"))
		return
	}

	if req.AuditStatus == "approved" {
		models.DB.Model(&models.Book{}).Where("id = ?", borrowRecord.BookID).
			UpdateColumn("available_stock", models.DB.Raw("available_stock - 1"))
	}

	c.JSON(http.StatusOK, utils.SuccessWithMessage("审核成功", nil))
}

func AdminUpdateOverdue(c *gin.Context) {
	now := time.Now()

	result := models.DB.Model(&models.BorrowRecord{}).
		Where("status = ? AND due_date < ?", "borrowing", now).
		Updates(map[string]interface{}{
			"overdue_days": models.DB.Raw("DATEDIFF(?, due_date)", now),
		})

	c.JSON(http.StatusOK, utils.SuccessWithMessage("逾期状态更新完成", gin.H{
		"updated_count": result.RowsAffected,
	}))
}
