import React, { useEffect, useState } from 'react';
import { useMortgageStore } from '../../stores/mortgageStore';
import { useUserStore } from '../../stores/userStore';
import { Card, CardHeader } from '../shared/Card';
import { Button } from '../shared/Button';
import { formatCurrency, formatMonths, formatPercent } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { HelocModal } from '../HelocModal/HelocModal';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { mortgage, heloc, mortgages, comparison, payments, loading, fetchPayments, fetchMortgagesByUser, fetchHeloc } = useMortgageStore();
  const [isHelocModalOpen, setIsHelocModalOpen] = useState(false);

  // Fetch user's mortgages when component mounts
  useEffect(() => {
    if (user && !mortgage) {
      fetchMortgagesByUser(user.id);
    }
  }, [user, mortgage, fetchMortgagesByUser]);

  // Fetch HELOC when mortgage is loaded
  useEffect(() => {
    if (mortgage && !heloc) {
      fetchHeloc(mortgage.id);
    }
  }, [mortgage, heloc, fetchHeloc]);

  useEffect(() => {
    if (mortgage) {
      fetchPayments();
    }
  }, [mortgage, fetchPayments]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader title="Welcome to Velocity Banking" />
          <p className="text-gray-600 mb-4">
            Please create an account to get started.
          </p>
          <Button onClick={() => navigate('/setup')}>Get Started</Button>
        </Card>
      </div>
    );
  }

  if (!mortgage) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader title={`Welcome, ${user.name}!`} />
          <p className="text-gray-600 mb-4">
            {mortgages.length === 0
              ? "You don't have any mortgages yet. Let's create one to get started with velocity banking."
              : "Loading your mortgage details..."}
          </p>
          <Button onClick={() => navigate('/setup')}>
            {mortgages.length === 0 ? 'Create Mortgage' : 'Add Another Mortgage'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
          <p className="text-gray-600 mt-1">Here's your velocity banking overview</p>
        </div>
        {heloc && (
          <Button variant="primary" onClick={() => navigate('/optimal-strategy')}>
            View Optimal Strategies
          </Button>
        )}
      </div>

      {/* Financial Profile Summary */}
      {(mortgage.monthlyIncome || mortgage.monthlyExpenses) && (
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50">
          <CardHeader title="Your Financial Profile" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {mortgage.monthlyIncome && (
              <div>
                <p className="text-sm text-gray-600">Monthly Income</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(mortgage.monthlyIncome)}
                </p>
              </div>
            )}
            {mortgage.monthlyExpenses && (
              <div>
                <p className="text-sm text-gray-600">Monthly Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(mortgage.monthlyExpenses)}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Mortgage Payment</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(mortgage.monthlyPayment)}
              </p>
            </div>
            {mortgage.monthlyIncome && mortgage.monthlyExpenses && (
              <div>
                <p className="text-sm text-gray-600">Net Cashflow</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(mortgage.monthlyIncome - mortgage.monthlyExpenses - mortgage.monthlyPayment)}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* HELOC Status */}
      {heloc && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader title="HELOC Status" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Credit Limit</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(heloc.creditLimit)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(heloc.currentBalance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Available Credit</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(heloc.creditLimit - heloc.currentBalance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Interest Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {heloc.interestRate}%
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Mortgage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Current Balance" />
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(mortgage.currentBalance)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Original: {formatCurrency(mortgage.principal)}
          </p>
        </Card>

        <Card>
          <CardHeader title="Monthly Payment" />
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(mortgage.monthlyPayment)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Rate: {formatPercent(mortgage.interestRate)}
          </p>
        </Card>

        <Card>
          <CardHeader title="Term Remaining" />
          <p className="text-3xl font-bold text-gray-900">
            {formatMonths(mortgage.termMonths)}
          </p>
          <p className="text-sm text-gray-600 mt-1">Original term</p>
        </Card>
      </div>

      {/* Savings Summary */}
      {comparison && (
        <Card className="bg-success/10 border-2 border-success">
          <CardHeader
            title="Velocity Banking Savings"
            subtitle="Potential savings with chunk payments"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Interest Saved</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(comparison.savings.interestSaved)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Time Saved</p>
              <p className="text-2xl font-bold text-success">
                {formatMonths(comparison.savings.monthsSaved)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Savings Percentage</p>
              <p className="text-2xl font-bold text-success">
                {formatPercent(comparison.savings.percentageSaved)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" />
        <div className="flex flex-wrap gap-4">
          {heloc ? (
            <>
              <Button variant="primary" onClick={() => navigate('/heloc-strategy')}>
                HELOC Strategy Calculator
              </Button>
              <Button variant="success" onClick={() => navigate('/optimal-strategy')}>
                View Optimal Strategies
              </Button>
              <Button variant="secondary" onClick={() => navigate('/calculator')}>
                Standard Calculator
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={() => navigate('/calculator')}>
                Calculate Scenarios
              </Button>
              <Button variant="secondary" onClick={() => setIsHelocModalOpen(true)}>
                Add HELOC Details
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader title="Recent Payments" subtitle="Last 5 transactions" />
        {loading ? (
          <p className="text-gray-600">Loading payments...</p>
        ) : payments.length === 0 ? (
          <p className="text-gray-600">No payments yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Type
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                    Principal
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.slice(0, 5).map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.paymentType === 'chunk'
                            ? 'bg-success/20 text-success'
                            : payment.paymentType === 'extra'
                            ? 'bg-warning/20 text-warning'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {payment.paymentType}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-gray-900">
                      {formatCurrency(payment.principalPaid)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(payment.remainingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <HelocModal
        isOpen={isHelocModalOpen}
        onClose={() => setIsHelocModalOpen(false)}
      />
    </div>
  );
};
