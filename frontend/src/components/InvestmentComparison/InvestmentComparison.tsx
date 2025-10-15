import { useState, useEffect } from 'react';
import { useMortgageStore } from '../../stores/mortgageStore';
import { useUserStore } from '../../stores/userStore';
import { Card, CardHeader } from '../shared/Card';
import { Button } from '../shared/Button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface InvestmentScenario {
  month: number;
  investmentBalance: number;
  investmentContribution: number;
  investmentReturns: number;
  mortgageBalance?: number;
  mortgageInterestPaid?: number;
  totalInvested: number;
  netWorth: number;
}

interface InvestmentComparisonResult {
  scenario1: {
    name: string;
    description: string;
    schedule: InvestmentScenario[];
    totalMonths: number;
    totalInvested: number;
    finalInvestmentValue: number;
    totalReturns: number;
    mortgageInterestPaid: number;
    netWorth: number;
  };
  scenario2: {
    name: string;
    description: string;
    schedule: InvestmentScenario[];
    totalMonths: number;
    totalInvested: number;
    finalInvestmentValue: number;
    totalReturns: number;
    mortgageInterestPaid: number;
    payoffMonth: number;
    netWorth: number;
  };
  comparison: {
    netWorthDifference: number;
    betterScenario: 'scenario1' | 'scenario2';
    returnDifference: number;
    interestSavings: number;
  };
}

