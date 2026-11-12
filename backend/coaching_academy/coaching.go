package coaching_academy

type AcademyBatch struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	Subject       string `json:"subject"`
	StudentsCount int    `json:"studentsCount"`
	Timing        string `json:"timing"`
	Instructor    string `json:"instructor"`
	Status        string `json:"status"` // ACTIVE, UPCOMING, COMPLETED
}
