package photography_studio

type MediaShoot struct {
	ID           string `json:"id"`
	Client       string `json:"client"`
	Type         string `json:"type"`
	Photographer string `json:"photographer"`
	Deliverable  string `json:"deliverable"`
	Status       string `json:"status"`
}
