import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

interface AdminAuthState {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  setAdmin: (admin: Admin, token: string) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,
      setAdmin: (admin, token) => {
        localStorage.setItem("nijer_bazaar_admin_token", token);
        set({ admin, token, isAuthenticated: Boolean(admin && token) });
      },
      logout: () => {
        localStorage.removeItem("nijer_bazaar_admin_token");
        set({ admin: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "admin-auth-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = Boolean(state.admin && state.token);
        }
      },
    }
  )
);