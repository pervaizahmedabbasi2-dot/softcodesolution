package solar_energy

type SolarInstallation struct {
	ID                 string  `json:"id"`
	Client             string  `json:"client"`
	CapacityKW         float64 `json:"capacityKw"`
	PanelsCount        int     `json:"panelsCount"`
	Inverter           string  `json:"inverter"`
	GenerationTodayKWh float64 `json:"generationTodayKwh"`
	Status             string  `json:"status"` // GENERATING, STANDBY, FAULT
}
