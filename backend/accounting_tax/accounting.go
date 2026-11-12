package accounting_tax

type JournalVoucher struct {
	ID        string  `json:"id"`
	VoucherNo string  `json:"voucherNo"`
	Account   string  `json:"account"`
	Debit     float64 `json:"debit"`
	Credit    float64 `json:"credit"`
	Narration string  `json:"narration"`
	Date      string  `json:"date"`
}
