package controllers

import (
	"bookManager/config"
	"bookManager/models"
	"bookManager/utils"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AIChatRequest struct {
	SessionID string `json:"session_id"`
	Message   string `json:"message" binding:"required"`
}

type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIRequest struct {
	Model    string           `json:"model"`
	Messages []OpenAIMessage `json:"messages"`
}

type OpenAIResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index        int           `json:"index"`
		Message      OpenAIMessage `json:"message"`
		FinishReason string        `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

func GetAISessions(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var sessions []models.AIChatSession
	models.DB.Where("user_id = ? AND status = 1", userID).
		Order("updated_at DESC").
		Find(&sessions)

	c.JSON(http.StatusOK, utils.Success(sessions))
}

func CreateAISession(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req struct {
		Title string `json:"title"`
	}
	c.ShouldBindJSON(&req)

	sessionID := uuid.New().String()
	title := req.Title
	if title == "" {
		title = "新对话 " + time.Now().Format("2006-01-02 15:04")
	}

	session := models.AIChatSession{
		UserID:    userID.(uint),
		SessionID: sessionID,
		Title:     title,
		Status:    1,
	}

	if err := models.DB.Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "创建会话失败"))
		return
	}

	c.JSON(http.StatusOK, utils.Success(session))
}

func GetAISessionMessages(c *gin.Context) {
	userID, _ := c.Get("user_id")
	sessionID := c.Param("session_id")

	var session models.AIChatSession
	if err := models.DB.Where("session_id = ? AND user_id = ?", sessionID, userID).First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "会话不存在"))
		return
	}

	var messages []models.AIChatMessage
	models.DB.Where("session_id = ?", sessionID).
		Order("created_at ASC").
		Find(&messages)

	c.JSON(http.StatusOK, utils.Success(messages))
}

func ChatWithAI(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req AIChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.Error(400, "参数错误"))
		return
	}

	sessionID := req.SessionID
	if sessionID == "" {
		sessionID = uuid.New().String()
		title := "新对话 " + time.Now().Format("2006-01-02 15:04")
		if len(req.Message) > 30 {
			title = req.Message[:30] + "..."
		}
		session := models.AIChatSession{
			UserID:    userID.(uint),
			SessionID: sessionID,
			Title:     title,
			Status:    1,
		}
		if err := models.DB.Create(&session).Error; err != nil {
			c.JSON(http.StatusInternalServerError, utils.Error(500, "创建会话失败"))
			return
		}
	} else {
		var session models.AIChatSession
		if err := models.DB.Where("session_id = ? AND user_id = ?", sessionID, userID).First(&session).Error; err != nil {
			c.JSON(http.StatusNotFound, utils.Error(404, "会话不存在"))
			return
		}
	}

	var historyMessages []models.AIChatMessage
	models.DB.Where("session_id = ?", sessionID).
		Order("created_at ASC").
		Limit(20).
		Find(&historyMessages)

	openAIMessages := []OpenAIMessage{
		{
			Role:    "system",
			Content: "你是一个图书馆AI助手，专业回答用户关于图书、阅读、图书馆服务等相关问题。你可以推荐图书、解答图书信息、帮助用户了解图书馆规则等。请用简洁友好的语言回答用户的问题。",
		},
	}

	for _, msg := range historyMessages {
		openAIMessages = append(openAIMessages, OpenAIMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	openAIMessages = append(openAIMessages, OpenAIMessage{
		Role:    "user",
		Content: req.Message,
	})

	userMsg := models.AIChatMessage{
		SessionID: sessionID,
		UserID:    userID.(uint),
		Role:      "user",
		Content:   req.Message,
	}
	models.DB.Create(&userMsg)

	var aiResponse string
	var totalTokens int

	if config.AI.ApiKey == "your-openai-api-key" {
		aiResponse = fmt.Sprintf("这是一个模拟的AI回复。\n\n您的问题是：%s\n\n由于API密钥未配置，这是一个示例回复。请在 config/config.ini 中配置您的API密钥以获得真实的AI对话体验。", req.Message)
	} else {
		response, err := callOpenAI(openAIMessages)
		if err != nil {
			c.JSON(http.StatusInternalServerError, utils.Error(500, "AI服务调用失败："+err.Error()))
			return
		}
		if len(response.Choices) > 0 {
			aiResponse = response.Choices[0].Message.Content
			totalTokens = response.Usage.TotalTokens
		}
	}

	assistantMsg := models.AIChatMessage{
		SessionID: sessionID,
		UserID:    userID.(uint),
		Role:      "assistant",
		Content:   aiResponse,
		Tokens:    totalTokens,
	}
	models.DB.Create(&assistantMsg)

	now := time.Now()
	models.DB.Model(&models.AIChatSession{}).
		Where("session_id = ?", sessionID).
		Update("updated_at", now)

	c.JSON(http.StatusOK, utils.Success(gin.H{
		"session_id": sessionID,
		"message":    aiResponse,
		"role":       "assistant",
	}))
}

func callOpenAI(messages []OpenAIMessage) (*OpenAIResponse, error) {
	reqBody := OpenAIRequest{
		Model:    config.AI.Model,
		Messages: messages,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", config.AI.BaseUrl+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+config.AI.ApiKey)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}

func DeleteAISession(c *gin.Context) {
	userID, _ := c.Get("user_id")
	sessionID := c.Param("session_id")

	var session models.AIChatSession
	if err := models.DB.Where("session_id = ? AND user_id = ?", sessionID, userID).First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.Error(404, "会话不存在"))
		return
	}

	models.DB.Where("session_id = ?", sessionID).Delete(&models.AIChatMessage{})

	if err := models.DB.Delete(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Error(500, "删除失败"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessWithMessage("删除成功", nil))
}
