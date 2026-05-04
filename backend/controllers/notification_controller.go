package controllers

import (
	"bookManager/models"
	"bookManager/utils"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func GetMyNotifications(c *gin.Context) {
	userID, _ := c.Get("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	isRead := c.Query("is_read")

	query := models.DB.Model(&models.Notification{}).Where("user_id = ?", userID)

	if isRead != "" {
		readVal := isRead == "true"
		query = query.Where("is_read = ?", readVal)
	}

	var total int64
	query.Count(&total)

	var notifications []models.Notification
	offset := (page - 1) * pageSize
	query.Offset(offset).Limit(pageSize).
		Order("created_at DESC").
		Find(&notifications)

	var unreadCount int64
	models.DB.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&unreadCount)

	c.JSON(http.StatusOK, utils.Success(gin.H{
		"list":        notifications,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"unread_count": unreadCount,
	}))
}

func MarkAsRead(c *gin.Context) {
	userID, _ := c.Get("user_id")

	notifID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var notification models.Notification
	if err := models.DB.First(&notification, notifID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "通知不存在"))
		return
	}

	if notification.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, utils.Error(403, "无权操作此通知"))
		return
	}

	now := time.Now()
	if err := models.DB.Model(&notification).Updates(map[string]interface{}{
		"is_read":   true,
		"read_time": now,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "操作失败"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessWithMessage("已标记为已读", nil))
}

func MarkAllAsRead(c *gin.Context) {
	userID, _ := c.Get("user_id")
	now := time.Now()

	result := models.DB.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Updates(map[string]interface{}{
			"is_read":   true,
			"read_time": now,
		})

	c.JSON(http.StatusOK, utils.SuccessWithMessage("已全部标记为已读", gin.H{
		"updated_count": result.RowsAffected,
	}))
}

func GetUnreadCount(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var count int64
	models.DB.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&count)

	c.JSON(http.StatusOK, utils.Success(gin.H{
		"unread_count": count,
	}))
}
