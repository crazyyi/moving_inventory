import { create } from 'zustand';

interface AuthStore {
  adminKey: string | null;
  token: string | null;
  isHydrated: boolean;
  setAdminKey: (key: string) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  adminKey: null,
  token: null,
  isHydrated: false,

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const adminKey = localStorage.getItem('adminKey');
    const token = localStorage.getItem('token');
    set({ adminKey, token, isHydrated: true });
  },

  setAdminKey: (key: string) => {
    localStorage.setItem('adminKey', key);
    set({ adminKey: key });
  },

  setToken: (token: string) => {
    localStorage.setItem('token', token);
    set({ token });
  },

  clearAuth: () => {
    localStorage.removeItem('adminKey');
    localStorage.removeItem('token');
    set({ adminKey: null, token: null });
  },
}));

interface InventoryStore {
  currentInventory: any;
  setCurrentInventory: (inventory: any) => void;
  clearInventory: () => void;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  currentInventory: null,
  setCurrentInventory: (inventory) => set({ currentInventory: inventory }),
  clearInventory: () => set({ currentInventory: null }),
}));
