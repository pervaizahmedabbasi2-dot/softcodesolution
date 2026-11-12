package diagnostic_lab

type LabReport struct {
	ID       string `json:"id"`
	SampleNo string `json:"sampleNo"`
	Patient  string `json:"patient"`
	TestName string `json:"testName"`
	Status   string `json:"status"` // PROCESSING, COMPLETED
	Date     string `json:"date"`
}
