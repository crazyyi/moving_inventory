"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores';
import { useAPICall } from '@/lib/hooks';
import { BarChart3, LogOut } from 'lucide-react';
import Link from 'next/link';
import { AdminStats, Inventory } from '@/types';

export default function AdminDashboard() {
  const router = useRouter();
  const { adminKey, hydrate } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const callAPI = useAPICall();

  const loadDashboardData = useCallback(async () => {
    const [statsRes, invRes] = await Promise.all([
      callAPI(() => adminAPI.getStats()),
      callAPI(() => adminAPI.listInventories({ limit: 10, offset: 0 })),
    ]);

    if (statsRes?.data?.data) {
      setStats(statsRes.data.data);
    }
    if (invRes?.data?.data) {
      setInventories(invRes.data.data);
    }
    setIsLoading(false);
  }, [callAPI]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!adminKey) {
      router.push('/admin/login');
      return;
    }
    (async () => {
      await loadDashboardData();
    })();
  }, [router, adminKey, loadDashboardData]);

  const handleLogout = () => {
    const { clearAuth } = useAuthStore.getState();
    clearAuth();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm mb-1">Total Inventories</p>
              <p className="text-4xl font-bold text-gray-900">{stats.totalInventories || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm mb-1">Draft</p>
              <p className="text-4xl font-bold text-yellow-600">{stats.draftCount || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm mb-1">Submitted</p>
              <p className="text-4xl font-bold text-green-600">{stats.submittedCount || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm mb-1">Locked</p>
              <p className="text-4xl font-bold text-purple-600">{stats.lockedCount || 0}</p>
            </div>
          </div>
        )}

        {/* Inventories List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Recent Inventories</h2>
          </div>

          {isLoading ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">Loading inventories...</p>
            </div>
          ) : inventories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Move Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inventories.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {inv.customerName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{inv.customerEmail}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {inv.moveDate ? new Date(inv.moveDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${inv.status === 'submitted'
                            ? 'bg-green-100 text-green-800'
                            : inv.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {inv.status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{inv.totalItems || 0}</td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/admin/inventory/${inv.id}`}
                          className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-600">No inventories found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
