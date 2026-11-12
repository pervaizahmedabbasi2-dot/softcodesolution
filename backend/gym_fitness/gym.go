package gym_fitness

type Member struct {
	ID          string  `json:"id"`
	MemberNo    string  `json:"memberNo"`
	Name        string  `json:"name"`
	Plan        string  `json:"plan"`
	Fee         float64 `json:"fee"`
	DueDate     string  `json:"dueDate"`
	Trainer     string  `json:"trainer"`
	Status      string  `json:"status"` // ACTIVE, EXPIRED, FROZEN
	LastCheckIn string  `json:"lastCheckIn"`
}
