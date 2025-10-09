# API Documentation

## HELOC Strategy Endpoints

### POST /api/helocs/calculate-strategies-for-target

Generate multiple chunk amount strategies for a single target payoff year.

**Description**: This endpoint accepts a target number of years to pay off the mortgage and returns multiple strategy options with different chunk amounts (conservative, optimal, aggressive). Each strategy shows the complete payoff calculation including total interest, savings, and required monthly cashflow.

**Request Body**:
```json
{
  "mortgageId": "string (UUID)",
  "targetYears": "number (integer, positive)"
}
```

**Response**:
```json
{
  "scenarios": [
    {
      "targetMonths": 96,
      "targetYears": 8,
      "chunkAmount": 28000,
      "actualMonths": 104,
      "totalCycles": 6,
      "totalHelocInterest": 10542.06,
      "totalMortgageInterest": 84872.13,
      "totalInterest": 95414.19,
      "netSavings": 189340.18,
      "monthlyCashflowRequired": 1604,
      "isViable": true,
      "notes": "Very conservative - Lowest risk, longest timeline"
    },
    {
      "targetMonths": 96,
      "targetYears": 8,
      "chunkAmount": 37000,
      "actualMonths": 109,
      "totalCycles": 5,
      "totalHelocInterest": 14170.20,
      "totalMortgageInterest": 82545.69,
      "totalInterest": 96715.89,
      "netSavings": 188038.48,
      "monthlyCashflowRequired": 1604,
      "isViable": true,
      "notes": "Conservative approach - Lower chunk, more time"
    },
    {
      "targetMonths": 96,
      "targetYears": 8,
      "chunkAmount": 46000,
      "actualMonths": 103,
      "totalCycles": 4,
      "totalHelocInterest": 16808.65,
      "totalMortgageInterest": 79653.61,
      "totalInterest": 96462.26,
      "netSavings": 188292.11,
      "monthlyCashflowRequired": 1604,
      "isViable": true,
      "notes": "Optimal approach - Best balance of speed and savings"
    }
  ],
  "recommended": {
    "targetMonths": 96,
    "targetYears": 8,
    "chunkAmount": 46000,
    "actualMonths": 103,
    "totalCycles": 4,
    "totalHelocInterest": 16808.65,
    "totalMortgageInterest": 79653.61,
    "totalInterest": 96462.26,
    "netSavings": 188292.11,
    "monthlyCashflowRequired": 1604,
    "isViable": true,
    "notes": "Optimal approach - Best balance of speed and savings"
  },
  "parameters": {
    "mortgageBalance": 280000,
    "mortgageRate": 6.5,
    "mortgagePayment": 1896,
    "helocLimit": 50000,
    "helocRate": 8.5,
    "monthlyIncome": 8000,
    "monthlyExpenses": 4500,
    "netCashflow": 1604
  }
}
```

**Strategy Variations**:
- **Very Conservative (60%)**: Lowest risk, longest timeline
- **Conservative (80%)**: Lower chunk, more time
- **Optimal (100%)**: Best balance of speed and savings
- **Aggressive (120%)**: Higher chunk, faster payoff
- **Very Aggressive (140%)**: Highest chunk, fastest payoff

Up to 5 unique strategies are returned, sorted by chunk amount (ascending). The optimal strategy (100%) is marked as recommended.

**Error Responses**:
- `400` - Validation error (invalid targetYears)
- `404` - Mortgage not found
- `404` - HELOC not found
- `400` - Monthly income and expenses required

**Example Usage**:
```bash
curl -X POST "http://localhost:3001/api/helocs/calculate-strategies-for-target" \
  -H "Content-Type: application/json" \
  -d '{
    "mortgageId": "4c851b46-5fca-4808-803e-b6973e2f909d",
    "targetYears": 8
  }'
```

---

### POST /api/helocs/calculate-optimal-strategies

Generate optimal strategies for multiple target years.

**Request Body**:
```json
{
  "mortgageId": "string (UUID)"
}
```

**Response**: Returns scenarios for predefined target years (6, 8, 10, 12, 15 years) with optimal chunk amounts for each.

---

### POST /api/helocs/calculate-strategy

Calculate detailed strategy for a specific chunk amount.

**Request Body**:
```json
{
  "mortgageId": "string (UUID)",
  "chunkAmount": "number (positive)"
}
```

**Response**: Returns complete payoff calculation for the specified chunk amount including amortization schedule and interest breakdowns.
