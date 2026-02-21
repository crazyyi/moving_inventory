'use client';

import { useState } from 'react';
import { roomsAPI } from '@/lib/api-client';
import { useAPICall } from '@/lib/hooks';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { RoomSummary, RoomItem } from '@/types';
import ItemList from './ItemList';



interface RoomListProps {
  token: string;
  rooms: RoomSummary[];
  onUpdate: () => void;
}

export default function RoomList({ token, rooms, onUpdate }: RoomListProps) {
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set(rooms.length > 0 ? [rooms[0].id] : []));
  const callAPI = useAPICall();

  const toggleRoom = (roomId: string) => {
    const newExpanded = new Set(expandedRooms);
    if (newExpanded.has(roomId)) {
      newExpanded.delete(roomId);
    } else {
      newExpanded.add(roomId);
    }
    setExpandedRooms(newExpanded);
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room and all its items?')) {
      return;
    }

    await callAPI(
      () => roomsAPI.delete(token, roomId),
      { successMessage: 'Room deleted successfully' }
    );
    onUpdate();
  };

  return (
    <div className="space-y-4">
      {rooms.map((room) => (
        <div key={room.id} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Room Header */}
          <div
            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
            onClick={() => toggleRoom(room.id)}
          >
            <div className="flex items-center gap-4 flex-1">
              {expandedRooms.has(room.id) ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">
                  {room.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {room.items?.length || 0} items • {room.items?.reduce((sum: number, item: RoomItem) => sum + (Number(item.totalCuFt) || 0), 0).toFixed(1) || '0'} cu ft
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteRoom(room.id);
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Room Content */}
          {expandedRooms.has(room.id) && (
            <div className="p-4 border-t border-gray-200">
              <ItemList token={token} room={room} onUpdate={onUpdate} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