export const InvestmentComparison = () => {
  const { user } = useUserStore();
  const { mortgage: activeMortgage, fetchMortgagesByUser } = useMortgageStore();
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(500);
  const [marketReturn, setMarketReturn] = useState<number>(10);
  const [result, setResult] = useState<InvestmentComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch mortgage data when component mounts
  useEffect(() => {
    if (user && !activeMortgage) {
      fetchMortgagesByUser(user.id);
    }
  }, [user, activeMortgage, fetchMortgagesByUser]);

  const handleCalculate = async () => {
    if (!activeMortgage) {
      setError('Please select a mortgage first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/investment/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mortgagePrincipal: activeMortgage.principal,
          mortgageBalance: activeMortgage.currentBalance,
          mortgageRate: activeMortgage.interestRate,
          mortgagePayment: activeMortgage.monthlyPayment,
          termMonths: activeMortgage.termMonths,
          monthlyInvestmentAmount: monthlyInvestment,
          averageMarketReturn: marketReturn,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate investment comparison');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Combine data for net worth comparison chart
  const getNetWorthChartData = () => {
    if (!result) return [];

    const maxLength = Math.max(
      result.scenario1.schedule.length,
      result.scenario2.schedule.length
    );

    return Array.from({ length: maxLength }, (_, i) => ({
      month: i + 1,
      scenario1NetWorth: result.scenario1.schedule[i]?.netWorth || 0,
      scenario2NetWorth: result.scenario2.schedule[i]?.netWorth || 0,
    }));
  };

  // Investment balance comparison
  const getInvestmentBalanceData = () => {
    if (!result) return [];

    const maxLength = Math.max(
      result.scenario1.schedule.length,
      result.scenario2.schedule.length
    );

    return Array.from({ length: maxLength }, (_, i) => ({
      month: i + 1,
      scenario1Investment: result.scenario1.schedule[i]?.investmentBalance || 0,
      scenario2Investment: result.scenario2.schedule[i]?.investmentBalance || 0,
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  };

  if (!activeMortgage) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Mortgage Selected</h2>
            <p className="text-gray-600">
              Please select or create a mortgage to use the investment comparison tool.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Investment Comparison: Mortgage vs Market
      </h1>

      {/* Input Card */}
      <Card>
        <CardHeader
          title="Comparison Parameters"
          subtitle="Compare paying off your mortgage versus investing in the stock market"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Investment Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">$</span>
              <input
                type="number"
                value={monthlyInvestment}
                onChange={(e) => setMonthlyInvestment(parseFloat(e.target.value))}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                step="100"
                min="0"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Extra amount available each month to invest or pay towards mortgage
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Average Market Return (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={marketReturn}
                onChange={(e) => setMarketReturn(parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                step="0.5"
                min="0"
                max="100"
              />
              <span className="absolute right-3 top-3 text-gray-500">%</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Historical S&P 500 average: ~10% annually
            </p>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleCalculate}
              disabled={loading}
              className="w-full"
              variant="primary"
            >
              {loading ? 'Calculating...' : 'Compare Scenarios'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Scenario 1 */}
            <Card>
              <CardHeader
                title={result.scenario1.name}
                subtitle={result.scenario1.description}
              />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Final Net Worth:</span>
                  <span className="font-bold text-lg text-primary">
                    {formatCurrency(result.scenario1.netWorth)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Investment Value:</span>
                  <span className="font-semibold">
                    {formatCurrency(result.scenario1.finalInvestmentValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Invested:</span>
                  <span className="font-semibold">
                    {formatCurrency(result.scenario1.totalInvested)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Investment Returns:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(result.scenario1.totalReturns)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mortgage Interest Paid:</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(result.scenario1.mortgageInterestPaid)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Scenario 2 */}
            <Card>
              <CardHeader
                title={result.scenario2.name}
                subtitle={result.scenario2.description}
              />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Final Net Worth:</span>
                  <span className="font-bold text-lg text-primary">
                    {formatCurrency(result.scenario2.netWorth)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Investment Value:</span>
                  <span className="font-semibold">
                    {formatCurrency(result.scenario2.finalInvestmentValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Invested:</span>
                  <span className="font-semibold">
                    {formatCurrency(result.scenario2.totalInvested)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Investment Returns:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(result.scenario2.totalReturns)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mortgage Interest Paid:</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(result.scenario2.mortgageInterestPaid)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mortgage Payoff Month:</span>
                  <span className="font-semibold">
                    Month {result.scenario2.payoffMonth}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Winner Card */}
          <Card className="mt-6">
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {result.comparison.betterScenario === 'scenario1'
                  ? '📈 Scenario 1 Wins!'
                  : '🏠 Scenario 2 Wins!'}
              </h3>
              <p className="text-lg text-gray-700 mb-4">
                {result.comparison.betterScenario === 'scenario1'
                  ? 'Investing while paying mortgage yields better returns'
                  : 'Paying off mortgage first yields better returns'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Net Worth Difference</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(Math.abs(result.comparison.netWorthDifference))}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Return Difference</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(Math.abs(result.comparison.returnDifference))}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Interest Savings</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(result.comparison.interestSavings)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Charts */}
          <Card className="mt-6">
            <CardHeader
              title="Net Worth Over Time"
              subtitle="Compare your net worth trajectory under both scenarios"
            />
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={getNetWorthChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  tickFormatter={(value) => `$${formatNumber(value)}`}
                  label={{ value: 'Net Worth', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Month ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="scenario1NetWorth"
                  stroke="#8b5cf6"
                  name="Invest While Paying"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="scenario2NetWorth"
                  stroke="#3b82f6"
                  name="Pay Off First"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="mt-6">
            <CardHeader
              title="Investment Balance Over Time"
              subtitle="See how your investment grows under each scenario"
            />
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={getInvestmentBalanceData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  tickFormatter={(value) => `$${formatNumber(value)}`}
                  label={{ value: 'Investment Balance', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Month ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="scenario1Investment"
                  stroke="#10b981"
                  name="Invest While Paying"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="scenario2Investment"
                  stroke="#f59e0b"
                  name="Pay Off First"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Summary Bar Chart */}
          <Card className="mt-6">
            <CardHeader
              title="Final Comparison"
              subtitle="Side-by-side comparison of key metrics"
            />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    name: 'Net Worth',
                    'Scenario 1': result.scenario1.netWorth,
                    'Scenario 2': result.scenario2.netWorth,
                  },
                  {
                    name: 'Investment Value',
                    'Scenario 1': result.scenario1.finalInvestmentValue,
                    'Scenario 2': result.scenario2.finalInvestmentValue,
                  },
                  {
                    name: 'Interest Paid',
                    'Scenario 1': -result.scenario1.mortgageInterestPaid,
                    'Scenario 2': -result.scenario2.mortgageInterestPaid,
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${formatNumber(Math.abs(value))}`} />
                <Tooltip formatter={(value: number) => formatCurrency(Math.abs(value))} />
                <Legend />
                <Bar dataKey="Scenario 1" fill="#8b5cf6" />
                <Bar dataKey="Scenario 2" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  );
};
