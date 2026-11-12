package school

import (
	"database/sql"
	"time"
)

// Student represents an admitted student in the school business module
type Student struct {
	ID             string    `json:"id"`
	RollNo         string    `json:"rollNo"`
	FullName       string    `json:"fullName"`
	Grade          string    `json:"grade"`
	Section        string    `json:"section"`
	GuardianName   string    `json:"guardianName"`
	Phone          string    `json:"phone"`
	FeeStatus      string    `json:"feeStatus"`
	AdmissionDate  string    `json:"admissionDate"`
	Status         string    `json:"status"`
	IsSynced       bool      `json:"isSynced"`
	CreatedAt      time.Time `json:"createdAt"`
}

// FeeChallan represents a generated fee invoice
type FeeChallan struct {
	ID          string  `json:"id"`
	ChallanNo   string  `json:"challanNo"`
	StudentName string  `json:"studentName"`
	RollNo      string  `json:"rollNo"`
	Grade       string  `json:"grade"`
	Month       string  `json:"month"`
	Tuition     float64 `json:"tuition"`
	LabFee      float64 `json:"labFee"`
	Discount    float64 `json:"discount"`
	Total       float64 `json:"total"`
	Status      string  `json:"status"`
	DueDate     string  `json:"dueDate"`
	PaidDate    string  `json:"paidDate,omitempty"`
}

// ExamResult represents student academic scorecard
type ExamResult struct {
	ID            string  `json:"id"`
	ExamID        string  `json:"examId"`
	StudentID     string  `json:"studentId"`
	RollNo        string  `json:"rollNo"`
	StudentName   string  `json:"studentName"`
	Grade         string  `json:"grade"`
	Subject       string  `json:"subject"`
	MarksObtained float64 `json:"marksObtained"`
	TotalMarks    float64 `json:"totalMarks"`
	Percentage    float64 `json:"percentage"`
	GradeLetter   string  `json:"gradeLetter"`
	Remarks       string  `json:"remarks"`
}

// SchoolService provides offline-first database access for schools
type SchoolService struct {
	db *sql.DB
}

func NewSchoolService(db *sql.DB) *SchoolService {
	return &SchoolService{db: db}
}
