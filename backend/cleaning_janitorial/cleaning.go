package cleaning_janitorial

type CleaningShift struct {
	ID               string `json:"id"`
	Facility         string `json:"facility"`
	Shift            string `json:"shift"`
	Supervisor       string `json:"supervisor"`
	CleanersAssigned int    `json:"cleanersAssigned"`
	Status           string `json:"status"` // SCHEDULED, IN_PROGRESS, COMPLETED
}
