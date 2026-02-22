'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { inventoryAPI } from '@/lib/api-client';
import { useAPICall } from '@/lib/hooks';
import { ArrowLeft, Copy, Check, ArrowRight, KeyRound } from 'lucide-react';
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
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const callAPI = useAPICall();

  const handleCopy = async () => {
    if (!createdToken) return;
    await navigator.clipboard.writeText(createdToken);
    setCopied(true);
    toast.success('Token copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = async (data: FormData) => {
    const result = await callAPI(
      () => inventoryAPI.create(data),
      { successMessage: 'Inventory created successfully!' }
    );

    if (result?.data?.data?.token) {
      setCreatedToken(result.data.data.token);
    }
  };

  // ── Token reveal screen ──────────────────────────────────────────────────
  if (createdToken) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventory Created!</h1>
          <p className="text-gray-600 mb-8">
            Save your access token — you&apos;ll need it to return to your inventory later.
          </p>

          {/* Token display */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Access Token</p>
            <div className="flex items-center gap-2 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl px-4 py-4">
              <code className="flex-1 text-lg font-mono font-bold text-indigo-700 tracking-widest break-all text-left select-all">
                {createdToken}
              </code>
              <button
                onClick={handleCopy}
                className={`shrink-0 p-2 rounded-lg transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-200 hover:bg-indigo-100 text-gray-600 hover:text-indigo-700'
                }`}
                title="Copy token"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="mb-8 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 text-left">
            <strong>Important:</strong> This token is your only way to access this inventory. Keep it somewhere safe — you can also find it in any emails we send you.
          </div>

          {/* CTA */}
          <button
            onClick={() => router.push(`/inventory/${createdToken}`)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg"
          >
            Go to My Inventory
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

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
