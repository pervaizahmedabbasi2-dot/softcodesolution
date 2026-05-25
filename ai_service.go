package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"
)

/*
========================================================
SCSBOOT AI ULTRA ENGINE
Claude-Style Professional Output
Full Import / Export + Unlimited Memory + Same-Call Fallback
========================================================
*/

type SCSBotAI struct {
	ApiKey string
	URL    string

	// Full memory unlimited rahegi.
	// AddMemory kabhi purani chat delete nahi karega.
	Memory []ChatMessage
	Mutex  sync.Mutex

	Models       []string
	CurrentModel string

	// MaxMemory sirf API request window ke liye hai.
	// Full memory export/import me complete rahegi.
	MaxMemory int
}

/*
========================================================
CONSTRUCTOR
========================================================
*/

func NewSCSBotAI(apiKey string) *SCSBotAI {
	return &SCSBotAI{
		ApiKey: apiKey,
		URL:    "https://openrouter.ai/api/v1/chat/completions",

		Models: []string{
			"deepseek/deepseek-chat",
			"qwen/qwen-2.5-72b-instruct",
			"meta-llama/llama-3.3-70b-instruct",
			"google/gemini-2.0-flash-exp:free",
		},

		CurrentModel: "deepseek/deepseek-chat",

		// Request ke andar recent 80 messages + compact summary jayegi.
		// Full memory kabhi delete nahi hogi.
		MaxMemory: 80,
	}
}

/*
========================================================
MESSAGE STRUCTURE
========================================================
*/

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

/*
========================================================
OPENROUTER REQUEST / RESPONSE
========================================================
*/

type OpenRouterRequest struct {
	Model    string        `json:"model"`
	Messages []ChatMessage `json:"messages"`

	Temperature      float64 `json:"temperature"`
	TopP             float64 `json:"top_p"`
	FrequencyPenalty float64 `json:"frequency_penalty"`
	PresencePenalty  float64 `json:"presence_penalty"`

	MaxTokens int `json:"max_tokens"`

	Route    string         `json:"route,omitempty"`
	Provider ProviderConfig `json:"provider,omitempty"`
}

type ProviderConfig struct {
	AllowFallbacks bool   `json:"allow_fallbacks"`
	RequireParams  bool   `json:"require_parameters"`
	DataCollection string `json:"data_collection"`
}

type OpenRouterResponse struct {
	Choices []struct {
		Message ChatMessage `json:"message"`
	} `json:"choices"`

	Error *OpenRouterError `json:"error,omitempty"`
}

type OpenRouterError struct {
	Message string `json:"message"`
	Code    int    `json:"code,omitempty"`
}

/*
========================================================
SMART INTENT DETECTION
========================================================
*/

func (ai *SCSBotAI) DetectIntent(prompt string) string {
	p := strings.ToLower(prompt)

	if containsAny(p, []string{
		"angular", "typescript", "tailwind", "wails", "golang", "go ",
		"code", "programming", "component", "service", "backend",
		"frontend", "api", "database", "sql", "debug", "error",
		"fix", "full code", "file", "architecture", "system design",
	}) {
		return "code"
	}

	if containsAny(p, []string{
		"why", "how", "explain", "reason", "analyze", "analysis",
		"compare", "plan", "strategy", "logic", "samjhao", "batao",
		"kaise", "kiya", "detect",
	}) {
		return "reasoning"
	}

	if containsAny(p, []string{
		"ui", "ux", "design", "landing", "dashboard", "theme",
		"layout", "beautiful", "attractive", "professional",
	}) {
		return "design"
	}

	return "general"
}

/*
========================================================
SMART MODEL ROUTER
========================================================
*/

func (ai *SCSBotAI) SelectBestModel(prompt string) string {
	intent := ai.DetectIntent(prompt)
	length := len(prompt)

	switch intent {
	case "code":
		return "qwen/qwen-2.5-72b-instruct"

	case "reasoning":
		return "deepseek/deepseek-chat"

	case "design":
		return "qwen/qwen-2.5-72b-instruct"
	}

	if length < 60 {
		return "google/gemini-2.0-flash-exp:free"
	}

	if length > 800 {
		return "meta-llama/llama-3.3-70b-instruct"
	}

	return "deepseek/deepseek-chat"
}

