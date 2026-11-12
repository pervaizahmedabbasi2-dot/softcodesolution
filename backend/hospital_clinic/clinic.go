package hospital_clinic

import "time"

type Patient struct {
	ID        string    `json:"id"`
	MRNumber  string    `json:"mrNumber"`
	FullName  string    `json:"fullName"`
	Age       int       `json:"age"`
	Gender    string    `json:"gender"`
	Phone     string    `json:"phone"`
	BloodType string    `json:"bloodType"`
	CreatedAt time.Time `json:"createdAt"`
}

type Appointment struct {
	ID        string `json:"id"`
	TokenNo   string `json:"tokenNo"`
	PatientID string `json:"patientId"`
	Doctor    string `json:"doctor"`
	Specialty string `json:"specialty"`
	Status    string `json:"status"` // QUEUED, IN_CONSULTATION, COMPLETED
	SlotTime  string `json:"slotTime"`
	Fee       float64 `json:"fee"`
}
