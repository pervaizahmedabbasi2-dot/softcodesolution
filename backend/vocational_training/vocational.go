package vocational_training

type Course struct {
	ID             string `json:"id"`
	Title          string `json:"title"`
	DurationMonths int    `json:"durationMonths"`
	Enrolled       int    `json:"enrolled"`
	Certification  string `json:"certification"`
}
