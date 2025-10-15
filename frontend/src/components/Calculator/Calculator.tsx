import React, { useState } from 'react';
import { useMortgageStore } from '../../stores/mortgageStore';
import { Card, CardHeader } from '../shared/Card';
import { Button } from '../shared/Button';
import { formatCurrency, formatMonths, formatPercent } from '../../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const Calculator: React.FC = () => {
  const { mortgage, comparison, loading, compareScenarios } = useMortgageStore();
  const [chunkAmount, setChunkAmount] = useState(5000);
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');

  if (!mortgage) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader title="No Mortgage Found" />
          <p className="text-gray-600">Please create a mortgage first.</p>
        </Card>
      </div>
    );
  }

  const handleCalculate = () => {
    compareScenarios(chunkAmount, frequency);
  };

  const chartData = comparison
    ? [
        {
          name: 'Standard',
          months: comparison.standard.totalMonths,
          interest: comparison.standard.totalInterest,
        },
        {
          name: 'Velocity',
          months: comparison.velocity.totalMonths,
          interest: comparison.velocity.totalInterest,
        },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Velocity Banking Calculator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader
            title="Scenario Settings"
            subtitle="Configure your velocity banking strategy"
          />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chunk Payment Amount
              </label>
              <input
                type="range"
                min="1000"
                max="50000"
                step="500"
                value={chunkAmount}
                onChange={(e) => setChunkAmount(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between mt-1">
                <span className="text-sm text-gray-600">$1,000</span>
                <span className="text-lg font-semibold text-primary">
                  {formatCurrency(chunkAmount)}
                </span>
                <span className="text-sm text-gray-600">$50,000</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value as 'monthly' | 'quarterly' | 'annual')
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly (Every 3 months)</option>
                <option value="annual">Annual (Yearly)</option>
              </select>
            </div>

            <Button
              variant="primary"
              onClick={handleCalculate}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Calculating...' : 'Calculate Scenarios'}
            </Button>
          </div>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader title="Comparison Results" subtitle="Standard vs. Velocity Banking" />

          {!comparison ? (
            <p className="text-gray-600">
              Adjust the settings and click Calculate to see results.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Standard Payoff</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatMonths(comparison.standard.totalMonths)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Interest: {formatCurrency(comparison.standard.totalInterest)}
                  </p>
                </div>

                <div className="p-4 bg-success/10 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Velocity Payoff</p>
                  <p className="text-xl font-bold text-success">
                    {formatMonths(comparison.velocity.totalMonths)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Interest: {formatCurrency(comparison.velocity.totalInterest)}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                <p className="text-sm font-medium text-gray-900 mb-2">You Save:</p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(comparison.savings.interestSaved)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatMonths(comparison.savings.monthsSaved)} faster payoff
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatPercent(comparison.savings.percentageSaved)} interest savings
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Comparison Chart */}
      {comparison && (
        <Card>
          <CardHeader title="Visual Comparison" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(value) => `$${((value ?? 0) / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar dataKey="interest" fill="#2563eb" name="Total Interest" />
            </BarChart>
          </ResponsiveContainer>

          <ResponsiveContainer width="100%" height={300} className="mt-4">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(value) => `${value} mo`}
              />
              <Tooltip formatter={(value: number) => `${value} months`} />
              <Legend />
              <Bar dataKey="months" fill="#16a34a" name="Months to Payoff" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
};
