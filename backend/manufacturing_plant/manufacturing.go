package manufacturing_plant

type ProductionLine struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	OutputRate string `json:"outputRate"`
	Efficiency string `json:"efficiency"`
	Status     string `json:"status"` // RUNNING, MAINTENANCE, IDLE
}
