package catering_services

type CateringOrder struct {
	ID       string  `json:"id"`
	Client   string  `json:"client"`
	Menu     string  `json:"menu"`
	Pax      int     `json:"pax"`
	Date     string  `json:"date"`
	TotalUSD float64 `json:"totalUsd"`
	Status   string  `json:"status"`
}
