import React, { useState, useEffect } from 'react';
import { useMortgageStore } from '../../stores/mortgageStore';
import { useUserStore } from '../../stores/userStore';
import { Card, CardHeader } from '../shared/Card';
import { Button } from '../shared/Button';
import { formatCurrency } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

export const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { mortgage, loading, makePayment, error, fetchMortgagesByUser } = useMortgageStore();
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'regular' | 'chunk' | 'extra'>('regular');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch mortgage data when component mounts
  useEffect(() => {
    if (user && !mortgage) {
      fetchMortgagesByUser(user.id);
    }
  }, [user, mortgage, fetchMortgagesByUser]);

  if (!mortgage) {
    return (
      <div className="max-w-4xl mx-auto p-6">
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      await makePayment(Number(amount), paymentType);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setShowConfirmation(false);
    }
  };

  const suggestedAmounts = [
    mortgage.monthlyPayment,
    mortgage.monthlyPayment * 2,
    5000,
    10000,
  ];

  const monthlyRate = mortgage.interestRate / 12 / 100;
  const estimatedInterest = mortgage.currentBalance * monthlyRate;
  const estimatedPrincipal = Number(amount) - estimatedInterest;
  const newBalance = mortgage.currentBalance - estimatedPrincipal;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Make a Payment</h1>

      {success ? (
        <Card className="bg-success/10 border-2 border-success">
          <CardHeader title="Payment Successful!" />
          <p className="text-gray-700 mb-4">
            Your payment has been processed successfully. Redirecting to dashboard...
          </p>
        </Card>
      ) : !showConfirmation ? (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader
              title="Payment Details"
              subtitle={`Current balance: ${formatCurrency(mortgage.currentBalance)}`}
            />

            {error && (
              <div className="mb-4 p-4 bg-danger/10 border border-danger rounded-lg">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Suggested amounts:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedAmounts.map((suggested) => (
                    <button
                      key={suggested}
                      type="button"
                      onClick={() => setAmount(suggested.toString())}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                    >
                      {formatCurrency(suggested)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type
                </label>
                <select
                  value={paymentType}
                  onChange={(e) =>
                    setPaymentType(e.target.value as 'regular' | 'chunk' | 'extra')
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="regular">Regular Payment</option>
                  <option value="chunk">Chunk Payment (Velocity Banking)</option>
                  <option value="extra">Extra Payment</option>
                </select>
              </div>

              {Number(amount) > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">Payment Breakdown:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Interest:</span>
                      <span className="font-medium">
                        {formatCurrency(Math.max(0, estimatedInterest))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Principal:</span>
                      <span className="font-medium">
                        {formatCurrency(Math.max(0, estimatedPrincipal))}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="text-gray-900 font-medium">New Balance:</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(Math.max(0, newBalance))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!amount || Number(amount) <= 0 || loading}
                  className="flex-1"
                >
                  Continue
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </form>
      ) : (
        <Card className="bg-warning/10 border-2 border-warning">
          <CardHeader title="Confirm Payment" subtitle="Please review and confirm" />

          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Amount:</span>
                  <span className="font-bold text-xl">{formatCurrency(Number(amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Type:</span>
                  <span className="font-medium capitalize">{paymentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Balance:</span>
                  <span className="font-medium">{formatCurrency(mortgage.currentBalance)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-900 font-medium">New Balance:</span>
                  <span className="font-bold text-success">
                    {formatCurrency(Math.max(0, newBalance))}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="success"
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Processing...' : 'Confirm Payment'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                className="flex-1"
              >
                Go Back
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
