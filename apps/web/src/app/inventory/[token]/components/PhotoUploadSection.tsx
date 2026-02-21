'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { uploadAPI } from '@/lib/api-client';
import { useAPICall } from '@/lib/hooks';
import { Camera, X, Upload } from 'lucide-react';

interface PhotoUploadSectionProps {
  token: string;
  existingPhotos?: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export default function PhotoUploadSection({
  token,
  existingPhotos = [],
  onPhotosChange,
  maxPhotos = 3,
}: PhotoUploadSectionProps) {
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const callAPI = useAPICall();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (!files) return;

    const filesToProcess = Array.from(files);
    const availableSlots = maxPhotos - photos.length;

    if (filesToProcess.length > availableSlots) {
      alert(`You can only add ${availableSlots} more photo(s).`);
      return;
    }

    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToProcess) {
        // Convert file to base64
        const reader = new FileReader();

        const base64String = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            // Extract only the base64 part (after data:image/...;base64,)
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Upload to backend
        const res = await callAPI(
          () => uploadAPI.uploadImage(base64String, token),
          { errorMessage: `Failed to upload ${file.name}` }
        );

        if (res?.data?.data?.url) {
          uploadedUrls.push(res.data.data.url);
        }
      }

      const updatedPhotos = [...photos, ...uploadedUrls];
      setPhotos(updatedPhotos);
      onPhotosChange(updatedPhotos);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Item Photos
        </h3>
        <span className="text-sm text-gray-600 font-semibold">
          {photos.length}/{maxPhotos}
        </span>
      </div>

      {/* Upload Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(photos.length / maxPhotos) * 100}%` }}
        ></div>
      </div>

      {/* Upload Button */}
      {canAddMore && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <>
                <Upload className="w-5 h-5 text-gray-400 animate-bounce" />
                <span className="text-sm text-gray-600">Uploading...</span>
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600 text-center">
                  {maxPhotos - photos.length === maxPhotos
                    ? 'Click to add photos (or from camera roll on mobile)'
                    : `Add ${maxPhotos - photos.length} more ${maxPhotos - photos.length === 1 ? 'photo' : 'photos'}`}
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative border border-gray-200 hover:border-blue-400 transition-colors">
                <Image
                  src={photo}
                  alt={`Item photo ${index + 1}`}
                  fill
                  className="object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemovePhoto(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && !canAddMore && (
        <div className="text-sm text-gray-500 text-center py-3 bg-blue-50 rounded-lg border border-blue-200">
          You&apos;ve reached the maximum number of photos ({maxPhotos})
        </div>
      )}
    </div>
  );
}
