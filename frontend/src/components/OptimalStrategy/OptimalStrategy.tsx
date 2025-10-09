import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMortgageStore } from '../../stores/mortgageStore';
import { OptimalStrategyResult, StrategyScenario } from '../../types';

export const OptimalStrategy = () => {
  const navigate = useNavigate();
  const { mortgage } = useMortgageStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimalStrategyResult | null>(null);

  useEffect(() => {
    if (!mortgage) {
      navigate('/setup');
      return;
    }

    fetchOptimalStrategies();
  }, [mortgage]);

  const fetchOptimalStrategies = async () => {
    if (!mortgage) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/helocs/calculate-optimal-strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mortgageId: mortgage.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate optimal strategies');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatYears = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years} years`;
  };

  if (!mortgage) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Calculating optimal strategies...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/heloc-strategy')}
            className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
          >
            ← <span>Back to HELOC Strategy</span>
          </button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <h2 className="text-xl font-semibold">Error</h2>
            </div>
            <p className="text-gray-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const isRecommended = (scenario: StrategyScenario) => {
    return scenario.targetYears === result.recommended.targetYears;
  };

  const handleScenarioClick = (scenario: StrategyScenario) => {
    if (!scenario.isViable) return;

    // Navigate to HELOC strategy page with the chunk amount pre-populated
    navigate('/heloc-strategy', {
      state: {
        selectedChunkAmount: scenario.chunkAmount,
        scenarioDetails: scenario,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/heloc-strategy')}
          className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
        >
          ← <span>Back to HELOC Strategy</span>
        </button>

        <h1 className="text-4xl font-bold text-gray-800 mb-8">Optimal Payoff Strategies</h1>

        {/* Parameters Overview */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Financial Profile</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Mortgage Balance</p>
              <p className="text-xl font-semibold text-gray-800">
                {formatCurrency(result.parameters.mortgageBalance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">HELOC Limit</p>
              <p className="text-xl font-semibold text-gray-800">
                {formatCurrency(result.parameters.helocLimit)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Monthly Income</p>
              <p className="text-xl font-semibold text-gray-800">
                {formatCurrency(result.parameters.monthlyIncome)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Net Cashflow</p>
              <p className="text-xl font-semibold text-green-600">
                {formatCurrency(result.parameters.netCashflow)}
              </p>
            </div>
          </div>
        </div>

        {/* Recommended Strategy */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-3xl font-bold">✓ Recommended Strategy</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-green-100 mb-1">Target Payoff</p>
              <p className="text-3xl font-bold">{result.recommended.targetYears} years</p>
            </div>
            <div>
              <p className="text-green-100 mb-1">Chunk Amount</p>
              <p className="text-3xl font-bold">{formatCurrency(result.recommended.chunkAmount)}</p>
            </div>
            <div>
              <p className="text-green-100 mb-1">Total Savings</p>
              <p className="text-3xl font-bold">{formatCurrency(result.recommended.netSavings)}</p>
            </div>
            <div>
              <p className="text-green-100 mb-1">HELOC Cycles</p>
              <p className="text-3xl font-bold">{result.recommended.totalCycles}</p>
            </div>
          </div>
        </div>

        {/* All Scenarios */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">All Scenarios</h2>
          <div className="space-y-4">
            {result.scenarios.map((scenario) => (
              <div
                key={scenario.targetYears}
                onClick={() => handleScenarioClick(scenario)}
                className={`border rounded-lg p-6 transition-all ${
                  scenario.isViable ? 'cursor-pointer' : 'cursor-not-allowed'
                } ${
                  isRecommended(scenario)
                    ? 'border-green-500 bg-green-50 hover:bg-green-100'
                    : scenario.isViable
                    ? 'border-gray-200 hover:border-indigo-400 hover:shadow-lg'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-gray-800">
                      🎯 {scenario.targetYears} Year Payoff
                      {isRecommended(scenario) && (
                        <span className="ml-3 text-sm font-normal text-green-600 bg-green-100 px-3 py-1 rounded-full">
                          Recommended
                        </span>
                      )}
                    </h3>
                  </div>
                  {!scenario.isViable && (
                    <span className="text-sm font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full">
                      Not Viable
                    </span>
                  )}
                </div>

                {scenario.isViable ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">💵 Chunk Amount</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {formatCurrency(scenario.chunkAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">⏱️ Actual Payoff</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {formatYears(scenario.actualMonths)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">📉 Net Savings</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(scenario.netSavings)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">🔁 HELOC Cycles</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {scenario.totalCycles}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">💰 Total Interest</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {formatCurrency(scenario.totalInterest)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-indigo-600 font-medium text-center">
                      👆 Click to use this strategy
                    </p>
                  </div>
                  </>
                ) : (
                  <div className="text-red-600">
                    <p className="text-sm">{scenario.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
