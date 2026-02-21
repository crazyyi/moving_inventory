'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from './api-client';

export function useAPICall() {
  return useCallback(async <T,>(
    fn: () => Promise<T>,
    options?: { successMessage?: string; errorMessage?: string }
  ): Promise<T | null> => {
    try {
      const result = await fn();
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      return result;
    } catch (error: any) {
      const message =
        options?.errorMessage ||
        error?.response?.data?.message ||
        error?.message ||
        'An error occurred';
      toast.error(message);
      console.error('API Error:', error);
      return null;
    }
  }, []);
}

export function useAuthHeader() {
  return useCallback(() => {
    const adminKey = typeof window !== 'undefined' ? localStorage.getItem('adminKey') : null;
    return {
      ...(adminKey && { 'x-admin-key': adminKey }),
    };
  }, []);
}
