package forecaster

import (
	"testing"
	"time"

	"github.com/shopspring/decimal"
)

func mustParseDate(s string) time.Time {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		panic(err)
	}
	return t
}

func mustDec(s string) decimal.Decimal {
	d, err := decimal.NewFromString(s)
	if err != nil {
		panic(err)
	}
	return d
}

func dec(v float64) decimal.Decimal {
	return decimal.NewFromFloat(v)
}

func assertDec(t *testing.T, name string, got, want decimal.Decimal) {
	t.Helper()
	if !got.Equal(want) {
		t.Errorf("%s: got %s, want %s", name, got.String(), want.String())
	}
}

// TestBasicScenario translates the hardcoded test from Kotlin Test.kt:
//
//	item1:      PLAN_SHOULD IN  100  time=01-01  amountTime=02-15 (+45 days)
//	item1_dep:  ACTUAL IN       20   time=01-02  amountTime=01-02 (deposit 20%)
//	item2:      ACTUAL OUT      30   time=01-02  amountTime=01-02
//	item3:      ACTUAL IN       80   time=01-01  amountTime=02-15 (+45 days)
func TestBasicScenario(t *testing.T) {
	date0101 := mustParseDate("2021-01-01")
	date0102 := mustParseDate("2021-01-02")
	date0215 := mustParseDate("2021-02-15")

	inputs := []Input{
		{Amount: dec(100), Direction: DirectionIn, Type: ItemPlanShould, Time: date0101, AmountTime: date0215},
		{Amount: dec(20), Direction: DirectionIn, Type: ItemActual, Time: date0102, AmountTime: date0102},
		{Amount: dec(30), Direction: DirectionOut, Type: ItemActual, Time: date0102, AmountTime: date0102},
		{Amount: dec(80), Direction: DirectionIn, Type: ItemActual, Time: date0101, AmountTime: date0215},
	}

	result := Forecast(inputs, Total{})

	// Time range: 01-01 to 02-15 = 45 days, so 46 entries
	if len(result) != 46 {
		t.Fatalf("expected 46 output entries, got %d", len(result))
	}

	// Day 0: 2021-01-01
	day0 := result[0]
	if !day0.Time.Equal(date0101) {
		t.Errorf("day0 time: got %v, want %v", day0.Time, date0101)
	}
	// First loop: PLAN_SHOULD IN 100 (time=01-01) → totalPlanShouldReceive=100
	assertDec(t, "day0.TotalPlanShouldReceive", day0.TotalPlanShouldReceive, dec(100))
	assertDec(t, "day0.TotalPlanShouldPay", day0.TotalPlanShouldPay, dec(0))
	assertDec(t, "day0.TotalPlanShouldDifferent", day0.TotalPlanShouldDifferent, dec(100))
	// Second loop: nothing at amountTime=01-01
	assertDec(t, "day0.ActualReceive", day0.ActualReceive, dec(0))
	assertDec(t, "day0.ActualPay", day0.ActualPay, dec(0))
	assertDec(t, "day0.Balance", day0.Balance, dec(0))
	assertDec(t, "day0.PlanShouldReceive", day0.PlanShouldReceive, dec(0))

	// Day 1: 2021-01-02
	day1 := result[1]
	if !day1.Time.Equal(date0102) {
		t.Errorf("day1 time: got %v, want %v", day1.Time, date0102)
	}
	// First loop: nothing at time=01-02 for PLAN_SHOULD/ACTUAL_SHOULD
	// Total unchanged from day 0
	assertDec(t, "day1.TotalPlanShouldReceive", day1.TotalPlanShouldReceive, dec(100))
	// Second loop: ACTUAL IN 20 + ACTUAL OUT 30 at amountTime=01-02
	assertDec(t, "day1.ActualReceive", day1.ActualReceive, dec(20))
	assertDec(t, "day1.ActualPay", day1.ActualPay, dec(30))
	assertDec(t, "day1.ActualDifferent", day1.ActualDifferent, dec(-10))
	assertDec(t, "day1.TotalActualReceive", day1.TotalActualReceive, dec(20))
	assertDec(t, "day1.TotalActualPay", day1.TotalActualPay, dec(30))
	assertDec(t, "day1.Balance", day1.Balance, dec(-10)) // 0 + 20 - 30

	// Day 45: 2021-02-15
	day45 := result[45]
	if !day45.Time.Equal(date0215) {
		t.Errorf("day45 time: got %v, want %v", day45.Time, date0215)
	}
	// First loop: nothing new for PLAN/ACTUAL_SHOULD at time=02-15
	assertDec(t, "day45.TotalPlanShouldReceive", day45.TotalPlanShouldReceive, dec(100))
	// Second loop: PLAN_SHOULD IN 100 + ACTUAL IN 80 at amountTime=02-15
	assertDec(t, "day45.PlanShouldReceive", day45.PlanShouldReceive, dec(100))
	assertDec(t, "day45.ActualReceive", day45.ActualReceive, dec(80))
	assertDec(t, "day45.TotalActualReceive", day45.TotalActualReceive, dec(100)) // 20 + 80
	assertDec(t, "day45.TotalActualPay", day45.TotalActualPay, dec(30))
	assertDec(t, "day45.TotalActualDifferent", day45.TotalActualDifferent, dec(70)) // 100 - 30
	assertDec(t, "day45.Balance", day45.Balance, dec(70))                               // -10 + 80
}

