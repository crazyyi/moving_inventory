'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { inventoryAPI } from '@/lib/api-client';
import { useAPICall } from '@/lib/hooks';
import { X, Edit2 } from 'lucide-react';
import { Inventory } from '@/types';

interface EditInventoryModalProps {
  token: string;
  inventory: Inventory;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  moveDate?: string;
  fromAddress?: string;
  toAddress?: string;
  notes?: string;
};

export default function EditInventoryModal({
  token,
  inventory,
  onClose,
  onSuccess,
}: EditInventoryModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      customerName: inventory.customerName || '',
      customerEmail: inventory.customerEmail || '',
      customerPhone: inventory.customerPhone || '',
      moveDate: inventory.moveDate ? new Date(inventory.moveDate).toISOString().split('T')[0] : '',
      fromAddress: inventory.fromAddress || '',
      toAddress: inventory.toAddress || '',
      notes: inventory.notes || '',
    },
  });

  const callAPI = useAPICall();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      await callAPI(
        () => inventoryAPI.update(token, data),
        { successMessage: 'Inventory updated successfully' }
      );
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update inventory';
      setSubmitError(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Edit Inventory Information</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {submitError}
            </div>
          )}

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  {...register('customerName')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  {...register('customerEmail')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="john@example.com"
                />
                {errors.customerEmail && (
                  <span className="text-red-600 text-sm mt-1">{errors.customerEmail.message}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  {...register('customerPhone')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Move Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Move Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intended Move Date
                </label>
                <input
                  type="date"
                  {...register('moveDate')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moving From
                </label>
                <textarea
                  {...register('fromAddress')}
                  placeholder="Current address"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moving To
                </label>
                <textarea
                  {...register('toAddress')}
                  placeholder="New address"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                {...register('notes')}
                placeholder="Any special instructions or notes..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
