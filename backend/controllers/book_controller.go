package controllers

import (
	"bookManager/models"
	"bookManager/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CreateBookRequest struct {
	Title           string `json:"title" binding:"required"`
	Author          string `json:"author"`
	ISBN            string `json:"isbn"`
	CategoryID      uint   `json:"category_id" binding:"required"`
	Publisher       string `json:"publisher"`
	PublishDate     string `json:"publish_date"`
	Description     string `json:"description"`
	Cover           string `json:"cover"`
	TotalStock      int    `json:"total_stock"`
	AvailableStock  int    `json:"available_stock"`
	Tags            string `json:"tags"`
	IsHot           bool   `json:"is_hot"`
	IsRecommend     bool   `json:"is_recommend"`
}

type UpdateBookRequest struct {
	Title           string `json:"title"`
	Author          string `json:"author"`
	ISBN            string `json:"isbn"`
	CategoryID      uint   `json:"category_id"`
	Publisher       string `json:"publisher"`
	PublishDate     string `json:"publish_date"`
	Description     string `json:"description"`
	Cover           string `json:"cover"`
	TotalStock      *int   `json:"total_stock"`
	AvailableStock  *int   `json:"available_stock"`
	Tags            string `json:"tags"`
	IsHot           *bool  `json:"is_hot"`
	IsRecommend     *bool  `json:"is_recommend"`
	Status          *int   `json:"status"`
}

func GetHotBooks(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	var books []models.Book
	query := models.DB.Model(&models.Book{}).
		Where("status = 1 AND is_hot = true").
		Preload("Category").
		Order("borrow_count DESC").
		Limit(limit)

	query.Find(&books)

	c.JSON(http.StatusOK, utils.Success(books))
}

func GetRecommendBooks(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	var books []models.Book
	query := models.DB.Model(&models.Book{}).
		Where("status = 1 AND is_recommend = true").
		Preload("Category").
		Order("created_at DESC").
		Limit(limit)

	query.Find(&books)

	c.JSON(http.StatusOK, utils.Success(books))
}

func GetHotCategories(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	var categories []models.Category
	models.DB.Model(&models.Category{}).
		Order("book_count DESC, sort ASC").
		Limit(limit).
		Find(&categories)

	c.JSON(http.StatusOK, utils.Success(categories))
}

func SearchBooks(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	keyword := c.Query("keyword")
	categoryID := c.Query("category_id")
	sortBy := c.DefaultQuery("sort_by", "new")

	query := models.DB.Model(&models.Book{}).Where("status = 1")

	if keyword != "" {
		query = query.Where("title LIKE ? OR author LIKE ? OR tags LIKE ?", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}
	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	switch sortBy {
	case "hot":
		query = query.Order("borrow_count DESC")
	case "rating":
		query = query.Order("average_rating DESC")
	case "new":
		fallthrough
	default:
		query = query.Order("created_at DESC")
	}

	var total int64
	query.Count(&total)

	var books []models.Book
	offset := (page - 1) * pageSize
	query.Preload("Category").Offset(offset).Limit(pageSize).Find(&books)

	c.JSON(http.StatusOK, utils.Page(books, total, page, pageSize))
}

func GetBookDetail(c *gin.Context) {
	bookID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var book models.Book
	if err := models.DB.Preload("Category").First(&book, bookID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "图书不存在"))
		return
	}

	c.JSON(http.StatusOK, utils.Success(book))
}

func AdminListBooks(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	keyword := c.Query("keyword")
	categoryID := c.Query("category_id")
	status := c.Query("status")

	query := models.DB.Model(&models.Book{})

	if keyword != "" {
		query = query.Where("title LIKE ? OR author LIKE ? OR isbn LIKE ?", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}
	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var books []models.Book
	offset := (page - 1) * pageSize
	query.Preload("Category").Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&books)

	c.JSON(http.StatusOK, utils.Page(books, total, page, pageSize))
}

func AdminCreateBook(c *gin.Context) {
	var req CreateBookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	if req.ISBN != "" {
		var existingBook models.Book
		if err := models.DB.Where("isbn = ?", req.ISBN).First(&existingBook).Error; err == nil {
			c.JSON(http.StatusBadRequest, utils.Error(400, "ISBN已存在"))
			return
		}
	}

	availableStock := req.AvailableStock
	if availableStock == 0 {
		availableStock = req.TotalStock
	}

	book := models.Book{
		Title:          req.Title,
		Author:         req.Author,
		ISBN:           req.ISBN,
		CategoryID:     req.CategoryID,
		Publisher:      req.Publisher,
		PublishDate:    req.PublishDate,
		Description:    req.Description,
		Cover:          req.Cover,
		TotalStock:     req.TotalStock,
		AvailableStock: availableStock,
		Tags:           req.Tags,
		IsHot:          req.IsHot,
		IsRecommend:    req.IsRecommend,
		Status:         1,
	}

	if err := models.DB.Create(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "创建失败"))
		return
	}

	if book.CategoryID > 0 {
		models.DB.Model(&models.Category{}).Where("id = ?", book.CategoryID).
			UpdateColumn("book_count", models.DB.Model(&models.Book{}).Where("category_id = ?", book.CategoryID).Where("status = 1").Select("count(*)"))
	}

	c.JSON(http.StatusOK, utils.SuccessWithMessage("创建成功", book))
}

