'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { inventoryAPI } from '@/lib/api-client';
import { useAPICall } from '@/lib/hooks';
import { Package, Plus, LogOut, Send, Lock } from 'lucide-react';
import Link from 'next/link';
import RoomList from './components/RoomList';
import CreateRoomModal from './components/CreateRoomModal';
import { Inventory, RoomSummary } from '@/types';

export default function InventoryPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const callAPI = useAPICall();

  useEffect(() => {
    const loadInventory = async () => {
      setIsLoadingInventory(true);
      try {
        const result = await callAPI(() => inventoryAPI.getSummary(token));
        console.log('API Result:', result);
        if (result?.data?.data) {
          console.log('Setting inventory:', result.data.data.inventory);
          setInventory(result.data.data.inventory);
          setRooms(result.data.data.roomSummaries || []);
        } else {
          console.log('No data in result:', result);
        }
      } catch (error) {
        console.error('Error loading inventory:', error);
      }
      setIsLoadingInventory(false);
    };

    if (token) {
      loadInventory();
    }
  }, [token, callAPI]);

  const handleRoomCreated = async () => {
    const result = await callAPI(() => inventoryAPI.getSummary(token));
    if (result?.data?.data) {
      setInventory(result.data.data.inventory);
      setRooms(result.data.data.roomSummaries || []);
    }
    setShowCreateRoom(false);
  };

  const handleLogout = () => {
    router.push('/');
  };

  const handleSubmit = async () => {
    if (!confirm('Submit your inventory? You will be able to view it but make limited edits.')) {
      return;
    }

    await callAPI(
      () => inventoryAPI.submit(token),
      { successMessage: 'Inventory submitted successfully!' }
    );

    const result = await callAPI(() => inventoryAPI.getSummary(token));
    if (result?.data?.data) {
      setInventory(result.data.data.inventory);
      setRooms(result.data.data.roomSummaries || []);
    }
  };

  if (isLoadingInventory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inventory Not Found</h2>
          <p className="text-gray-600 mb-6">The inventory you&apos;re looking for doesn&apos;t exist or has expired.</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{inventory.customerName}&apos;s Inventory</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${inventory.status === 'submitted'
                  ? 'bg-green-100 text-green-800'
                  : inventory.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                  } ${inventory.isLocked ? 'flex items-center gap-1' : ''}`}
              >
                {inventory.isLocked && <Lock className="w-3 h-3" />}
                {inventory.status?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600 text-sm mt-1">
              Move on {inventory.moveDate ? new Date(inventory.moveDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {inventory.status === 'draft' || inventory.status === 'in_progress' ? (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Send className="w-5 h-5" />
                Submit
              </button>
            ) : null}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              <LogOut className="w-5 h-5" />
              Exit
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Section */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <p className="text-gray-600 text-sm mb-1">Rooms</p>
            <p className="text-3xl font-bold text-gray-900">{rooms.length}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <p className="text-gray-600 text-sm mb-1">Total Items</p>
            <p className="text-3xl font-bold text-gray-900">
              {rooms.reduce((sum, r) => sum + (r.itemCount || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <p className="text-gray-600 text-sm mb-1">Cubic Feet</p>
            <p className="text-3xl font-bold text-gray-900">
              {Number(inventory.totalCuFt).toFixed(1) || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <p className="text-gray-600 text-sm mb-1">Total Weight</p>
            <p className="text-3xl font-bold text-gray-900">
              {Number(inventory.totalWeight).toFixed(0) || 0} lbs
            </p>
          </div>
        </div>

        {/* Rooms Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Rooms</h2>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Room
            </button>
          </div>

          {rooms.length > 0 ? (
            <RoomList token={token} rooms={rooms} onUpdate={handleRoomCreated} />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No rooms yet. Start by adding a room.</p>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Your First Room
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <CreateRoomModal
          token={token}
          onClose={() => setShowCreateRoom(false)}
          onSuccess={handleRoomCreated}
        />
      )}
    </div>
  );
}
