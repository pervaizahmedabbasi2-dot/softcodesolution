package softcodesolution_platform

type ModuleDescriptor struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Category    string  `json:"category"`
	Description string  `json:"description"`
	Tier        string  `json:"tier"`
	Status      string  `json:"status"`
	MonthlyUSD  float64 `json:"monthlyUsd"`
}

type PlatformKernel struct {
	CompanyName    string             `json:"companyName"`
	Founder        string             `json:"founder"`
	Version        string             `json:"version"`
	ActiveModules  []ModuleDescriptor `json:"activeModules"`
	TotalInventory int                `json:"totalInventory"`
}

func NewPlatformKernel() *PlatformKernel {
	return &PlatformKernel{
		CompanyName:    "SoftCode Solution",
		Founder:        "Pervaiz Ahmed Abbasi",
		Version:        "v2026.4.1",
		TotalInventory: 221,
	}
}
