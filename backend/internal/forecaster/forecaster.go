package forecaster

import (
	"time"
)

// Forecast computes period-by-period resource forecasts.
//
// Algorithm (1:1 translation of Kotlin ResourceForecaster.forecast):
//  1. Find min/max time range across all inputs (using both Time and AmountTime)
//  2. Group inputs by zeroed Time and by zeroed AmountTime
//  3. Iterate each period, accumulating totals:
//     - First loop: items whose Time matches current period → update plan/actual-should totals
//     - Second loop: items whose AmountTime matches current period → update actual receive/pay + total
//  4. Return sorted []Output with cumulative totals and daily values
func Forecast(inputs []Input, initial Total, opts ...Option) []Output {
	if len(inputs) == 0 {
		return nil
	}

	opt := DefaultOption().Apply(opts...)
	granMs := opt.Granularity.Milliseconds()

	// Step 1: find time range [beginTime, endTime]
	var beginTime, endTime time.Time
	for i, inp := range inputs {
		minT, maxT := minMaxTime(inp.Time, inp.AmountTime)
		minZ := zeroTime(minT, opt.Timezone)
		maxZ := zeroTime(maxT, opt.Timezone)
		if i == 0 {
			beginTime = minZ
			endTime = maxZ
		} else {
			if minZ.Before(beginTime) {
				beginTime = minZ
			}
			if maxZ.After(endTime) {
				endTime = maxZ
			}
		}
	}

	// Step 2: compute interval count
	timeInterval := int((endTime.Sub(beginTime).Milliseconds()) / granMs)

	// Step 3: initialize cumulative totals from initial
	totalPlanShouldReceive := initial.TotalPlanShouldReceive
	totalPlanShouldPay := initial.TotalPlanShouldPay
	totalActualShouldReceive := initial.TotalActualShouldReceive
	totalActualShouldPay := initial.TotalActualShouldPay
	totalActualReceive := initial.TotalActualReceive
	totalActualPay := initial.TotalActualPay
	total := initial.Balance

	// Step 4: group inputs by zeroed Time and zeroed AmountTime
	groupByTime := make(map[string][]Input)
	groupByAmountTime := make(map[string][]Input)
	for _, inp := range inputs {
		timeKey := formatTime(zeroTime(inp.Time, opt.Timezone))
		amountTimeKey := formatTime(zeroTime(inp.AmountTime, opt.Timezone))
		groupByTime[timeKey] = append(groupByTime[timeKey], inp)
		groupByAmountTime[amountTimeKey] = append(groupByAmountTime[amountTimeKey], inp)
	}

	// Step 5: iterate each period
	result := make([]Output, 0, timeInterval+1)
	outputsByKey := make(map[string]*Output)

	for i := 0; i <= timeInterval; i++ {
		daysPerPeriod := int(opt.Granularity / (24 * time.Hour))
		if daysPerPeriod < 1 {
			daysPerPeriod = 1
		}
		currentDate := beginTime.AddDate(0, 0, i*daysPerPeriod)
		currentTimeKey := formatTime(currentDate)

		out, exists := outputsByKey[currentTimeKey]
		if !exists {
			out = &Output{Time: currentDate}
			outputsByKey[currentTimeKey] = out
		}

		// First loop: items grouped by Time (PLAN_SHOULD + ACTUAL_SHOULD accumulation)
		for _, inp := range groupByTime[currentTimeKey] {
			switch inp.Type {
			case ItemActualShould:
				if inp.Direction == DirectionIn {
					totalActualShouldReceive = totalActualShouldReceive.Add(inp.Amount)
				} else {
					totalActualShouldPay = totalActualShouldPay.Add(inp.Amount)
				}
			case ItemPlanShould:
				if inp.Direction == DirectionIn {
					totalPlanShouldReceive = totalPlanShouldReceive.Add(inp.Amount)
				} else {
					totalPlanShouldPay = totalPlanShouldPay.Add(inp.Amount)
				}
			}
		}

		// Second loop: items grouped by AmountTime (ACTUAL receive/pay + total)
		for _, inp := range groupByAmountTime[currentTimeKey] {
			amountTimeKey := formatTime(zeroTime(inp.AmountTime, opt.Timezone))
			targetOut, ok := outputsByKey[amountTimeKey]
			if !ok {
				continue
			}

			switch inp.Type {
			case ItemActual:
				if inp.Direction == DirectionIn {
					targetOut.ActualReceive = targetOut.ActualReceive.Add(inp.Amount)
					totalActualReceive = totalActualReceive.Add(inp.Amount)
					total = total.Add(inp.Amount)
				} else {
					targetOut.ActualPay = targetOut.ActualPay.Add(inp.Amount)
					totalActualPay = totalActualPay.Add(inp.Amount)
					total = total.Sub(inp.Amount)
				}
			case ItemActualShould:
				if inp.Direction == DirectionIn {
					targetOut.ActualShouldReceive = targetOut.ActualShouldReceive.Add(inp.Amount)
				} else {
					targetOut.ActualShouldPay = targetOut.ActualShouldPay.Add(inp.Amount)
				}
			case ItemPlanShould:
				if inp.Direction == DirectionIn {
					targetOut.PlanShouldReceive = targetOut.PlanShouldReceive.Add(inp.Amount)
				} else {
					targetOut.PlanShouldPay = targetOut.PlanShouldPay.Add(inp.Amount)
				}
			}
		}

		// Snapshot cumulative totals to current Output
		out.TotalPlanShouldReceive = totalPlanShouldReceive
		out.TotalPlanShouldPay = totalPlanShouldPay
		out.TotalActualShouldReceive = totalActualShouldReceive
		out.TotalActualShouldPay = totalActualShouldPay
		out.TotalActualReceive = totalActualReceive
		out.TotalActualPay = totalActualPay
		out.Balance = total

		result = append(result, *out)
	}

	// Compute all difference fields (Different = Receive - Pay)
	for i := range result {
		computeDifferences(&result[i])
	}

	return result
}

// minMaxTime returns the earlier and later of two times.
func minMaxTime(a, b time.Time) (time.Time, time.Time) {
	if a.Before(b) {
		return a, b
	}
	return b, a
}

// zeroTime truncates time to the start of day in the given timezone.
func zeroTime(t time.Time, loc *time.Location) time.Time {
	t = t.In(loc)
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, loc)
}

// formatTime produces a stable map key from a time (zeroed to day).
func formatTime(t time.Time) string {
	return t.Format(time.RFC3339)
}

// computeDifferences sets all Difference fields and Total's differences.
func computeDifferences(out *Output) {
	out.Total.TotalPlanShouldDifferent = out.TotalPlanShouldReceive.Sub(out.TotalPlanShouldPay)
	out.Total.TotalActualShouldDifferent = out.TotalActualShouldReceive.Sub(out.TotalActualShouldPay)
	out.Total.TotalActualDifferent = out.TotalActualReceive.Sub(out.TotalActualPay)

	out.PlanShouldDifferent = out.PlanShouldReceive.Sub(out.PlanShouldPay)
	out.ActualShouldDifferent = out.ActualShouldReceive.Sub(out.ActualShouldPay)
	out.ActualDifferent = out.ActualReceive.Sub(out.ActualPay)
}

