'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminAPI } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores';
import { useAPICall } from '@/lib/hooks';
import { ArrowLeft, Lock, Send } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { InventorySummaryResponse, Room, RoomItem } from '@/types';
import PhotoViewerModal from '@/app/inventory/[token]/components/PhotoViewerModal';

export default function AdminInventoryDetail() {
  const params = useParams();
  const router = useRouter();
  const inventoryId = params.id as string;
  const { adminKey, hydrate } = useAuthStore();

  const [inventory, setInventory] = useState<InventorySummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingPhotosItem, setViewingPhotosItem] = useState<(RoomItem & { roomId?: string }) | null>(null);
  const callAPI = useAPICall();

  const loadInventory = useCallback(async () => {
    const result = await callAPI(() => adminAPI.getSummary(inventoryId));
    if (result?.data?.data) {
      setInventory(result.data.data);
    }
    setIsLoading(false);
  }, [inventoryId, callAPI]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!adminKey) {
      router.push('/admin/login');
      return;
    }
    (async () => {
      await loadInventory();
    })();
  }, [router, adminKey, loadInventory]);

  const handleLock = async () => {
    if (!confirm('Lock this inventory? This will prevent further edits.')) return;

    await callAPI(() => adminAPI.lock(inventoryId), {
      successMessage: 'Inventory locked successfully',
    });
    loadInventory();
  };

  const handlePushGHL = async () => {
    await callAPI(() => adminAPI.pushToGHL(inventoryId), {
      successMessage: 'Inventory pushed to GHL',
    });
    loadInventory();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading inventory...</p>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inventory Not Found</h2>
          <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const inventoryData = inventory.inventory || inventory;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {inventoryData.customerName}&apos;s Inventory
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <p className="text-gray-600 text-sm mb-1">Status</p>
            <p className="text-2xl font-bold text-gray-900">
              {inventoryData.status?.replace('_', ' ').toUpperCase()}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <p className="text-gray-600 text-sm mb-1">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{inventoryData.totalItems || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <p className="text-gray-600 text-sm mb-1">Total Cubic Feet</p>
            <p className="text-2xl font-bold text-gray-900">
              {Number(inventoryData.totalCuFt).toFixed(1) || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <p className="text-gray-600 text-sm mb-1">Total Weight</p>
            <p className="text-2xl font-bold text-gray-900">
              {Number(inventoryData.totalWeight).toFixed(0) || 0} lbs
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm">Name</p>
                <p className="font-semibold text-gray-900">{inventoryData.customerName}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Email</p>
                <p className="font-semibold text-gray-900">{inventoryData.customerEmail}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Phone</p>
                <p className="font-semibold text-gray-900">{inventoryData.customerPhone}</p>
              </div>
            </div>
          </div>

          {/* Move Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Move Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm">Move Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(inventoryData.moveDate || '').toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">From</p>
                <p className="font-semibold text-gray-900">{inventoryData.fromAddress}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">To</p>
                <p className="font-semibold text-gray-900">{inventoryData.toAddress}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rooms */}
        {inventoryData.rooms && inventoryData.rooms.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Rooms</h2>
            <div className="space-y-4">
              {inventoryData.rooms.map((room: Room) => (
                <details key={room.id} className="border border-gray-200 rounded-lg p-4">
                  <summary className="cursor-pointer font-semibold text-gray-900">
                    {room.customName || room.type} ({room.items?.length || 0} items)
                  </summary>
                  <div className="mt-4 space-y-2">
                    {room.items?.map((item: RoomItem) => (
                      <div key={item.id} className="text-sm text-gray-600 pl-4 border-l-2 border-gray-200">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs mb-2">
                          Qty: {item.quantity} {item.totalCuFt && `| Vol: ${Number(item.totalCuFt).toFixed(1)} cu ft`}
                        </div>

                        {/* Photo Thumbnails */}
                        {item.images && item.images.length > 0 && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {item.images.map((photo, idx) => (
                              <button
                                key={idx}
                                onClick={() => setViewingPhotosItem({ ...item, roomId: room.id })}
                                className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-300 hover:border-blue-500 hover:shadow-md transition-all hover:scale-105"
                                title="Click to view all photos"
                              >
                                <Image
                                  src={photo}
                                  alt={`${item.name} photo ${idx + 1}`}
                                  fill
                                  className="object-contain"
                                />
                                {idx === 0 && (item.images?.length || 0) > 1 && (
                                  <div className="absolute top-1 right-1 bg-black/50 text-white text-xs rounded px-1">
                                    +{(item.images?.length || 0) - 1}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {!inventoryData.isLocked && (
            <button
              onClick={handleLock}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <Lock className="w-5 h-5" />
              Lock Inventory
            </button>
          )}

          <button
            onClick={handlePushGHL}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Send className="w-5 h-5" />
            Push to GHL
          </button>
        </div>

        {/* Photo Viewer Modal */}
        {viewingPhotosItem && viewingPhotosItem.images && viewingPhotosItem.images.length > 0 && (
          <PhotoViewerModal
            token={inventoryId}
            roomId={viewingPhotosItem.roomId || ''}
            itemId={viewingPhotosItem.id}
            itemName={viewingPhotosItem.name}
            photos={viewingPhotosItem.images}
            onClose={() => setViewingPhotosItem(null)}
            onPhotosUpdated={() => {
              // Admin doesn't modify photos
              setViewingPhotosItem(null);
            }}
            readOnly={true}
          />
        )}
      </main>
    </div>
  );
}
