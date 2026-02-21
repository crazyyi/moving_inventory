'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AccessInventory() {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error('Please enter an inventory token');
      return;
    }

    router.push(`/inventory/${token.trim()}`);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Your Inventory</h1>
          <p className="text-gray-600 mb-8">
            Enter your inventory token to access your moving inventory. You should have received this token
            when your inventory was created.
          </p>

          <form onSubmit={handleAccess} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inventory Token
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your token (e.g., abc123xyz789)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-lg"
              />
              <p className="text-gray-500 text-sm mt-2">
                Your token is a unique identifier provided when you created your inventory.
              </p>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Access Inventory
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Don't have a token?</h3>
            <p className="text-blue-800 text-sm mb-3">
              You can create a new inventory to get started.
            </p>
            <Link
              href="/inventory/create"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create New Inventory →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
