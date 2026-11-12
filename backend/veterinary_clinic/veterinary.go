package veterinary_clinic

type PetRecord struct {
	ID                string  `json:"id"`
	PetName           string  `json:"petName"`
	Owner             string  `json:"owner"`
	Breed             string  `json:"breed"`
	AgeYears          float64 `json:"ageYears"`
	VaccinationStatus string  `json:"vaccinationStatus"`
	LastCheckup       string  `json:"lastCheckup"`
}