func AdminUpdateBook(c *gin.Context) {
	bookID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var req UpdateBookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var book models.Book
	if err := models.DB.First(&book, bookID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "图书不存在"))
		return
	}

	oldCategoryID := book.CategoryID

	updates := make(map[string]interface{})
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Author != "" {
		updates["author"] = req.Author
	}
	if req.ISBN != "" {
		updates["isbn"] = req.ISBN
	}
	if req.CategoryID > 0 {
		updates["category_id"] = req.CategoryID
	}
	if req.Publisher != "" {
		updates["publisher"] = req.Publisher
	}
	if req.PublishDate != "" {
		updates["publish_date"] = req.PublishDate
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Cover != "" {
		updates["cover"] = req.Cover
	}
	if req.TotalStock != nil {
		updates["total_stock"] = *req.TotalStock
		if req.AvailableStock == nil {
			stockDiff := *req.TotalStock - book.TotalStock
			updates["available_stock"] = book.AvailableStock + stockDiff
		}
	}
	if req.AvailableStock != nil {
		updates["available_stock"] = *req.AvailableStock
	}
	if req.Tags != "" {
		updates["tags"] = req.Tags
	}
	if req.IsHot != nil {
		updates["is_hot"] = *req.IsHot
	}
	if req.IsRecommend != nil {
		updates["is_recommend"] = *req.IsRecommend
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}

	if err := models.DB.Model(&book).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "更新失败"))
		return
	}

	var updatedBook models.Book
	models.DB.First(&updatedBook, bookID)

	if oldCategoryID != updatedBook.CategoryID {
		models.DB.Model(&models.Category{}).Where("id = ?", oldCategoryID).
			UpdateColumn("book_count", models.DB.Model(&models.Book{}).Where("category_id = ?", oldCategoryID).Where("status = 1").Select("count(*)"))
		models.DB.Model(&models.Category{}).Where("id = ?", updatedBook.CategoryID).
			UpdateColumn("book_count", models.DB.Model(&models.Book{}).Where("category_id = ?", updatedBook.CategoryID).Where("status = 1").Select("count(*)"))
	}

	c.JSON(http.StatusOK, utils.SuccessWithMessage("更新成功", updatedBook))
}

func AdminDeleteBook(c *gin.Context) {
	bookID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var book models.Book
	if err := models.DB.First(&book, bookID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "图书不存在"))
		return
	}

	if err := models.DB.Delete(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "删除失败"))
		return
	}

	models.DB.Model(&models.Category{}).Where("id = ?", book.CategoryID).
		UpdateColumn("book_count", models.DB.Model(&models.Book{}).Where("category_id = ?", book.CategoryID).Where("status = 1").Select("count(*)"))

	c.JSON(http.StatusOK, utils.SuccessWithMessage("删除成功", nil))
}

func GetAllCategories(c *gin.Context) {
	var categories []models.Category
	models.DB.Order("sort ASC, id ASC").Find(&categories)

	c.JSON(http.StatusOK, utils.Success(categories))
}

func AdminListCategories(c *gin.Context) {
	var categories []models.Category
	models.DB.Order("sort ASC, id ASC").Find(&categories)

	c.JSON(http.StatusOK, utils.Success(categories))
}

func AdminCreateCategory(c *gin.Context) {
	var category models.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	if category.Name == "" {
		c.JSON(http.StatusBadRequest, utils.Error(400, "分类名称不能为空"))
		return
	}

	var existingCategory models.Category
	if err := models.DB.Where("name = ?", category.Name).First(&existingCategory).Error; err == nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "分类名称已存在"))
		return
	}

	if err := models.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "创建失败"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessWithMessage("创建成功", category))
}

func AdminUpdateCategory(c *gin.Context) {
	categoryID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var req models.Category
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var category models.Category
	if err := models.DB.First(&category, categoryID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "分类不存在"))
		return
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Sort >= 0 {
		updates["sort"] = req.Sort
	}

	if err := models.DB.Model(&category).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "更新失败"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessWithMessage("更新成功", category))
}

func AdminDeleteCategory(c *gin.Context) {
	categoryID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var category models.Category
	if err := models.DB.First(&category, categoryID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "分类不存在"))
		return
	}

	var bookCount int64
	models.DB.Model(&models.Book{}).Where("category_id = ?", categoryID).Count(&bookCount)
	if bookCount > 0 {
		c.JSON(http.StatusBadRequest, utils.Error(400, "该分类下有图书，无法删除"))
		return
	}

	if err := models.DB.Delete(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "删除失败"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessWithMessage("删除成功", nil))
}
