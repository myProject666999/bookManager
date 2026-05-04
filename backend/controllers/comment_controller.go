package controllers

import (
	"bookManager/models"
	"bookManager/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func AddComment(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req struct {
		BookID  uint   `json:"book_id" binding:"required"`
		Content string `json:"content" binding:"required"`
		Rating  int    `json:"rating"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	if req.Content == "" {
		c.JSON(http.StatusBadRequest, utils.Error(400, "评论内容不能为空"))
		return
	}

	if req.Rating < 1 {
		req.Rating = 5
	}
	if req.Rating > 5 {
		req.Rating = 5
	}

	comment := models.Comment{
		UserID:  userID.(uint),
		BookID:  req.BookID,
		Content: req.Content,
		Rating:  req.Rating,
		Status:  1,
	}

	if err := models.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "评论失败"))
		return
	}

	var book models.Book
	models.DB.First(&book, req.BookID)

	var totalComments int64
	models.DB.Model(&models.Comment{}).Where("book_id = ? AND status = 1", req.BookID).Count(&totalComments)

	var avgRating float64
	models.DB.Model(&models.Comment{}).Where("book_id = ? AND status = 1", req.BookID).
		Select("COALESCE(AVG(rating), 0)").Scan(&avgRating)

	models.DB.Model(&book).Updates(map[string]interface{}{
		"comment_count":  totalComments,
		"average_rating": avgRating,
	})

	c.JSON(http.StatusOK, utils.SuccessWithMessage("评论成功", comment))
}

func GetBookComments(c *gin.Context) {
	bookID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	query := models.DB.Model(&models.Comment{}).
		Where("book_id = ? AND status = 1", bookID)

	var total int64
	query.Count(&total)

	var comments []models.Comment
	offset := (page - 1) * pageSize
	query.Preload("User").
		Offset(offset).Limit(pageSize).
		Order("created_at DESC").
		Find(&comments)

	c.JSON(http.StatusOK, utils.Page(comments, total, page, pageSize))
}

func GetMyComments(c *gin.Context) {
	userID, _ := c.Get("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	query := models.DB.Model(&models.Comment{}).Where("user_id = ?", userID)

	var total int64
	query.Count(&total)

	var comments []models.Comment
	offset := (page - 1) * pageSize
	query.Preload("Book").Preload("Book.Category").
		Offset(offset).Limit(pageSize).
		Order("created_at DESC").
		Find(&comments)

	c.JSON(http.StatusOK, utils.Page(comments, total, page, pageSize))
}

func AdminListComments(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	status := c.Query("status")
	keyword := c.Query("keyword")

	query := models.DB.Model(&models.Comment{})

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if keyword != "" {
		query = query.Joins("LEFT JOIN users ON comments.user_id = users.id").
			Joins("LEFT JOIN books ON comments.book_id = books.id").
			Where("users.username LIKE ? OR users.nickname LIKE ? OR books.title LIKE ? OR comments.content LIKE ?", 
				"%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}

	var total int64
	query.Count(&total)

	var comments []models.Comment
	offset := (page - 1) * pageSize
	query.Preload("User").Preload("Book").
		Offset(offset).Limit(pageSize).
		Order("created_at DESC").
		Find(&comments)

	c.JSON(http.StatusOK, utils.Page(comments, total, page, pageSize))
}

func AdminDeleteComment(c *gin.Context) {
	commentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var comment models.Comment
	if err := models.DB.First(&comment, commentID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "评论不存在"))
		return
	}

	if err := models.DB.Delete(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "删除失败"))
		return
	}

	var totalComments int64
	models.DB.Model(&models.Comment{}).Where("book_id = ? AND status = 1", comment.BookID).Count(&totalComments)

	var avgRating float64
	models.DB.Model(&models.Comment{}).Where("book_id = ? AND status = 1", comment.BookID).
		Select("COALESCE(AVG(rating), 0)").Scan(&avgRating)

	models.DB.Model(&models.Book{}).Where("id = ?", comment.BookID).Updates(map[string]interface{}{
		"comment_count":  totalComments,
		"average_rating": avgRating,
	})

	c.JSON(http.StatusOK, utils.SuccessWithMessage("删除成功", nil))
}

func LikeComment(c *gin.Context) {
	commentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var comment models.Comment
	if err := models.DB.First(&comment, commentID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "评论不存在"))
		return
	}

	if err := models.DB.Model(&comment).Update("likes", comment.Likes+1).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "操作失败"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessWithMessage("点赞成功", gin.H{
		"id":    comment.ID,
		"likes": comment.Likes + 1,
	}))
}
