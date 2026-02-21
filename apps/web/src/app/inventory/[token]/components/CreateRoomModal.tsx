'use client';

import { useState } from 'react';
import { roomsAPI } from '@/lib/api-client';
import { useAPICall } from '@/lib/hooks';
import { Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';

const ROOM_TYPES = [
  { id: 'living_room', label: 'Living Room' },
  { id: 'master_bedroom', label: 'Master Bedroom' },
  { id: 'bedroom', label: 'Bedroom' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'dining_room', label: 'Dining Room' },
  { id: 'bathroom', label: 'Bathroom' },
  { id: 'garage', label: 'Garage' },
  { id: 'office', label: 'Office' },
  { id: 'basement', label: 'Basement' },
  { id: 'attic', label: 'Attic' },
  { id: 'storage', label: 'Storage' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'other', label: 'Other' },
];

interface CreateRoomModalProps {
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  type: string;
  customName: string;
};

export default function CreateRoomModal({ token, onClose, onSuccess }: CreateRoomModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();
  const callAPI = useAPICall();

  const onSubmit = async (data: FormData) => {
    await callAPI(
      () => roomsAPI.create(token, data),
      { successMessage: 'Room created successfully' }
    );
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New Room</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Type *
            </label>
            <select
              {...register('type', { required: 'Room type is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select a room type</option>
              {ROOM_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <span className="text-red-600 text-sm mt-1">{errors.type.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Name (Optional)
            </label>
            <input
              type="text"
              {...register('customName')}
              placeholder="e.g., Master Bedroom - 2nd Floor"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {isSubmitting ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
