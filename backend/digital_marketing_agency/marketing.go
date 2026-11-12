package digital_marketing_agency

type MarketingCampaign struct {
	ID                 string  `json:"id"`
	Client             string  `json:"client"`
	Platform           string  `json:"platform"`
	MonthlyAdBudgetUSD float64 `json:"monthlyAdBudgetUsd"`
	ROAS               string  `json:"roas"`
	Status             string  `json:"status"`
}
