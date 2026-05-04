package controllers

import (
	"bookManager/middleware"
	"bookManager/models"
	"bookManager/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Nickname string `json:"nickname"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
}

type UpdateUserRequest struct {
	Nickname *string `json:"nickname"`
	Email    *string `json:"email"`
	Phone    *string `json:"phone"`
	Avatar   *string `json:"avatar"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var user models.User
	if err := models.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, utils.Error(401, "用户名或密码错误"))
		return
	}

	if user.Status != 1 {
		c.JSON(http.StatusForbidden, utils.Error(403, "账号已被禁用"))
		return
	}

	if !utils.VerifyMD5(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, utils.Error(401, "用户名或密码错误"))
		return
	}

	token, err := middleware.GenerateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "生成token失败"))
		return
	}

	c.JSON(http.StatusOK, utils.Success(gin.H{
		"token": token,
		"user":  user,
	}))
}

func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var existingUser models.User
	if err := models.DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "用户名已存在"))
		return
	}

	user := models.User{
		Username: req.Username,
		Password: utils.MD5Hash(req.Password),
		Nickname: req.Nickname,
		Email:    req.Email,
		Phone:    req.Phone,
		Role:     "user",
		Status:   1,
	}

	if err := models.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "注册失败"))
		return
	}

	token, err := middleware.GenerateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "生成token失败"))
		return
	}

	c.JSON(http.StatusOK, utils.Success(gin.H{
		"token": token,
		"user":  user,
	}))
}

func GetCurrentUser(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var user models.User
	if err := models.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "用户不存在"))
		return
	}

	c.JSON(http.StatusOK, utils.Success(user))
}

func UpdateUser(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	updates := make(map[string]interface{})
	if req.Nickname != nil {
		updates["nickname"] = *req.Nickname
	}
	if req.Email != nil {
		updates["email"] = *req.Email
	}
	if req.Phone != nil {
		updates["phone"] = *req.Phone
	}
	if req.Avatar != nil {
		updates["avatar"] = *req.Avatar
	}

	if err := models.DB.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "更新失败"))
		return
	}

	var user models.User
	models.DB.First(&user, userID)

	c.JSON(http.StatusOK, utils.Success(user))
}

func ChangePassword(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var user models.User
	if err := models.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "用户不存在"))
		return
	}

	if !utils.VerifyMD5(req.OldPassword, user.Password) {
		c.JSON(http.StatusBadRequest, utils.Error(400, "原密码错误"))
		return
	}

	if err := models.DB.Model(&user).Update("password", utils.MD5Hash(req.NewPassword)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "修改密码失败"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessWithMessage("密码修改成功", nil))
}

func AdminListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	keyword := c.Query("keyword")
	status := c.Query("status")

	query := models.DB.Model(&models.User{})

	if keyword != "" {
		query = query.Where("username LIKE ? OR nickname LIKE ? OR email LIKE ?", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var users []models.User
	offset := (page - 1) * pageSize
	query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&users)

	c.JSON(http.StatusOK, utils.Page(users, total, page, pageSize))
}

func AdminToggleUserStatus(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var user models.User
	if err := models.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "用户不存在"))
		return
	}

	newStatus := 1
	if user.Status == 1 {
		newStatus = 0
	}

	if err := models.DB.Model(&user).Update("status", newStatus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "操作失败"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessWithMessage("操作成功", gin.H{
		"id":     user.ID,
		"status": newStatus,
	}))
}

func AdminGetUser(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	var user models.User
	if err := models.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "用户不存在"))
		return
	}

	c.JSON(http.StatusOK, utils.Success(user))
}