// TestEmptyInput verifies empty input returns nil.
func TestEmptyInput(t *testing.T) {
	result := Forecast(nil, Total{})
	if result != nil {
		t.Errorf("expected nil, got %v", result)
	}
	result = Forecast([]Input{}, Total{})
	if result != nil {
		t.Errorf("expected nil, got %v", result)
	}
}

// TestSingleInput verifies single item produces correct range.
func TestSingleInput(t *testing.T) {
	date0101 := mustParseDate("2021-01-01")
	inputs := []Input{
		{Amount: dec(50), Direction: DirectionIn, Type: ItemActual, Time: date0101, AmountTime: date0101},
	}
	result := Forecast(inputs, Total{})
	if len(result) != 1 {
		t.Fatalf("expected 1 output entry, got %d", len(result))
	}
	assertDec(t, "ActualReceive", result[0].ActualReceive, dec(50))
	assertDec(t, "Total", result[0].Balance, dec(50))
}

// TestNonInitialTotal verifies initial totals are carried forward.
func TestNonInitialTotal(t *testing.T) {
	date0101 := mustParseDate("2021-01-01")
	initial := Total{
		Balance:                dec(1000),
		TotalActualReceive:     dec(1000),
		TotalActualDifferent:   dec(1000),
	}
	inputs := []Input{
		{Amount: dec(50), Direction: DirectionOut, Type: ItemActual, Time: date0101, AmountTime: date0101},
	}
	result := Forecast(inputs, initial)
	if len(result) != 1 {
		t.Fatalf("expected 1 output entry, got %d", len(result))
	}
	// total starts at 1000, then -50 = 950
	assertDec(t, "Total", result[0].Balance, dec(950))
	assertDec(t, "TotalActualReceive", result[0].TotalActualReceive, dec(1000)) // unchanged from initial
	assertDec(t, "TotalActualPay", result[0].TotalActualPay, dec(50))
}

// TestPlanShouldOut verifies plan pay direction.
func TestPlanShouldOut(t *testing.T) {
	date0101 := mustParseDate("2021-01-01")
	inputs := []Input{
		{Amount: dec(200), Direction: DirectionOut, Type: ItemPlanShould, Time: date0101, AmountTime: date0101},
	}
	result := Forecast(inputs, Total{})
	if len(result) != 1 {
		t.Fatalf("expected 1 output entry, got %d", len(result))
	}
	assertDec(t, "TotalPlanShouldPay", result[0].TotalPlanShouldPay, dec(200))
	assertDec(t, "TotalPlanShouldDifferent", result[0].TotalPlanShouldDifferent, dec(-200))
	assertDec(t, "PlanShouldPay", result[0].PlanShouldPay, dec(200))
	assertDec(t, "PlanShouldDifferent", result[0].PlanShouldDifferent, dec(-200))
}

// TestActualShould verifies ACTUAL_SHOULD type behavior.
func TestActualShould(t *testing.T) {
	date0101 := mustParseDate("2021-01-01")
	date0105 := mustParseDate("2021-01-05")
	inputs := []Input{
		// ACTUAL_SHOULD IN: recorded 01-01, occurs 01-05
		{Amount: dec(300), Direction: DirectionIn, Type: ItemActualShould, Time: date0101, AmountTime: date0105},
	}
	result := Forecast(inputs, Total{})
	// Range: 01-01 to 01-05 = 4 days, 5 entries
	if len(result) != 5 {
		t.Fatalf("expected 5 output entries, got %d", len(result))
	}

	// Day 0 (01-01): first loop accumulates ACTUAL_SHOULD
	assertDec(t, "day0.TotalActualShouldReceive", result[0].TotalActualShouldReceive, dec(300))
	assertDec(t, "day0.ActualShouldReceive", result[0].ActualShouldReceive, dec(0)) // daily value at amountTime=01-05

	// Day 4 (01-05): second loop writes daily value
	assertDec(t, "day4.TotalActualShouldReceive", result[4].TotalActualShouldReceive, dec(300))
	assertDec(t, "day4.ActualShouldReceive", result[4].ActualShouldReceive, dec(300))
}

// TestDecimalPrecision verifies no floating point errors.
func TestDecimalPrecision(t *testing.T) {
	date0101 := mustParseDate("2021-01-01")
	inputs := []Input{
		{Amount: mustDec("0.1"), Direction: DirectionIn, Type: ItemActual, Time: date0101, AmountTime: date0101},
		{Amount: mustDec("0.2"), Direction: DirectionIn, Type: ItemActual, Time: date0101, AmountTime: date0101},
	}
	result := Forecast(inputs, Total{})
	// 0.1 + 0.2 should equal exactly 0.3 with decimal
	assertDec(t, "Total", result[0].Balance, mustDec("0.3"))
	assertDec(t, "ActualReceive", result[0].ActualReceive, mustDec("0.3"))
}
