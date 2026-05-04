package models

import (
	"bookManager/config"
	"fmt"
	"log"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Password     string    `gorm:"size:255;not null" json:"-"`
	Nickname     string    `gorm:"size:50" json:"nickname"`
	Email        string    `gorm:"size:100" json:"email"`
	Phone        string    `gorm:"size:20" json:"phone"`
	Avatar       string    `gorm:"size:255" json:"avatar"`
	Role         string    `gorm:"size:20;default:'user'" json:"role"`
	Status       int       `gorm:"default:1" json:"status"`
	BorrowCount  int       `gorm:"default:0" json:"borrow_count"`
	ReturnCount  int       `gorm:"default:0" json:"return_count"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Category struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"uniqueIndex;size:50;not null" json:"name"`
	Description string    `gorm:"size:500" json:"description"`
	Sort        int       `gorm:"default:0" json:"sort"`
	BookCount   int       `gorm:"default:0" json:"book_count"`
	ParentID    *uint     `gorm:"index" json:"parent_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Book struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Title           string    `gorm:"size:200;not null" json:"title"`
	Author          string    `gorm:"size:100" json:"author"`
	ISBN            string    `gorm:"uniqueIndex;size:50" json:"isbn"`
	CategoryID      uint      `gorm:"index;not null" json:"category_id"`
	Category        Category  `gorm:"foreignKey:CategoryID" json:"category"`
	Publisher       string    `gorm:"size:100" json:"publisher"`
	PublishDate     string    `gorm:"size:20" json:"publish_date"`
	Description     string    `gorm:"type:text" json:"description"`
	Cover           string    `gorm:"size:500" json:"cover"`
	TotalStock      int       `gorm:"default:0" json:"total_stock"`
	AvailableStock  int       `gorm:"default:0" json:"available_stock"`
	BorrowCount     int       `gorm:"default:0" json:"borrow_count"`
	ReserveCount    int       `gorm:"default:0" json:"reserve_count"`
	FavoriteCount   int       `gorm:"default:0" json:"favorite_count"`
	CommentCount    int       `gorm:"default:0" json:"comment_count"`
	AverageRating   float64   `gorm:"default:0" json:"average_rating"`
	Tags            string    `gorm:"size:500" json:"tags"`
	IsHot           bool      `gorm:"default:false" json:"is_hot"`
	IsRecommend     bool      `gorm:"default:false" json:"is_recommend"`
	Status          int       `gorm:"default:1" json:"status"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type BorrowRecord struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"index;not null" json:"user_id"`
	User         User      `gorm:"foreignKey:UserID" json:"user"`
	BookID       uint      `gorm:"index;not null" json:"book_id"`
	Book         Book      `gorm:"foreignKey:BookID" json:"book"`
	BorrowDate   time.Time `gorm:"not null" json:"borrow_date"`
	DueDate      time.Time `gorm:"not null" json:"due_date"`
	ReturnDate   *time.Time `json:"return_date"`
	Status       string    `gorm:"size:20;default:'borrowing'" json:"status"`
	RenewCount   int       `gorm:"default:0" json:"renew_count"`
	MaxRenewCount int      `gorm:"default:2" json:"max_renew_count"`
	OverdueDays  int       `gorm:"default:0" json:"overdue_days"`
	Fine         float64   `gorm:"default:0" json:"fine"`
	IsFinePaid   bool      `gorm:"default:false" json:"is_fine_paid"`
	AuditStatus  string    `gorm:"size:20;default:'pending'" json:"audit_status"`
	AuditorID    *uint     `json:"auditor_id"`
	AuditTime    *time.Time `json:"audit_time"`
	AuditRemark  string    `gorm:"size:500" json:"audit_remark"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ReserveRecord struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"index;not null" json:"user_id"`
	User         User      `gorm:"foreignKey:UserID" json:"user"`
	BookID       uint      `gorm:"index;not null" json:"book_id"`
	Book         Book      `gorm:"foreignKey:BookID" json:"book"`
	ReserveDate  time.Time `gorm:"not null" json:"reserve_date"`
	ExpireDate   time.Time `gorm:"not null" json:"expire_date"`
	Status       string    `gorm:"size:20;default:'pending'" json:"status"`
	NotifyStatus string    `gorm:"size:20;default:'pending'" json:"notify_status"`
	NotifyTime   *time.Time `json:"notify_time"`
	CancelReason string    `gorm:"size:500" json:"cancel_reason"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Comment struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"index;not null" json:"user_id"`
	User         User      `gorm:"foreignKey:UserID" json:"user"`
	BookID       uint      `gorm:"index;not null" json:"book_id"`
	Book         Book      `gorm:"foreignKey:BookID" json:"book"`
	Content      string    `gorm:"type:text;not null" json:"content"`
	Rating       int       `gorm:"default:5" json:"rating"`
	Likes        int       `gorm:"default:0" json:"likes"`
	Status       int       `gorm:"default:1" json:"status"`
	ParentID     *uint     `gorm:"index" json:"parent_id"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Notification struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"index;not null" json:"user_id"`
	Title        string    `gorm:"size:200;not null" json:"title"`
	Content      string    `gorm:"type:text" json:"content"`
	Type         string    `gorm:"size:50" json:"type"`
	IsRead       bool      `gorm:"default:false" json:"is_read"`
	ReadTime     *time.Time `json:"read_time"`
	RelatedID    *uint     `json:"related_id"`
	RelatedType  string    `gorm:"size:50" json:"related_type"`
	CreatedAt    time.Time `json:"created_at"`
}

type Favorite struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"index;not null" json:"user_id"`
	BookID       uint      `gorm:"index;not null" json:"book_id"`
	CreatedAt    time.Time `json:"created_at"`
}

type AIChatSession struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"index;not null" json:"user_id"`
	SessionID    string    `gorm:"uniqueIndex;size:64;not null" json:"session_id"`
	Title        string    `gorm:"size:200" json:"title"`
	Status       int       `gorm:"default:1" json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type AIChatMessage struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	SessionID    string    `gorm:"index;size:64;not null" json:"session_id"`
	UserID       uint      `gorm:"index;not null" json:"user_id"`
	Role         string    `gorm:"size:20;not null" json:"role"`
	Content      string    `gorm:"type:text;not null" json:"content"`
	Tokens       int       `gorm:"default:0" json:"tokens"`
	CreatedAt    time.Time `json:"created_at"`
}

func InitDB() {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=%s&parseTime=%t&loc=%s",
		config.Database.User,
		config.Database.Password,
		config.Database.Host,
		config.Database.Port,
		config.Database.Name,
		config.Database.Charset,
		config.Database.ParseTime,
		config.Database.Loc,
	)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	err = DB.AutoMigrate(
		&User{},
		&Category{},
		&Book{},
		&BorrowRecord{},
		&ReserveRecord{},
		&Comment{},
		&Notification{},
		&Favorite{},
		&AIChatSession{},
		&AIChatMessage{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	initAdminUser()

	fmt.Println("Database initialized successfully")
}

func initAdminUser() {
	var count int64
	DB.Model(&User{}).Where("role = ?", "admin").Count(&count)
	if count > 0 {
		return
	}

	admin := &User{
		Username: "admin",
		Password: "e10adc3949ba59abbe56e057f20f883e",
		Nickname: "管理员",
		Email: "admin@bookmanager.com",
		Phone: "13800138000",
		Role: "admin",
		Status: 1,
	}

	if err := DB.Create(admin).Error; err != nil {
		log.Printf("Failed to create admin user: %v", err)
	}
}
