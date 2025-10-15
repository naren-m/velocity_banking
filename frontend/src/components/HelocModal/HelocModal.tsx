import React from 'react';
import { useMortgageStore } from '../../stores/mortgageStore';
import { Card, CardHeader } from '../shared/Card';
import { Button } from '../shared/Button';
import { useForm } from 'react-hook-form';

interface HelocModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HelocFormData {
  creditLimit: string;
  currentBalance: string;
  interestRate: string;
}

export const HelocModal: React.FC<HelocModalProps> = ({ isOpen, onClose }) => {
  const { mortgage, createHeloc, loading, error } = useMortgageStore();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<HelocFormData>();

  if (!isOpen || !mortgage) return null;

  const onSubmit = async (data: HelocFormData) => {
    try {
      const creditLimit = parseFloat(data.creditLimit);
      const currentBalance = data.currentBalance ? parseFloat(data.currentBalance) : 0;
      const interestRate = parseFloat(data.interestRate);
      const minimumPayment = creditLimit * 0.01; // 1% of credit limit

      await createHeloc({
        mortgageId: mortgage.id,
        creditLimit,
        currentBalance,
        interestRate,
        minimumPayment,
      });

      reset();
      onClose();
    } catch (err) {
      console.error('Failed to create HELOC:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <Card>
          <CardHeader
            title="Add HELOC Details"
            subtitle="Add a Home Equity Line of Credit to your mortgage"
          />

          {error && (
            <div className="mb-4 p-4 bg-danger/10 border border-danger rounded-lg">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HELOC Credit Limit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  {...register('creditLimit', {
                    required: 'Credit limit is required',
                    min: { value: 1000, message: 'Minimum $1,000' },
                    max: { value: 500000, message: 'Maximum $500,000' }
                  })}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="50000"
                  step="1000"
                />
              </div>
              {errors.creditLimit && (
                <p className="mt-1 text-sm text-danger">{errors.creditLimit.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current HELOC Balance (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  {...register('currentBalance')}
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
              <div className="relative">
                <input
                  type="number"
                  {...register('interestRate', {
                    required: 'Interest rate is required',
                    min: { value: 0.1, message: 'Minimum 0.1%' },
                    max: { value: 30, message: 'Maximum 30%' }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="7.5"
                  step="0.1"
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
              {errors.interestRate && (
                <p className="mt-1 text-sm text-danger">{errors.interestRate.message}</p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Adding...' : 'Add HELOC'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
