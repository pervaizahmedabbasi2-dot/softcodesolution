package main

import (
	"context"
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
)

type App struct {
	ctx context.Context
	db  *sql.DB
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Database Configuration
	connStr := "host=localhost port=5432 user=postgres password=Mashallah dbname=softcodesolution_db sslmode=disable"

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		fmt.Println("❌ Connection Error:", err)
		return
	}

	err = db.Ping()
	if err != nil {
		fmt.Println("❌ Database Se Rabta Nahi Ho Saka!")
	} else {
		fmt.Println("✅ Connected to PostgreSQL successfully!")
		a.db = db
	}
}

// Frontend order: fullName, email, password, role
func (a *App) RegisterUser(fullName string, email string, password string, role string) string {
	if a.db == nil {
		return "Backend Error: Database Offline"
	}

	// 1. Check if email exists
	var exists bool
	checkQuery := "SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)"
	err := a.db.QueryRow(checkQuery, email).Scan(&exists)
	if err != nil {
		return "DB Error: " + err.Error()
	}
	if exists {
		return "Error: Email pehle se register hai!"
	}

	// 2. Insert new user
	// Note: Columns names must match your DB table
	insertQuery := `INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4)`
	_, err = a.db.Exec(insertQuery, fullName, email, password, role)
	
	if err != nil {
		fmt.Println("Insert Error:", err)
		return "Registration failed! Check Table Structure."
	}

	return "Success: Account Created!"
}

func (a *App) LoginUser(email string, password string) string {
	if a.db == nil {
		return "Backend Error: Database Offline"
	}

	var dbPassword string
	err := a.db.QueryRow("SELECT password FROM users WHERE email=$1", email).Scan(&dbPassword)

	if err != nil {
		if err == sql.ErrNoRows {
			return "User nahi mila!"
		}
		return "Database error!"
	}

	if dbPassword == password {
		return "Success"
	}
	return "Password ghalat hai!"
}