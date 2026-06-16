package forecaster

import (
	"time"

	"github.com/shopspring/decimal"
)

// Direction represents resource flow direction.
type Direction int

const (
	DirectionIn  Direction = 0 // 收入/流入
	DirectionOut Direction = 1 // 支出/流出
)

// ItemType represents resource item type.
type ItemType int

const (
	ItemPlanShould   ItemType = 0 // 计划应收/应付
	ItemActualShould ItemType = 1 // 实际应收/应付
	ItemActual       ItemType = 2 // 实收/实付
)

// Input is a single resource flow entry for forecasting.
type Input struct {
	Amount     decimal.Decimal `json:"amount"`
	Direction  Direction       `json:"direction"`
	Type       ItemType        `json:"type"`
	Time       time.Time       `json:"time"`        // 数据录入时间
	AmountTime time.Time       `json:"amount_time"` // 金额发生时间
	Key        string          `json:"key"`         // 可选分组标识
}

// Total holds cumulative totals. Differences are auto-computed as Receive - Pay.
type Total struct {
	TotalPlanShouldReceive     decimal.Decimal `json:"total_plan_should_receive"`
	TotalPlanShouldPay         decimal.Decimal `json:"total_plan_should_pay"`
	TotalPlanShouldDifferent   decimal.Decimal `json:"total_plan_should_different"`
	TotalActualShouldReceive   decimal.Decimal `json:"total_actual_should_receive"`
	TotalActualShouldPay       decimal.Decimal `json:"total_actual_should_pay"`
	TotalActualShouldDifferent decimal.Decimal `json:"total_actual_should_different"`
	TotalActualReceive         decimal.Decimal `json:"total_actual_receive"`
	TotalActualPay             decimal.Decimal `json:"total_actual_pay"`
	TotalActualDifferent       decimal.Decimal `json:"total_actual_different"`
	Balance                    decimal.Decimal `json:"balance"` // 总剩余
}

// Output is a single period's forecast result, embedding cumulative Total.
type Output struct {
	Total
	PlanShouldReceive     decimal.Decimal `json:"plan_should_receive"`
	PlanShouldPay         decimal.Decimal `json:"plan_should_pay"`
	PlanShouldDifferent   decimal.Decimal `json:"plan_should_different"`
	ActualShouldReceive   decimal.Decimal `json:"actual_should_receive"`
	ActualShouldPay       decimal.Decimal `json:"actual_should_pay"`
	ActualShouldDifferent decimal.Decimal `json:"actual_should_different"`
	ActualReceive         decimal.Decimal `json:"actual_receive"`
	ActualPay             decimal.Decimal `json:"actual_pay"`
	ActualDifferent       decimal.Decimal `json:"actual_different"`
	Time                  time.Time       `json:"time"`
}

// Option configures Forecast behavior.
type Option struct {
	Granularity time.Duration
	Timezone    *time.Location
}

// DefaultOption returns sensible defaults (24h granularity, UTC).
func DefaultOption() Option {
	return Option{
		Granularity: 24 * time.Hour,
		Timezone:    time.UTC,
	}
}

// Apply merges user options onto defaults.
func (o Option) Apply(opts ...Option) Option {
	for _, opt := range opts {
		if opt.Granularity > 0 {
			o.Granularity = opt.Granularity
		}
		if opt.Timezone != nil {
			o.Timezone = opt.Timezone
		}
	}
	return o
}
