import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from './stores';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/backend';

const apiClient: AxiosInstance = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include admin key if available
apiClient.interceptors.request.use((config) => {
  const { adminKey } = useAuthStore.getState();
  if (adminKey) {
    config.headers['x-admin-key'] = adminKey;
  }
  return config;
});

export default apiClient;

// Inventory API
export const inventoryAPI = {
  create: (data: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    moveDate: string;
    fromAddress: string;
    toAddress: string;
  }) => apiClient.post('/inventories', data),

  getByToken: (token: string) => apiClient.get(`/inventories/${token}`),

  getSummary: (token: string) => apiClient.get(`/inventories/${token}/summary`),

  update: (token: string, data: Record<string, unknown>) =>
    apiClient.patch(`/inventories/${token}`, data),

  submit: (token: string) => apiClient.post(`/inventories/${token}/submit`),
};

// Rooms API
export const roomsAPI = {
  list: (token: string) => apiClient.get(`/inventories/${token}/rooms`),

  create: (token: string, data: { type: string; customName?: string }) =>
    apiClient.post(`/inventories/${token}/rooms`, data),

  update: (token: string, roomId: string, data: Record<string, unknown>) =>
    apiClient.patch(`/inventories/${token}/rooms/${roomId}`, data),

  delete: (token: string, roomId: string) =>
    apiClient.delete(`/inventories/${token}/rooms/${roomId}`),
};

// Items API
export const itemsAPI = {
  create: (
    token: string,
    roomId: string,
    data: {
      name: string;
      category: string;
      quantity: number;
      cuFtPerItem?: number;
      weightPerItem?: number;
      images?: string[];
      notes?: string;
    }
  ) => apiClient.post(`/inventories/${token}/rooms/${roomId}/items`, data),

  updateQuantity: (token: string, roomId: string, itemId: string, quantity: number) =>
    apiClient.patch(`/inventories/${token}/rooms/${roomId}/items/${itemId}/quantity`, {
      quantity,
    }),

  updateImages: (token: string, roomId: string, itemId: string, images: string[]) =>
    apiClient.patch(`/inventories/${token}/rooms/${roomId}/items/${itemId}/images`, {
      images,
    }),

  delete: (token: string, roomId: string, itemId: string) =>
    apiClient.delete(`/inventories/${token}/rooms/${roomId}/items/${itemId}`),
};

// Item Library API
export const itemLibraryAPI = {
  search: (params: { q?: string; category?: string; roomType?: string }) =>
    apiClient.get('/item-library', { params }),

  getCategories: () => apiClient.get('/item-library/categories'),
};

// Upload API
export const uploadAPI = {
  uploadImage: (base64: string, inventoryToken?: string) =>
    apiClient.post('/upload/image', {
      base64Data: base64,
      inventoryToken
    }),

  getSignedUrl: (filename: string) =>
    apiClient.get('/upload/sign', { params: { filename } }),
};

// Admin API
export const adminAPI = {
  getStats: () => apiClient.get('/admin/inventories/stats'),

  listInventories: (params: {
    status?: string;
    search?: string;      // For customer name or email
    startDate?: string;   // For filtering move dates
    endDate?: string;     // For filtering move dates
    sortBy?: string;      // e.g., 'moveDate' or 'createdAt'
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  } = {}) => apiClient.get('/admin/inventories', { params }),

  getSummary: (inventoryId: string) =>
    apiClient.get(`/admin/inventories/${inventoryId}/summary`),

  lock: (inventoryId: string) =>
    apiClient.post(`/admin/inventories/${inventoryId}/lock`),

  pushToGHL: (inventoryId: string) =>
    apiClient.post(`/admin/inventories/${inventoryId}/push-ghl`),

  updateNotes: (inventoryId: string, notes: string) =>
    apiClient.patch(`/admin/inventories/${inventoryId}/notes`, { notes }),

  getAuditLogs: (inventoryId: string, limit: number = 20) =>
    apiClient.get(`/admin/inventories/${inventoryId}/audit-logs`, { params: { limit } }),
};
