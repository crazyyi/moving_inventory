'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { itemsAPI } from '@/lib/api-client';
import { useAPICall } from '@/lib/hooks';

interface PhotoViewerModalProps {
  token: string;
  roomId: string;
  itemId: string;
  itemName: string;
  photos: string[];
  onClose: () => void;
  onPhotosUpdated: (updatedPhotos: string[]) => void;
  readOnly?: boolean;
}

export default function PhotoViewerModal({
  token,
  roomId,
  itemId,
  itemName,
  photos,
  onClose,
  onPhotosUpdated,
  readOnly = false,
}: PhotoViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const callAPI = useAPICall();

  const currentPhoto = photos[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Handle ESC key and arrow navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose, photos.length]);

  const handleDeletePhoto = async () => {
    if (!confirm('Delete this photo?')) return;

    setIsDeleting(true);
    try {
      const updatedPhotos = photos.filter((_, idx) => idx !== currentIndex);
      const res = await callAPI(
        () => itemsAPI.updateImages(token, roomId, itemId, updatedPhotos),
        { successMessage: 'Photo removed' }
      );

      if (res) {
        onPhotosUpdated(updatedPhotos);
        // Adjust index if we deleted the last photo
        if (currentIndex >= updatedPhotos.length && updatedPhotos.length > 0) {
          setCurrentIndex(updatedPhotos.length - 1);
        }
        // Close modal if no photos left
        if (updatedPhotos.length === 0) {
          onClose();
        }
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{itemName}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close (or press ESC)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Photo Display */}
        <div className="flex-1 flex flex-col items-center justify-center relative bg-gray-50 p-8 overflow-auto min-h-125">
          {/* Main Image - Full size with original aspect ratio */}
          <div className="relative flex items-center justify-center max-w-full">
            <Image
              src={currentPhoto}
              alt={`${itemName} photo ${currentIndex + 1}`}
              width={2400}
              height={1600}
              className="w-auto h-auto max-w-full max-h-[70vh] object-contain"
              priority
            />
          </div>

          {/* Navigation */}
          {photos.length > 1 && (
            <div className="absolute bottom-8 flex items-center gap-4">
              <button
                onClick={handlePrevious}
                className="p-2 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-lg"
                title="Previous (or press Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="text-sm font-medium text-gray-900 bg-white px-4 py-2 rounded-lg shadow">
                {currentIndex + 1} / {photos.length}
              </span>
              <button
                onClick={handleNext}
                className="p-2 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-lg"
                title="Next (or press Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 gap-4">
          {!readOnly && (
            <button
              onClick={handleDeletePhoto}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete Photo'}
            </button>
          )}
          {readOnly && <div />}

          {/* Thumbnail Strip */}
          <div className="flex gap-2 overflow-x-auto max-w-lg">
            {photos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${idx === currentIndex
                  ? 'border-blue-600 ring-2 ring-blue-400'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
                title={`Go to photo ${idx + 1}`}
              >
                <Image
                  src={photo}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-contain"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}