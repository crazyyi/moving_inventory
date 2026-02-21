'use client';

import { useState } from 'react';
import Image from 'next/image';
import { itemsAPI } from '@/lib/api-client';
import { useAPICall } from '@/lib/hooks';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { RoomSummary, RoomItem } from '@/types';
import CreateItemModal from './CreateItemModal';
import PhotoViewerModal from './PhotoViewerModal';

interface ItemListProps {
  token: string;
  room: RoomSummary;
  onUpdate: () => void;
}

export default function ItemList({ token, room, onUpdate }: ItemListProps) {
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [editingItem, setEditingItem] = useState<RoomItem | null>(null);
  const [viewingPhotosItem, setViewingPhotosItem] = useState<RoomItem | null>(null);
  const callAPI = useAPICall();

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this item?')) return;

    // Wait for the API result
    const res = await callAPI(
      () => itemsAPI.delete(token, room.id, itemId),
      { successMessage: 'Item deleted' }
    );

    // Only refresh data if the delete actually happened
    if (res) onUpdate();
  };

  // Helper to handle success from modals
  const handleActionSuccess = () => {
    onUpdate();           // Refresh the list in the background
    setShowCreateItem(false); // Close add modal
    setEditingItem(null);     // Close edit modal
  };

  return (
    <div className="space-y-4">
      {/* ... Header and list rendering remains the same ... */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Items</h4>
        <button
          onClick={() => setShowCreateItem(true)}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {room.items && room.items.length > 0 ? (
        <div className="space-y-3">
          {room.items.map((item: RoomItem) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              {/* Item Header with Name and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 text-lg">{item.name}</h5>
                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
                    <span>Qty: {item.quantity}</span>
                    {item.totalCuFt && <span>Vol: {Number(item.totalCuFt).toFixed(1)} cu ft</span>}
                    {item.totalWeight && <span>Wt: {Number(item.totalWeight).toFixed(0)} lbs</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit item"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Photo Section */}
              {item.images && item.images.length > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Photos ({item.images.length}/3)
                  </p>
                  <div className="flex gap-2">
                    {item.images.map((photo, idx) => (
                      <button
                        key={idx}
                        onClick={() => setViewingPhotosItem(item)}
                        className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 hover:border-blue-500 hover:shadow-md transition-all shrink-0 group"
                        title="Click to view all photos"
                      >
                        <Image
                          src={photo}
                          alt={`${item.name} photo ${idx + 1}`}
                          fill
                          className="object-contain group-hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                          <span className="text-white text-xs font-semibold">View</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-sm">No items in this room yet</p>
        </div>
      )}

      {/* MODALS */}
      {showCreateItem && (
        <CreateItemModal
          token={token}
          roomId={room.id}
          onClose={() => setShowCreateItem(false)}
          onSuccess={handleActionSuccess} // Uses the new helper
        />
      )}

      {editingItem && (
        <CreateItemModal
          token={token}
          roomId={room.id}
          editingItem={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={handleActionSuccess} // Uses the new helper
        />
      )}

      {viewingPhotosItem && viewingPhotosItem.images && viewingPhotosItem.images.length > 0 && (
        <PhotoViewerModal
          token={token}
          roomId={room.id}
          itemId={viewingPhotosItem.id}
          itemName={viewingPhotosItem.name}
          photos={viewingPhotosItem.images}
          onClose={() => setViewingPhotosItem(null)}
          onPhotosUpdated={(updatedPhotos) => {
            // Update the item with new photos and refresh
            if (viewingPhotosItem) {
              const updatedItem = { ...viewingPhotosItem, images: updatedPhotos };
              setViewingPhotosItem(updatedItem);
            }
            onUpdate();
          }}
        />
      )}
    </div>
  );
}