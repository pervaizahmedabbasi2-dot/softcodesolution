package ngo_charity

type AidCampaign struct {
	ID        string  `json:"id"`
	Code      string  `json:"code"`
	Title     string  `json:"title"`
	TargetUSD float64 `json:"targetUsd"`
	RaisedUSD float64 `json:"raisedUsd"`
	Region    string  `json:"region"`
	Status    string  `json:"status"` // ACTIVE, GOAL_REACHED
}

type DonationReceipt struct {
	ID        string  `json:"id"`
	ReceiptNo string  `json:"receiptNo"`
	DonorName string  `json:"donorName"`
	CampaignID string `json:"campaignId"`
	Amount    float64 `json:"amount"`
	Currency  string  `json:"currency"`
	Date      string  `json:"date"`
}
