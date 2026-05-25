package main

import (
	"embed"
	"fmt"
	"os"

	_ "github.com/lib/pq"

	"github.com/wailsapp/wails/v2"

	"github.com/wailsapp/wails/v2/pkg/options"

	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

/*
========================================================
FRONTEND BUILD
========================================================
*/

//go:embed all:frontend/dist
var assets embed.FS

/*
========================================================
GLOBAL AI ENGINE
========================================================
*/

// OLD SYSTEM SAFE
var globalDeepSeek *SCSBotAI

/*
========================================================
MAIN
========================================================
*/

func main() {

	/*
	========================================================
	APP INSTANCE
	========================================================
	*/

	appInstance := NewApp()

	/*
	========================================================
	API KEY
	========================================================
	*/

	apiKey :=
		os.Getenv(
			"OPENROUTER_API_KEY",
		)

	/*
	========================================================
	FALLBACK KEY
	DEV ONLY
	========================================================
	*/

	if apiKey == "" {

		apiKey =
			"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"
	}

	/*
	========================================================
	SCSBOOT AI ENGINE
	========================================================
	*/

	globalDeepSeek =
		NewSCSBotAI(apiKey)

	/*
	========================================================
	STABLE FREE MODELS
	========================================================
	*/

	globalDeepSeek.Models = []string{
		"deepseek/deepseek-chat",
		"qwen/qwen-2.5-72b-instruct",
		"meta-llama/llama-3.3-70b-instruct",
		"google/gemini-2.0-flash-exp:free",
	}

	/*
	========================================================
	DEFAULT MODEL
	========================================================
	*/

	globalDeepSeek.CurrentModel =
		"deepseek/deepseek-chat"

	/*
	========================================================
	MEMORY LIMIT
	========================================================
	*/

	globalDeepSeek.MaxMemory = 100

	/*
	========================================================
	DEBUG
	========================================================
	*/

	fmt.Println(`
========================================================
🚀 SCSBOOT AI STARTED
========================================================
`)

	fmt.Println(
		"✅ Active Model:",
		globalDeepSeek.CurrentModel,
	)

	fmt.Println(
		"✅ Available Models:",
		len(globalDeepSeek.Models),
	)

	fmt.Println(
		"✅ Memory Limit:",
		globalDeepSeek.MaxMemory,
	)

	/*
	========================================================
	WAILS APP
	========================================================
	*/

	err := wails.Run(&options.App{

		Title: "softcodesolution",

		Width: 1440,

		Height: 900,

		MinWidth: 1200,

		MinHeight: 700,

		DisableResize: false,

		Frameless: false,

		StartHidden: false,

		HideWindowOnClose: false,

		AssetServer: &assetserver.Options{
			Assets: assets,
		},

		BackgroundColour: &options.RGBA{
			R: 15,
			G: 15,
			B: 15,
			A: 1,
		},

		OnStartup: appInstance.startup,

		Bind: []interface{}{
			appInstance,
		},
	})

	/*
	========================================================
	ERROR
	========================================================
	*/

	if err != nil {

		fmt.Println(
			"❌ Wails Error:",
			err.Error(),
		)
	}
}

/*
========================================================
MAIN AI FUNCTION
Frontend:
window.go.main.App.AskSCSBOT()
========================================================
*/

func (a *App) AskSCSBOT(
	userPrompt string,
) (string, error) {

	if globalDeepSeek == nil {

		return `
❌ SCSBOOT AI Engine Failed
`, nil
	}

	/*
	========================================================
	EMPTY CHECK
	========================================================
	*/

	if userPrompt == "" {

		return `
⚠️ Empty Prompt
`, nil
	}

	/*
	========================================================
	AI REQUEST
	========================================================
	*/

	response, err :=
		globalDeepSeek.
			AskSCSBOT(userPrompt)

	/*
	========================================================
	ERROR HANDLING
	========================================================
	*/

	if err != nil {

		fmt.Println(
			"❌ AI Error:",
			err.Error(),
		)

		/*
		========================================================
		AUTO MODEL SWITCH
		========================================================
		*/

		globalDeepSeek.AutoSwitchModel()

		return fmt.Sprintf(`
❌ AI Engine Temporary Issue

🔄 Auto switched model to:
%s

Try again.
`,
			globalDeepSeek.CurrentModel,
		), nil
	}

	return response, nil
}

/*
========================================================
SET MODEL
Frontend:
window.go.main.App.SetModel()
========================================================
*/

func (a *App) SetModel(
	model string,
) {

	if globalDeepSeek == nil {
		return
	}

	globalDeepSeek.SetModel(
		model,
	)

	fmt.Println(
		"✅ Model Changed:",
		model,
	)
}

/*
========================================================
GET MODELS
Frontend:
window.go.main.App.GetModels()
========================================================
*/

func (a *App) GetModels() []string {

	if globalDeepSeek == nil {

		return []string{}
	}

	return globalDeepSeek.GetModels()
}

/*
========================================================
CLEAR MEMORY
Frontend:
window.go.main.App.ClearMemory()
========================================================
*/

func (a *App) ClearMemory() {

	if globalDeepSeek == nil {
		return
	}

	globalDeepSeek.ClearMemory()

	fmt.Println(
		"🧠 Memory Cleared",
	)
}

/*
========================================================
EXPORT MEMORY
Frontend:
window.go.main.App.ExportMemory()
========================================================
*/

func (a *App) ExportMemory() string {

	if globalDeepSeek == nil {

		return ""
	}

	return globalDeepSeek.ExportMemory()
}

/*
========================================================
IMPORT MEMORY
Frontend:
window.go.main.App.ImportMemory()
========================================================
*/

func (a *App) ImportMemory(
	data string,
) error {

	if globalDeepSeek == nil {

		return nil
	}

	return globalDeepSeek.ImportMemory(
		data,
	)
}

/*
========================================================
CURRENT MODEL
Frontend:
window.go.main.App.GetCurrentModel()
========================================================
*/

func (a *App) GetCurrentModel() string {

	if globalDeepSeek == nil {

		return ""
	}

	return globalDeepSeek.CurrentModel
}

/*
========================================================
AUTO SWITCH MODEL
Frontend:
window.go.main.App.SwitchModel()
========================================================
*/

func (a *App) SwitchModel() {

	if globalDeepSeek == nil {
		return
	}

	globalDeepSeek.AutoSwitchModel()

	fmt.Println(
		"🔄 Auto Switched:",
		globalDeepSeek.CurrentModel,
	)
}

/*
========================================================
AI STATUS
Frontend:
window.go.main.App.GetAIStatus()
========================================================
*/

func (a *App) GetAIStatus() map[string]interface{} {

	if globalDeepSeek == nil {

		return map[string]interface{}{
			"status": "offline",
		}
	}

	return map[string]interface{}{
		"status":        "online",
		"model":         globalDeepSeek.CurrentModel,
		"memoryItems":   len(globalDeepSeek.Memory),
		"availableAI":   len(globalDeepSeek.Models),
		"maxMemory":     globalDeepSeek.MaxMemory,
		"fallbackRoute": true,
		"version":       "SCSBOOT AI ULTRA",
	}
}