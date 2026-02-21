'use client';

import { useState, useEffect } from 'react';
import { itemsAPI, itemLibraryAPI } from '@/lib/api-client';
import { useAPICall } from '@/lib/hooks';
import { X, Search } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { ItemLibraryEntry, RoomItem } from '@/types';
import PhotoUploadSection from './PhotoUploadSection';

interface CreateItemModalProps {
  token: string;
  roomId: string;
  editingItem?: RoomItem;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  name: string;
  category: string;
  quantity: number;
  cuFtPerItem?: number;
  weightPerItem?: number;
  notes?: string;
};

export default function CreateItemModal({
  token,
  roomId,
  editingItem,
  onClose,
  onSuccess,
}: CreateItemModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [libraryItems, setLibraryItems] = useState<ItemLibraryEntry[]>([]);
  const [filteredItems, setFilteredItems] = useState<ItemLibraryEntry[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>(editingItem?.images || []);
  const { register, handleSubmit, formState: { isSubmitting }, setValue, watch } = useForm<FormData>({
    defaultValues: editingItem
      ? {
        name: editingItem.name,
        category: editingItem.category,
        quantity: editingItem.quantity,
        cuFtPerItem: editingItem.cuFtPerItem ? Number(editingItem.cuFtPerItem) : undefined,
        weightPerItem: editingItem.weightPerItem ? Number(editingItem.weightPerItem) : undefined,
        notes: editingItem.notes,
      }
      : { quantity: 1 },
  });

  const nameFieldValue = watch('name');
  const callAPI = useAPICall();

  useEffect(() => {
    const loadLibraryData = async () => {
      const [itemsRes, categoriesRes] = await Promise.all([
        callAPI(() => itemLibraryAPI.search({ q: '' })),
        callAPI(() => itemLibraryAPI.getCategories()),
      ]);

      if (itemsRes?.data?.data) {
        setLibraryItems(itemsRes.data.data);
      }
      if (categoriesRes?.data?.data) {
        setCategories(categoriesRes.data.data);
      }
    };

    loadLibraryData();
  }, [callAPI]);

  useEffect(() => {
    (async () => {
      if (searchInput.trim() === '') {
        setFilteredItems([]);
        return;
      }

      const res = await callAPI(() => itemLibraryAPI.search({ q: searchInput }));
      if (res?.data?.data) {
        setFilteredItems(
          libraryItems.filter(
            (item) =>
              item.name.toLowerCase().includes(searchInput.toLowerCase()) ||
              item.category.toLowerCase().includes(searchInput.toLowerCase())
          )
        );
      }
    })();
  }, [searchInput, libraryItems, callAPI]);

  const handleSelectLibraryItem = (item: ItemLibraryEntry) => {
    setValue('name', item.name);
    setValue('category', item.category);
    if (item.cuFt) setValue('cuFtPerItem', Number(item.cuFt));
    if (item.weight) setValue('weightPerItem', Number(item.weight));
    setSearchInput('');
    setFilteredItems([]);
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setSubmitError(null); // Reset error state on new attempt

    try {
      if (editingItem) {
        // Update quantity
        const updateRes = await callAPI(
          () => itemsAPI.updateQuantity(token, roomId, editingItem.id, data.quantity),
          { successMessage: 'Item updated' }
        );

        if (!updateRes) {
          throw new Error('Failed to update quantity');
        }

        // Update images if changed
        if (JSON.stringify(photos) !== JSON.stringify(editingItem.images || [])) {
          const imagesRes = await callAPI(
            () => itemsAPI.updateImages(token, roomId, editingItem.id, photos),
            { errorMessage: 'Failed to update photos' }
          );
          if (!imagesRes) {
            throw new Error('Failed to update photos');
          }
        }
      } else {
        // Create new item with photos
        const createRes = await callAPI(
          () => itemsAPI.create(token, roomId, { ...data, images: photos }),
          { successMessage: 'Item added' }
        );

        if (!createRes) {
          throw new Error('Failed to create item');
        }
      }

      onSuccess(); // This will close the modal and refresh the parent data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save item. Please try again.';
      setSubmitError(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Item Search */}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {submitError}
            </div>
          )}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search library or enter custom name"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Display selected item name below search */}
            {nameFieldValue && !searchInput && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-gray-900 font-medium">Selected: {nameFieldValue}</div>
                <button
                  type="button"
                  onClick={() => {
                    setValue('name', '');
                    setSearchInput('');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                >
                  Clear selection
                </button>
              </div>
            )}

            {/* Suggestions */}
            {searchInput && filteredItems.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                {filteredItems.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectLibraryItem(item)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-600">{item.category}</div>
                  </button>
                ))}
              </div>
            )}

            {searchInput && filteredItems.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-10">
                <p className="text-sm text-gray-600">No items found. You can still use custom names.</p>
              </div>
            )}

            {/* Hidden field for name to preserve form state */}
            <input
              type="hidden"
              {...register('name', { required: 'Item name is required' })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              {...register('category')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              {...register('quantity', { required: 'Quantity is required', valueAsNumber: true })}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {!editingItem && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cubic Feet per Item
                </label>
                <input
                  type="number"
                  {...register('cuFtPerItem', { valueAsNumber: true })}
                  placeholder="0"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight per Item (lbs)
                </label>
                <input
                  type="number"
                  {...register('weightPerItem', { valueAsNumber: true })}
                  placeholder="0"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  {...register('notes')}
                  placeholder="Any special handling instructions..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </>
          )}

          {/* Photo Upload Section */}
          <PhotoUploadSection
            token={token}
            existingPhotos={photos}
            onPhotosChange={setPhotos}
            maxPhotos={3}
          />

          <div className="flex gap-3 mt-6 sticky bottom-0 bg-white pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
