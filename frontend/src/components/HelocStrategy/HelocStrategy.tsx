import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMortgageStore } from '../../stores/mortgageStore';
import { useUserStore } from '../../stores/userStore';
import { Card, CardHeader } from '../shared/Card';
import { Button } from '../shared/Button';
import { formatCurrency, formatMonths } from '../../utils/formatters';

export const HelocStrategy: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserStore();
  const { mortgage, heloc, helocStrategy, loading, error, calculateHelocStrategy, fetchHeloc, fetchMortgagesByUser } = useMortgageStore();

  // Check if we have a selected chunk amount from optimal strategy
  const selectedChunkAmount = (location.state as any)?.selectedChunkAmount;
  const scenarioDetails = (location.state as any)?.scenarioDetails;

  const [chunkAmount, setChunkAmount] = useState(selectedChunkAmount || 10000);
  const [showAllCycles, setShowAllCycles] = useState(false);

  // Fetch mortgage data when component mounts
  useEffect(() => {
    if (user && !mortgage) {
      fetchMortgagesByUser(user.id);
    }
  }, [user, mortgage, fetchMortgagesByUser]);

  useEffect(() => {
    if (mortgage && !heloc) {
      fetchHeloc(mortgage.id);
    }
  }, [mortgage, heloc, fetchHeloc]);

  // Auto-calculate when chunk amount is passed from optimal strategy
  useEffect(() => {
    if (selectedChunkAmount && heloc && !helocStrategy) {
      calculateHelocStrategy(selectedChunkAmount);
    }
  }, [selectedChunkAmount, heloc, helocStrategy, calculateHelocStrategy]);

  if (!mortgage) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader title="No Mortgage Found" />
          <p className="text-gray-600">
            {loading ? 'Loading mortgage data...' : 'Please create a mortgage first.'}
          </p>
          {!loading && (
            <Button onClick={() => navigate('/setup')} className="mt-4">
              Create Mortgage
            </Button>
          )}
        </Card>
      </div>
    );
  }

  if (!heloc) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader title="No HELOC Found" />
          <p className="text-gray-600 mb-4">
            Please add HELOC details to use the velocity banking strategy calculator.
          </p>
          <p className="text-sm text-gray-500">
            Go to Setup to add your HELOC information.
          </p>
        </Card>
      </div>
    );
  }

  if (!mortgage.monthlyIncome || !mortgage.monthlyExpenses) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader title="Missing Financial Information" />
          <p className="text-gray-600 mb-4">
            Monthly income and expenses are required for velocity banking calculations.
          </p>
          <p className="text-sm text-gray-500">
            Go to Setup to add your financial information.
          </p>
        </Card>
      </div>
    );
  }

  const handleCalculate = () => {
    calculateHelocStrategy(chunkAmount);
  };

  const displayCycles = showAllCycles
    ? helocStrategy?.cycles
    : helocStrategy?.cycles.slice(0, 50);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'pull':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">PULL</span>;
      case 'paydown':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">PAYDOWN</span>;
      case 'complete':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">COMPLETE</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">HELOC Velocity Banking Strategy</h1>
        <p className="text-gray-600 mt-2">
          See how using your HELOC strategically can pay off your mortgage faster
        </p>
        {scenarioDetails && (
          <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <p className="text-sm text-indigo-800">
              ✓ Using optimal scenario: <strong>{scenarioDetails.targetYears} year payoff</strong> with{' '}
              <strong>{formatCurrency(scenarioDetails.chunkAmount)}</strong> chunks
            </p>
          </div>
        )}
      </div>

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader title="Your Financial Profile" />
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600">Monthly Income</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(mortgage.monthlyIncome)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Monthly Expenses</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(mortgage.monthlyExpenses)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Mortgage Payment</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(mortgage.monthlyPayment)}
              </p>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600">Net Monthly Cashflow</p>
              <p className="text-lg font-semibold text-success">
                {formatCurrency(mortgage.monthlyIncome - mortgage.monthlyExpenses - mortgage.monthlyPayment)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="HELOC Details" />
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600">Credit Limit</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(heloc.creditLimit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Current Balance</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(heloc.currentBalance)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Interest Rate</p>
              <p className="text-lg font-semibold text-gray-900">
                {heloc.interestRate}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Available Credit</p>
              <p className="text-lg font-semibold text-success">
                {formatCurrency(heloc.creditLimit - heloc.currentBalance)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Chunk Amount" subtitle="Amount to pull from HELOC each cycle" />
          <div className="space-y-4">
            <div>
              <input
                type="range"
                min="5000"
                max={Math.min(50000, heloc.creditLimit)}
                step="1000"
                value={chunkAmount}
                onChange={(e) => setChunkAmount(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between mt-1">
                <span className="text-sm text-gray-600">$5K</span>
                <span className="text-lg font-semibold text-primary">
                  {formatCurrency(chunkAmount)}
                </span>
                <span className="text-sm text-gray-600">
                  ${Math.min(50, (heloc?.creditLimit ?? 0) / 1000).toFixed(0)}K
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleCalculate}
              disabled={loading}
              className="w-full mb-3"
            >
              {loading ? 'Calculating...' : 'Calculate Strategy'}
            </Button>

            <Button
              variant="secondary"
              onClick={() => navigate('/optimal-strategy')}
              className="w-full"
            >
              View Optimal Strategies
            </Button>
          </div>
        </Card>
      </div>

      {/* Results Summary */}
      {helocStrategy && (
        <>
          <Card>
            <CardHeader title="Strategy Summary" subtitle="Total impact of HELOC velocity banking" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Total Cycles</p>
                <p className="text-2xl font-bold text-blue-600">{helocStrategy.totalCycles}</p>
                <p className="text-xs text-gray-500 mt-1">HELOC pull cycles</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Payoff Time</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatMonths(helocStrategy.totalMonths)}
                </p>
                <p className="text-xs text-gray-500 mt-1">vs. {mortgage.termMonths} months standard</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Total Interest</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(helocStrategy.totalInterest)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Mortgage: {formatCurrency(helocStrategy.totalMortgageInterest)}
                  <br />
                  HELOC: {formatCurrency(helocStrategy.totalHelocInterest)}
                </p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Net Savings</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(helocStrategy.netSavings)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total interest saved</p>
              </div>
            </div>
          </Card>

          {/* Detailed Cycle Table */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <CardHeader
                title="Month-by-Month Breakdown"
                subtitle="Detailed view of each HELOC cycle"
              />
              {helocStrategy.cycles.length > 50 && (
                <Button
                  variant="secondary"
                  onClick={() => setShowAllCycles(!showAllCycles)}
                  className="text-sm"
                >
                  {showAllCycles ? 'Show Less' : `Show All ${helocStrategy.cycles.length} Months`}
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Month</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">HELOC Pull</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Mortgage Payment</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">HELOC Interest</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">HELOC Balance</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Mortgage Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayCycles?.map((cycle, index) => (
                    <tr
                      key={index}
                      className={cycle.action === 'pull' ? 'bg-blue-50' : cycle.action === 'complete' ? 'bg-purple-50' : ''}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{cycle.month}</td>
                      <td className="px-4 py-3">{getActionBadge(cycle.action)}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{cycle.description}</td>
                      <td className="px-4 py-3 text-right text-blue-600 font-medium">
                        {cycle.helocPull > 0 ? formatCurrency(cycle.helocPull) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {cycle.mortgagePayment > 0 ? formatCurrency(cycle.mortgagePayment) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-600">
                        {cycle.helocInterest > 0 ? formatCurrency(cycle.helocInterest) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 font-medium">
                        {formatCurrency(cycle.helocBalance)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 font-medium">
                        {formatCurrency(cycle.mortgageBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!showAllCycles && helocStrategy.cycles.length > 50 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Showing first 50 of {helocStrategy.cycles.length} months
                </p>
              </div>
            )}
          </Card>
        </>
      )}

      {error && (
        <Card>
          <div className="p-4 bg-danger/10 border border-danger rounded-lg">
            <p className="text-danger font-medium">{error}</p>
          </div>
        </Card>
      )}

      {!helocStrategy && !error && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-2">Adjust the chunk amount and click Calculate</p>
            <p className="text-sm text-gray-500">
              The strategy will show you exactly how many times you need to pull from your HELOC
              and how long it will take to pay off your mortgage using velocity banking.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
