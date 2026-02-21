'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { inventoryAPI } from '@/lib/api-client';
import { useAPICall } from '@/lib/hooks';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

type FormData = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  moveDate: string;
  fromAddress: string;
  toAddress: string;
};

export default function CreateInventory() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();
  const callAPI = useAPICall();

  const onSubmit = async (data: FormData) => {
    const result = await callAPI(
      () => inventoryAPI.create(data),
      { successMessage: 'Inventory created successfully!' }
    );

    if (result?.data?.data?.token) {
      setTimeout(() => {
        router.push(`/inventory/${result.data.data.token}`);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Inventory</h1>
          <p className="text-gray-600 mb-8">
            Start by entering your information and moving details.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    {...register('customerName', { required: 'Name is required' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="John Doe"
                  />
                  {errors.customerName && (
                    <span className="text-red-600 text-sm mt-1">{errors.customerName.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    {...register('customerEmail', { required: 'Email is required' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="john@example.com"
                  />
                  {errors.customerEmail && (
                    <span className="text-red-600 text-sm mt-1">{errors.customerEmail.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    {...register('customerPhone', { required: 'Phone is required' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="(555) 123-4567"
                  />
                  {errors.customerPhone && (
                    <span className="text-red-600 text-sm mt-1">{errors.customerPhone.message}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Move Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Move Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Move Date *
                  </label>
                  <input
                    type="date"
                    {...register('moveDate', { required: 'Move date is required' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {errors.moveDate && (
                    <span className="text-red-600 text-sm mt-1">{errors.moveDate.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Address *
                  </label>
                  <input
                    type="text"
                    {...register('fromAddress', { required: 'From address is required' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="123 Old St, Old City, OC 12345"
                  />
                  {errors.fromAddress && (
                    <span className="text-red-600 text-sm mt-1">{errors.fromAddress.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Address *
                  </label>
                  <input
                    type="text"
                    {...register('toAddress', { required: 'To address is required' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="456 New Ave, New City, NC 67890"
                  />
                  {errors.toAddress && (
                    <span className="text-red-600 text-sm mt-1">{errors.toAddress.message}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
            >
              {isSubmitting ? 'Creating...' : 'Create Inventory'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