func (ai *SCSBotAI) GetFallbackModels(primary string) []string {
	ai.Mutex.Lock()
	models := make([]string, len(ai.Models))
	copy(models, ai.Models)
	ai.Mutex.Unlock()

	priority := []string{
		primary,
		"qwen/qwen-2.5-72b-instruct",
		"deepseek/deepseek-chat",
		"meta-llama/llama-3.3-70b-instruct",
		"google/gemini-2.0-flash-exp:free",
	}

	available := map[string]bool{}
	for _, model := range models {
		available[model] = true
	}

	seen := map[string]bool{}
	result := []string{}

	for _, model := range priority {
		if model == "" {
			continue
		}

		if !available[model] {
			continue
		}

		if seen[model] {
			continue
		}

		seen[model] = true
		result = append(result, model)
	}

	for _, model := range models {
		if !seen[model] {
			result = append(result, model)
		}
	}

	return result
}

/*
========================================================
MAIN AI FUNCTION
========================================================
*/

func (ai *SCSBotAI) AskSCSBOT(userPrompt string) (string, error) {
	userPrompt = strings.TrimSpace(userPrompt)

	if ai.ApiKey == "" {
		return "❌ API Key Missing", nil
	}

	if userPrompt == "" {
		return "⚠️ Please type a message.", nil
	}

	// Full memory me user prompt save hoga.
	ai.AddMemory("user", userPrompt)

	intent := ai.DetectIntent(userPrompt)
	primaryModel := ai.SelectBestModel(userPrompt)
	modelsToTry := ai.GetFallbackModels(primaryModel)

	systemPrompt := ai.BuildSystemPrompt(intent)
	memory := ai.GetOptimizedMemory()

	var lastErr error

	for _, model := range modelsToTry {
		ai.setCurrentModel(model)

		fmt.Println("========================================================")
		fmt.Println("🧠 SCSBOOT Prompt:", userPrompt)
		fmt.Println("🎯 Trying Model:", model)
		fmt.Println("📌 Intent:", intent)
		fmt.Println("========================================================")

		response, err := ai.callOpenRouter(model, systemPrompt, memory, intent)
		if err == nil && strings.TrimSpace(response) != "" {
			response = ai.EnhanceResponse(response)

			// Full memory me assistant response save hoga.
			ai.AddMemory("assistant", response)

			return response, nil
		}

		lastErr = err
		fmt.Println("❌ Model Failed:", model)
		if err != nil {
			fmt.Println("Reason:", err.Error())
		}
	}

	if lastErr != nil {
		return fmt.Sprintf(
			"❌ AI Engine Temporary Issue.\n\nLast Error: %s\n\nAapki chat memory safe hai. Internet/API issue fix hone ke baad isi chat se continue ho jayega.",
			lastErr.Error(),
		), nil
	}

	return "❌ AI Engine Temporary Issue. Aapki chat memory safe hai.", nil
}

/*
========================================================
OPENROUTER CALL
========================================================
*/

