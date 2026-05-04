package controllers

import (
	"bookManager/models"
	"bookManager/utils"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

const ReserveDays = 7

func ReserveBook(c *gin.Context) {
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

	var existingReserve models.ReserveRecord
	if err := models.DB.Where("user_id = ? AND book_id = ? AND status = ?", userID, req.BookID, "pending").First(&existingReserve).Error; err == nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "您已预约过此书"))
		return
	}

	var existingBorrow models.BorrowRecord
	if err := models.DB.Where("user_id = ? AND book_id = ? AND status = ?", userID, req.BookID, "borrowing").First(&existingBorrow).Error; err == nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "您已借阅过此书"))
		return
	}

	now := time.Now()
	expireDate := now.AddDate(0, 0, ReserveDays)

	reserveRecord := models.ReserveRecord{
		UserID:      userID.(uint),
		BookID:      req.BookID,
		ReserveDate: now,
		ExpireDate:  expireDate,
		Status:      "pending",
	}

	if err := models.DB.Create(&reserveRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "预约失败"))
		return
	}

	models.DB.Model(&book).Update("reserve_count", book.ReserveCount+1)

	c.JSON(http.StatusOK, utils.SuccessWithMessage("预约成功", reserveRecord))
}

func CancelReserve(c *gin.Context) {
	userID, _ := c.Get("user_id")

	reserveID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var reserveRecord models.ReserveRecord
	if err := models.DB.Preload("Book").First(&reserveRecord, reserveID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "预约记录不存在"))
		return
	}

	if reserveRecord.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, utils.Error(403, "无权操作此记录"))
		return
	}

	if reserveRecord.Status != "pending" {
		c.JSON(http.StatusBadRequest, utils.Error(400, "当前状态不可取消"))
		return
	}

	if err := models.DB.Model(&reserveRecord).Updates(map[string]interface{}{
		"status": "cancelled",
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "取消失败"))
		return
	}

	models.DB.Model(&models.Book{}).Where("id = ?", reserveRecord.BookID).
		UpdateColumn("reserve_count", models.DB.Raw("reserve_count - 1"))

	c.JSON(http.StatusOK, utils.SuccessWithMessage("取消成功", nil))
}

func GetMyReserves(c *gin.Context) {
	userID, _ := c.Get("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	status := c.Query("status")

	query := models.DB.Model(&models.ReserveRecord{}).Where("user_id = ?", userID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var records []models.ReserveRecord
	offset := (page - 1) * pageSize
	query.Preload("Book").Preload("Book.Category").
		Offset(offset).Limit(pageSize).
		Order("created_at DESC").
		Find(&records)

	c.JSON(http.StatusOK, utils.Page(records, total, page, pageSize))
}

func AdminListReserves(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	status := c.Query("status")
	keyword := c.Query("keyword")

	query := models.DB.Model(&models.ReserveRecord{})

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if keyword != "" {
		query = query.Joins("LEFT JOIN users ON reserve_records.user_id = users.id").
			Joins("LEFT JOIN books ON reserve_records.book_id = books.id").
			Where("users.username LIKE ? OR users.nickname LIKE ? OR books.title LIKE ?", 
				"%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}

	var total int64
	query.Count(&total)

	var records []models.ReserveRecord
	offset := (page - 1) * pageSize
	query.Preload("User").Preload("Book").Preload("Book.Category").
		Offset(offset).Limit(pageSize).
		Order("created_at DESC").
		Find(&records)

	c.JSON(http.StatusOK, utils.Page(records, total, page, pageSize))
}

func AdminCancelReserve(c *gin.Context) {
	reserveID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var req struct {
		CancelReason string `json:"cancel_reason"`
	}
	c.ShouldBindJSON(&req)

	var reserveRecord models.ReserveRecord
	if err := models.DB.Preload("Book").First(&reserveRecord, reserveID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "预约记录不存在"))
		return
	}

	if reserveRecord.Status != "pending" {
		c.JSON(http.StatusBadRequest, utils.Error(400, "当前状态不可取消"))
		return
	}

	if err := models.DB.Model(&reserveRecord).Updates(map[string]interface{}{
		"status":        "cancelled",
		"cancel_reason": req.CancelReason,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "操作失败"))
		return
	}

	models.DB.Model(&models.Book{}).Where("id = ?", reserveRecord.BookID).
		UpdateColumn("reserve_count", models.DB.Raw("reserve_count - 1"))

	c.JSON(http.StatusOK, utils.SuccessWithMessage("取消成功", nil))
}

func AdminSendReserveNotify(c *gin.Context) {
	reserveID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var reserveRecord models.ReserveRecord
	if err := models.DB.Preload("User").Preload("Book").First(&reserveRecord, reserveID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "预约记录不存在"))
		return
	}

	if reserveRecord.Status != "pending" {
		c.JSON(http.StatusBadRequest, utils.Error(400, "当前状态不可通知"))
		return
	}

	now := time.Now()

	notification := models.Notification{
		UserID:      reserveRecord.UserID,
		Title:       "预约图书到馆通知",
		Content:     "您预约的图书《" + reserveRecord.Book.Title + "》已可借阅，请在7天内前往借阅。",
		Type:        "reserve_notify",
		RelatedID:   &reserveRecord.ID,
		RelatedType: "reserve",
		CreatedAt:   now,
	}

	if err := models.DB.Create(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "创建通知失败"))
		return
	}

	if err := models.DB.Model(&reserveRecord).Updates(map[string]interface{}{
		"notify_status": "sent",
		"notify_time":   now,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "更新状态失败"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessWithMessage("通知已发送", nil))
}
