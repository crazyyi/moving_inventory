'use client';

import Link from 'next/link';
import { Package, BarChart3, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Ship Your Inventory</h1>
          </div>
          <p className="text-gray-600 mt-2">Organize and manage your move with ease</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Create/View Inventory Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Your Inventory</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Create a new inventory to get started with tracking your moving items or access an
              existing inventory.
            </p>
            <div className="space-y-3">
              <Link
                href="/inventory/create"
                className="flex items-center justify-between w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create New Inventory
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/inventory/access"
                className="flex items-center justify-between w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Access Existing Inventory
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Admin Dashboard Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-8 h-8 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Manage all inventories, view statistics, and oversee all customer moves in one place.
            </p>
            <Link
              href="/admin/login"
              className="flex items-center justify-between w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Admin Login
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Room Organization', description: 'Organize items by room for better inventory management' },
              { title: 'Detailed Tracking', description: 'Track cubic footage, weight, and special requirements' },
              { title: 'Photo Documentation', description: 'Upload photos for each item for reference' },
              { title: 'Item Library', description: 'Access pre-configured items with standard measurements' },
              { title: 'Admin Management', description: 'Complete dashboard for managing all inventories' },
              { title: 'Data Export', description: 'Export inventory data for various purposes' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
