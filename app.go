package main

import "context"

// App is the minimal Wails bridge.
// Browser/IDX mode uses HTTP APIs from web_*.go files.
type App struct {
	ctx context.Context
}

// NewApp creates the optional Wails bridge.
func NewApp() *App {
	return &App{}
}

// startup stores Wails context only.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// DatabaseStatus keeps old desktop calls safe.
// Real health checks are /healthz and /readyz.
func (a *App) DatabaseStatus() string {
	return "web-api-active"
}
