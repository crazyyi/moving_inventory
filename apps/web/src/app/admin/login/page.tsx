'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';
import { BarChart3, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [adminKey, setAdminKey] = useState('');
  const router = useRouter();
  const { setAdminKey: storeAdminKey } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      toast.error('Please enter an admin key');
      return;
    }

    storeAdminKey(adminKey);
    router.push('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-50">
      <div className="max-w-md mx-auto px-4 py-16">
        <Link href="/" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-8">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mx-auto mb-4">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 text-center mb-8">
            Enter your admin key to access the dashboard
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Key
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter your admin key"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Login
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">
              Contact your administrator for an admin key if you don&apos;t have one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