func (ai *SCSBotAI) callOpenRouter(
	model string,
	systemPrompt string,
	memory []ChatMessage,
	intent string,
) (string, error) {

	messages := append(
		[]ChatMessage{
			{
				Role:    "system",
				Content: systemPrompt,
			},
		},
		memory...,
	)

	reqBody := OpenRouterRequest{
		Model:    model,
		Messages: messages,

		Temperature:      ai.dynamicTemperature(intent),
		TopP:             ai.dynamicTopP(intent),
		FrequencyPenalty: 0.1,
		PresencePenalty:  0.1,

		MaxTokens: ai.dynamicMaxTokens(intent),

		Route: "fallback",

		Provider: ProviderConfig{
			AllowFallbacks: true,
			RequireParams:  false,
			DataCollection: "deny",
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(
		"POST",
		ai.URL,
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+ai.ApiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 90 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("network error: %w", err)
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("response read error: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf(
			"api status %d: %s",
			resp.StatusCode,
			clipText(string(body), 800),
		)
	}

	var aiResp OpenRouterResponse

	if err := json.Unmarshal(body, &aiResp); err != nil {
		return "", fmt.Errorf(
			"json parse error: %w | raw: %s",
			err,
			clipText(string(body), 800),
		)
	}

	if aiResp.Error != nil && strings.TrimSpace(aiResp.Error.Message) != "" {
		return "", fmt.Errorf("openrouter error: %s", aiResp.Error.Message)
	}

	if len(aiResp.Choices) == 0 {
		return "", fmt.Errorf("empty choices from model %s", model)
	}

	content := strings.TrimSpace(aiResp.Choices[0].Message.Content)

	if content == "" {
		return "", fmt.Errorf("empty response from model %s", model)
	}

	return content, nil
}

/*
========================================================
CLAUDE-STYLE SYSTEM PROMPT
========================================================
*/

func (ai *SCSBotAI) BuildSystemPrompt(intent string) string {
	base := `
You are SCSBOOT-AI Ultra Professional Engine for SoftCodeSolution.

CORE BEHAVIOR:
- Act like a premium Claude-style engineering assistant.
- Understand user intent before answering.
- Analyze privately, but show only a clear useful reasoning summary.
- Keep responses aligned with user's project and previous memory.
- User prefers Roman Urdu + simple English.
- Do not remove old code unexpectedly.
- When user asks for code, give full updated files.
- Preserve existing structure unless user asks to rebuild.
- For Wails + Angular + Tailwind + Go projects, give production-ready code.
- Be direct, practical, and professional.

MEMORY RULES:
- Full chat memory is stored in backend and can be imported/exported.
- Use compressed project memory summary plus recent messages.
- If imported chat exists, continue from that context.
- If internet/API fails, tell user memory is safe and they can continue later.

OUTPUT QUALITY:
- Clean sections.
- No fake claims.
- Explain only what is needed.
- Code must be complete, compile-aware, and stable.
- Avoid corrupting code with emoji replacements.
`

	switch intent {
	case "code":
		return base + `
TASK MODE: CODE / ARCHITECTURE
- Produce attractive, clean, high-quality code.
- Prefer complete file replacements.
- Mention exactly which file to replace.
- Keep Angular standalone + Tailwind v4 + Wails compatibility.
`

	case "reasoning":
		return base + `
TASK MODE: REASONING / ANALYSIS
- Detect the real issue.
- Give clear cause and direct fix.
- Use step-by-step summary, not hidden chain-of-thought.
`

	case "design":
		return base + `
TASK MODE: UI / UX DESIGN
- Produce premium, modern, Claude/Gemini inspired UI.
- Focus on spacing, hierarchy, responsiveness, and professional polish.
`

	default:
		return base + `
TASK MODE: GENERAL
- Be helpful, clear, and concise.
`
	}
}

/*
========================================================
DYNAMIC SETTINGS
========================================================
*/

func (ai *SCSBotAI) dynamicTemperature(intent string) float64 {
	switch intent {
	case "code":
		return 0.25
	case "reasoning":
		return 0.35
	case "design":
		return 0.55
	default:
		return 0.45
	}
}

func (ai *SCSBotAI) dynamicTopP(intent string) float64 {
	switch intent {
	case "code":
		return 0.85
	case "reasoning":
		return 0.9
	case "design":
		return 0.95
	default:
		return 0.9
	}
}

func (ai *SCSBotAI) dynamicMaxTokens(intent string) int {
	switch intent {
	case "code":
		return 6000
	case "reasoning":
		return 4500
	case "design":
		return 5500
	default:
		return 4000
	}
}

/*
========================================================
MEMORY MANAGEMENT
========================================================
*/

func (ai *SCSBotAI) AddMemory(role string, content string) {
	role = normalizeRole(role)
	content = strings.TrimSpace(content)

	if content == "" {
		return
	}

	ai.Mutex.Lock()
	defer ai.Mutex.Unlock()

	// Unlimited memory: yahan koi deletion nahi hoti.
	ai.Memory = append(ai.Memory, ChatMessage{
		Role:    role,
		Content: content,
	})
}

func (ai *SCSBotAI) GetOptimizedMemory() []ChatMessage {
	ai.Mutex.Lock()
	defer ai.Mutex.Unlock()

	memoryCopy := make([]ChatMessage, len(ai.Memory))
	copy(memoryCopy, ai.Memory)

	if len(memoryCopy) == 0 {
		return []ChatMessage{}
	}

	window := ai.MaxMemory
	if window <= 0 {
		window = 80
	}

	if len(memoryCopy) <= window {
		return memoryCopy
	}

	oldMemory := memoryCopy[:len(memoryCopy)-window]
	recentMemory := memoryCopy[len(memoryCopy)-window:]

	summary := ChatMessage{
		Role:    "system",
		Content: ai.BuildCompactMemorySummary(oldMemory),
	}

	return append([]ChatMessage{summary}, recentMemory...)
}

func (ai *SCSBotAI) BuildCompactMemorySummary(memory []ChatMessage) string {
	if len(memory) == 0 {
		return ""
	}

	lines := []string{
		"📜 COMPRESSED PROJECT MEMORY SUMMARY",
		"Full chat is stored in backend memory/export. This is compressed context for the current request.",
		"",
	}

	maxItems := 160
	start := 0

	if len(memory) > maxItems {
		start = len(memory) - maxItems

		lines = append(
			lines,
			fmt.Sprintf("Older %d messages are stored in full memory but compressed for token safety.", start),
			"",
		)
	}

	for i := start; i < len(memory); i++ {
		msg := memory[i]

		content := strings.ReplaceAll(msg.Content, "\r\n", "\n")
		content = strings.ReplaceAll(content, "\n\n", "\n")
		content = clipText(content, 450)

		lines = append(
			lines,
			fmt.Sprintf("%03d [%s]: %s", i+1, msg.Role, content),
		)
	}

	summary := strings.Join(lines, "\n")

	return clipText(summary, 22000)
}

/*
========================================================
IMPORT / EXPORT FULL CHAT
========================================================
*/

func (ai *SCSBotAI) ExportMemory() string {
	ai.Mutex.Lock()
	defer ai.Mutex.Unlock()

	data, err := json.MarshalIndent(ai.Memory, "", "  ")
	if err != nil {
		fmt.Println("❌ ExportMemory Error:", err)
		return "[]"
	}

	return string(data)
}

func (ai *SCSBotAI) ImportMemory(jsonData string) error {
	ai.Mutex.Lock()
	defer ai.Mutex.Unlock()

	memory, err := parseImportedMemory(jsonData)
	if err != nil {
		fmt.Println("❌ ImportMemory Error:", err)
		return err
	}

	ai.Memory = memory

	fmt.Println("📥 Memory Imported:", len(memory), "messages")

	return nil
}

func parseImportedMemory(jsonData string) ([]ChatMessage, error) {
	jsonData = strings.TrimSpace(jsonData)

	if jsonData == "" {
		return []ChatMessage{}, nil
	}

	var direct []ChatMessage
	if err := json.Unmarshal([]byte(jsonData), &direct); err == nil {
		return normalizeMemoryList(direct), nil
	}

	var wrapped struct {
		Memory   []ChatMessage `json:"memory"`
		Messages []ChatMessage `json:"messages"`
		Chat     []ChatMessage `json:"chat"`
		Data     []ChatMessage `json:"data"`
	}

	if err := json.Unmarshal([]byte(jsonData), &wrapped); err != nil {
		return nil, err
	}

	switch {
	case len(wrapped.Memory) > 0:
		return normalizeMemoryList(wrapped.Memory), nil
	case len(wrapped.Messages) > 0:
		return normalizeMemoryList(wrapped.Messages), nil
	case len(wrapped.Chat) > 0:
		return normalizeMemoryList(wrapped.Chat), nil
	case len(wrapped.Data) > 0:
		return normalizeMemoryList(wrapped.Data), nil
	default:
		return []ChatMessage{}, nil
	}
}

func normalizeMemoryList(input []ChatMessage) []ChatMessage {
	result := []ChatMessage{}

	for _, msg := range input {
		role := normalizeRole(msg.Role)
		content := strings.TrimSpace(msg.Content)

		if content == "" {
			continue
		}

		result = append(result, ChatMessage{
			Role:    role,
			Content: content,
		})
	}

	return result
}

/*
========================================================
MAIN.GO COMPATIBILITY FUNCTIONS
========================================================
*/

func (ai *SCSBotAI) SetModel(model string) {
	model = strings.TrimSpace(model)

	if model == "" {
		return
	}

	ai.Mutex.Lock()
	defer ai.Mutex.Unlock()

	for _, item := range ai.Models {
		if item == model {
			ai.CurrentModel = model
			fmt.Println("✅ Model Set:", model)
			return
		}
	}

	fmt.Println("⚠️ Invalid model ignored:", model)
}

func (ai *SCSBotAI) GetModels() []string {
	ai.Mutex.Lock()
	defer ai.Mutex.Unlock()

	models := make([]string, len(ai.Models))
	copy(models, ai.Models)

	return models
}

func (ai *SCSBotAI) ClearMemory() {
	ai.Mutex.Lock()
	defer ai.Mutex.Unlock()

	ai.Memory = []ChatMessage{}

	fmt.Println("🧠 Memory Cleared")
}

func (ai *SCSBotAI) GetCurrentModel() string {
	ai.Mutex.Lock()
	defer ai.Mutex.Unlock()

	return ai.CurrentModel
}

func (ai *SCSBotAI) SwitchModel() string {
	ai.AutoSwitchModel()

	return ai.GetCurrentModel()
}

func (ai *SCSBotAI) GetAIStatus() map[string]interface{} {
	ai.Mutex.Lock()
	defer ai.Mutex.Unlock()

	return map[string]interface{}{
		"active_model":   ai.CurrentModel,
		"available":      len(ai.Models),
		"memory_count":   len(ai.Memory),
		"memory_window":  ai.MaxMemory,
		"memory_mode":    "unlimited_full_chat",
		"api_configured": ai.ApiKey != "",
	}
}

/*
========================================================
AUTO SWITCH
========================================================
*/

func (ai *SCSBotAI) AutoSwitchModel() {
	ai.Mutex.Lock()
	defer ai.Mutex.Unlock()

	if len(ai.Models) == 0 {
		return
	}

	currentIndex := -1

	for i, model := range ai.Models {
		if model == ai.CurrentModel {
			currentIndex = i
			break
		}
	}

	nextIndex := 0
	if currentIndex >= 0 {
		nextIndex = (currentIndex + 1) % len(ai.Models)
	}

	ai.CurrentModel = ai.Models[nextIndex]

	fmt.Println("🔄 Switched To:", ai.CurrentModel)
}

func (ai *SCSBotAI) setCurrentModel(model string) {
	ai.Mutex.Lock()
	defer ai.Mutex.Unlock()

	ai.CurrentModel = model
}

/*
========================================================
RESPONSE ENHANCER
========================================================
*/

func (ai *SCSBotAI) EnhanceResponse(response string) string {
	// Code safe enhancer.
	// Emoji replacement intentionally disabled because it can corrupt code.
	return strings.TrimSpace(response)
}

/*
========================================================
HELPERS
========================================================
*/

func containsAny(text string, keywords []string) bool {
	for _, keyword := range keywords {
		if strings.Contains(text, keyword) {
			return true
		}
	}

	return false
}

func normalizeRole(role string) string {
	role = strings.ToLower(strings.TrimSpace(role))

	switch role {
	case "user":
		return "user"
	case "system":
		return "system"
	case "assistant":
		return "assistant"
	default:
		return "assistant"
	}
}

func clipText(text string, limit int) string {
	text = strings.TrimSpace(text)

	if limit <= 0 {
		return text
	}

	if len(text) <= limit {
		return text
	}

	return text[:limit] + "...[trimmed]"
}