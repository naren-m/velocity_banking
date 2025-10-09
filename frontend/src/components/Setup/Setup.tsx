import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMortgageStore } from '../../stores/mortgageStore';
import { useUserStore } from '../../stores/userStore';
import { Card, CardHeader } from '../shared/Card';
import { Button } from '../shared/Button';
import { useForm } from 'react-hook-form';

interface MortgageFormData {
  email: string;
  name: string;
  principal: string;
  interestRate: string;
  termYears: string;
  startDate: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  helocLimit: string;
  helocBalance: string;
  helocRate: string;
}

export const Setup: React.FC = () => {
  const navigate = useNavigate();
  const { createMortgage, createHeloc, loading, error } = useMortgageStore();
  const { user, getOrCreateUser } = useUserStore();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<MortgageFormData>({
    defaultValues: {
      email: user?.email || '',
      name: user?.name || '',
    },
  });
  const [calculatedPayment, setCalculatedPayment] = useState<number | null>(null);

  const principal = watch('principal');
  const interestRate = watch('interestRate');
  const termYears = watch('termYears');
  const helocLimit = watch('helocLimit');

  // Calculate monthly payment whenever inputs change
  React.useEffect(() => {
    if (principal && interestRate && termYears) {
      const p = parseFloat(principal);
      const r = parseFloat(interestRate);
      const t = parseInt(termYears);

      if (!isNaN(p) && !isNaN(r) && !isNaN(t)) {
        const monthlyRate = r / 12 / 100;
        const months = t * 12;

        if (monthlyRate === 0) {
          setCalculatedPayment(p / months);
        } else {
          const payment =
            (p * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
            (Math.pow(1 + monthlyRate, months) - 1);
          setCalculatedPayment(payment);
        }
      } else {
        setCalculatedPayment(null);
      }
    } else {
      setCalculatedPayment(null);
    }
  }, [principal, interestRate, termYears]);

  const onSubmit = async (data: MortgageFormData) => {
    try {
      // Get or create user first
      const currentUser = await getOrCreateUser(data.email, data.name);

      const principal = parseFloat(data.principal);
      const interestRate = parseFloat(data.interestRate);
      const termYears = parseInt(data.termYears);
      const termMonths = termYears * 12;
      const monthlyPayment = calculatedPayment || 0;
      const monthlyIncome = data.monthlyIncome ? parseFloat(data.monthlyIncome) : undefined;
      const monthlyExpenses = data.monthlyExpenses ? parseFloat(data.monthlyExpenses) : undefined;

      const mortgage = await createMortgage({
        userId: currentUser.id,
        principal,
        currentBalance: principal,
        interestRate,
        monthlyPayment,
        startDate: data.startDate,
        termMonths,
        monthlyIncome,
        monthlyExpenses,
      });

      // Create HELOC if details provided
      if (data.helocLimit && parseFloat(data.helocLimit) > 0) {
        const helocLimit = parseFloat(data.helocLimit);
        const helocBalance = data.helocBalance ? parseFloat(data.helocBalance) : 0;
        const helocRate = parseFloat(data.helocRate);
        const minimumPayment = helocLimit * 0.01; // 1% of limit as minimum

        await createHeloc({
          mortgageId: mortgage.id,
          creditLimit: helocLimit,
          currentBalance: helocBalance,
          interestRate: helocRate,
          minimumPayment,
        });
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to create mortgage:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Velocity Banking Setup
          </h1>
          <p className="text-gray-600">
            Enter your mortgage details to get started
          </p>
        </div>

        <Card>
          <CardHeader
            title="Mortgage Information"
            subtitle="Provide your current mortgage details"
          />

          {error && (
            <div className="mb-4 p-4 bg-danger/10 border border-danger rounded-lg">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* User Information Section */}
            <div className="pb-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-danger">{errors.email.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Your email is encrypted and stored securely for privacy
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    {...register('name', {
                      required: 'Name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' },
                      maxLength: { value: 100, message: 'Name must be less than 100 characters' }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-danger">{errors.name.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Your name is encrypted and stored securely for privacy
                  </p>
                </div>
              </div>
            </div>

            {/* Mortgage Information Section */}
            <div className="pt-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mortgage Details</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Amount (Principal)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  {...register('principal', {
                    required: 'Principal is required',
                    min: { value: 1000, message: 'Minimum $1,000' },
                    max: { value: 10000000, message: 'Maximum $10,000,000' }
                  })}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="300000"
                  step="1000"
                />
              </div>
              {errors.principal && (
                <p className="mt-1 text-sm text-danger">{errors.principal.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate (Annual %)
              </label>
              <div className="relative">
                <input
                  type="number"
                  {...register('interestRate', {
                    required: 'Interest rate is required',
                    min: { value: 0.1, message: 'Minimum 0.1%' },
                    max: { value: 30, message: 'Maximum 30%' }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="6.5"
                  step="0.01"
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
              {errors.interestRate && (
                <p className="mt-1 text-sm text-danger">{errors.interestRate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Term (Years)
              </label>
              <select
                {...register('termYears', { required: 'Term is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select term</option>
                <option value="15">15 years</option>
                <option value="20">20 years</option>
                <option value="30">30 years</option>
              </select>
              {errors.termYears && (
                <p className="mt-1 text-sm text-danger">{errors.termYears.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                {...register('startDate', { required: 'Start date is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-danger">{errors.startDate.message}</p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Velocity Banking Details
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Optional: Add income, expenses, and HELOC details for advanced velocity banking strategy
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Income
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      {...register('monthlyIncome')}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="5000"
                      step="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Expenses
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      {...register('monthlyExpenses')}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="3000"
                      step="100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                HELOC (Home Equity Line of Credit)
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Optional: Add HELOC details to see advanced velocity banking strategy
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HELOC Credit Limit
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      {...register('helocLimit')}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="50000"
                      step="1000"
                    />
                  </div>
                </div>

                {helocLimit && parseFloat(helocLimit) > 0 && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current HELOC Balance
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input
                            type="number"
                            {...register('helocBalance')}
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="0"
                            step="100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          HELOC Interest Rate (%)
                        </label>
                        <input
                          type="number"
                          {...register('helocRate', {
                            required: helocLimit && parseFloat(helocLimit) > 0 ? 'HELOC rate required' : false,
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="7.5"
                          step="0.1"
                        />
                        {errors.helocRate && (
                          <p className="mt-1 text-sm text-danger">{errors.helocRate.message}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {calculatedPayment && (
              <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                <p className="text-sm text-gray-700 mb-1">Estimated Monthly Payment</p>
                <p className="text-3xl font-bold text-primary">
                  ${calculatedPayment.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Principal & Interest only (excludes taxes and insurance)
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !calculatedPayment}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Mortgage'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            All calculations are for demonstration purposes only.
            Consult with a financial advisor for actual mortgage decisions.
          </p>
        </div>
      </div>
    </div>
  );
};
