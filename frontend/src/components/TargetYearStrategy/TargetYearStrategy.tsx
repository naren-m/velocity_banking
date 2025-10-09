import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMortgageStore } from '../../stores/mortgageStore';
import { OptimalStrategyResult } from '../../types';

export const TargetYearStrategy = () => {
  const navigate = useNavigate();
  const { mortgage} = useMortgageStore();
  const [targetYears, setTargetYears] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimalStrategyResult | null>(null);
  const [expandedScenario, setExpandedScenario] = useState<number | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!mortgage) {
      navigate('/setup');
      return;
    }

    const years = parseInt(targetYears);
    if (isNaN(years) || years < 1 || years > 30) {
      setError('Please enter a valid number of years between 1 and 30');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/helocs/calculate-strategies-for-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mortgageId: mortgage.id,
          targetYears: years
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate strategies');
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
    navigate('/setup');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/heloc-strategy')}
          className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
        >
          ← <span>Back to HELOC Strategy</span>
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Custom Target Year Strategy</h1>
          <p className="text-gray-600 mb-6">
            Enter your desired payoff timeline and see multiple chunk amount strategies
          </p>

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1 max-w-xs">
                <label htmlFor="targetYears" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Years to Pay Off Mortgage
                </label>
                <input
                  id="targetYears"
                  type="number"
                  min="1"
                  max="30"
                  step="1"
                  value={targetYears}
                  onChange={(e) => setTargetYears(e.target.value)}
                  placeholder="e.g., 8"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Enter a number between 1 and 30</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Calculating...' : 'Calculate Strategies'}
              </button>
            </div>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {result && (
          <>
            {/* Parameters Summary */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Situation</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Mortgage Balance</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(result.parameters.mortgageBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mortgage Rate</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {result.parameters.mortgageRate}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">HELOC Limit</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(result.parameters.helocLimit)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Net Cashflow</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(result.parameters.netCashflow)}/mo
                  </p>
                </div>
              </div>
            </div>

            {/* Recommended Strategy */}
            {result.recommended && (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">⭐</span>
                  <h2 className="text-2xl font-bold">Recommended Strategy</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-indigo-100 text-sm mb-1">Chunk Amount</p>
                    <p className="text-3xl font-bold">{formatCurrency(result.recommended.chunkAmount)}</p>
                  </div>
                  <div>
                    <p className="text-indigo-100 text-sm mb-1">Payoff Time</p>
                    <p className="text-2xl font-bold">{formatYears(result.recommended.actualMonths)}</p>
                  </div>
                  <div>
                    <p className="text-indigo-100 text-sm mb-1">Total Cycles</p>
                    <p className="text-2xl font-bold">{result.recommended.totalCycles}</p>
                  </div>
                  <div>
                    <p className="text-indigo-100 text-sm mb-1">Net Savings</p>
                    <p className="text-2xl font-bold">{formatCurrency(result.recommended.netSavings)}</p>
                  </div>
                </div>
                <p className="mt-4 text-indigo-100">{result.recommended.notes}</p>
              </div>
            )}

            {/* All Strategy Options */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                All Strategy Options ({result.scenarios.length} found)
              </h2>
              <div className="grid gap-4">
                {result.scenarios.map((scenario, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      scenario.chunkAmount === result.recommended?.chunkAmount
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        {scenario.chunkAmount === result.recommended?.chunkAmount && (
                          <span className="text-indigo-600">⭐</span>
                        )}
                        {scenario.notes}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        scenario.isViable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {scenario.isViable ? 'Viable' : 'Not Viable'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Chunk Amount</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(scenario.chunkAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Payoff Time</p>
                        <p className="font-semibold text-gray-900">
                          {formatYears(scenario.actualMonths)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Cycles</p>
                        <p className="font-semibold text-gray-900">{scenario.totalCycles}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Interest</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(scenario.totalInterest)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Net Savings</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(scenario.netSavings)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">HELOC Interest:</span>{' '}
                          {formatCurrency(scenario.totalHelocInterest)}
                        </div>
                        <div>
                          <span className="font-medium">Mortgage Interest:</span>{' '}
                          {formatCurrency(scenario.totalMortgageInterest)}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Month-by-Month Breakdown */}
                    {scenario.cycles && scenario.cycles.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setExpandedScenario(expandedScenario === index ? null : index)}
                          className="w-full flex items-center justify-between text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          <span>
                            {expandedScenario === index ? '▼' : '▶'} View Month-by-Month Breakdown ({scenario.cycles.length} months)
                          </span>
                        </button>

                        {expandedScenario === index && (
                          <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full text-xs">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-2 py-2 text-left font-medium text-gray-700">Month</th>
                                  <th className="px-2 py-2 text-left font-medium text-gray-700">Action</th>
                                  <th className="px-2 py-2 text-right font-medium text-gray-700">HELOC Pull</th>
                                  <th className="px-2 py-2 text-right font-medium text-gray-700">Mortgage Balance</th>
                                  <th className="px-2 py-2 text-right font-medium text-gray-700">HELOC Balance</th>
                                  <th className="px-2 py-2 text-right font-medium text-gray-700">HELOC Interest</th>
                                  <th className="px-2 py-2 text-left font-medium text-gray-700">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {scenario.cycles.map((cycle, cycleIndex) => (
                                  <tr key={cycleIndex} className={cycle.action === 'pull' ? 'bg-blue-50' : cycle.action === 'complete' ? 'bg-green-50' : ''}>
                                    <td className="px-2 py-2 text-gray-900">{cycle.month}</td>
                                    <td className="px-2 py-2">
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        cycle.action === 'pull' ? 'bg-blue-200 text-blue-800' :
                                        cycle.action === 'complete' ? 'bg-green-200 text-green-800' :
                                        'bg-gray-200 text-gray-800'
                                      }`}>
                                        {cycle.action}
                                      </span>
                                    </td>
                                    <td className="px-2 py-2 text-right text-gray-900">
                                      {cycle.helocPull > 0 ? formatCurrency(cycle.helocPull) : '-'}
                                    </td>
                                    <td className="px-2 py-2 text-right font-medium text-gray-900">
                                      {formatCurrency(cycle.mortgageBalance)}
                                    </td>
                                    <td className="px-2 py-2 text-right text-gray-900">
                                      {formatCurrency(cycle.helocBalance)}
                                    </td>
                                    <td className="px-2 py-2 text-right text-gray-600">
                                      {formatCurrency(cycle.helocInterest)}
                                    </td>
                                    <td className="px-2 py-2 text-gray-600 text-xs">{cycle.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
