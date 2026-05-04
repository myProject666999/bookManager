package config

import (
	"fmt"
	"log"

	"gopkg.in/ini.v1"
)

type ServerConfig struct {
	Port      string
	JwtSecret string
}

type DatabaseConfig struct {
	Type      string
	User      string
	Password  string
	Host      string
	Port      string
	Name      string
	Charset   string
	ParseTime bool
	Loc       string
}

type AIConfig struct {
	ApiKey  string
	BaseUrl string
	Model   string
}

var (
	Server   ServerConfig
	Database DatabaseConfig
	AI       AIConfig
)

func Init() {
	cfg, err := ini.Load("config/config.ini")
	if err != nil {
		log.Fatalf("Fail to read config file: %v", err)
	}

	loadServerConfig(cfg)
	loadDatabaseConfig(cfg)
	loadAIConfig(cfg)

	fmt.Println("Config loaded successfully")
}

func loadServerConfig(cfg *ini.File) {
	Server.Port = cfg.Section("server").Key("Port").String()
	Server.JwtSecret = cfg.Section("server").Key("JwtSecret").String()
}

func loadDatabaseConfig(cfg *ini.File) {
	Database.Type = cfg.Section("database").Key("Type").String()
	Database.User = cfg.Section("database").Key("User").String()
	Database.Password = cfg.Section("database").Key("Password").String()
	Database.Host = cfg.Section("database").Key("Host").String()
	Database.Port = cfg.Section("database").Key("Port").String()
	Database.Name = cfg.Section("database").Key("Name").String()
	Database.Charset = cfg.Section("database").Key("Charset").String()
	Database.ParseTime = cfg.Section("database").Key("ParseTime").MustBool()
	Database.Loc = cfg.Section("database").Key("Loc").String()
}

func loadAIConfig(cfg *ini.File) {
	AI.ApiKey = cfg.Section("ai").Key("ApiKey").String()
	AI.BaseUrl = cfg.Section("ai").Key("BaseUrl").String()
	AI.Model = cfg.Section("ai").Key("Model").String()
}
