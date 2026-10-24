import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AdminAuthState {
  admin: AdminUser | null;
  token: string | null;
  setAdmin: (admin: AdminUser, token: string) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      setAdmin: (admin, token) => {
        localStorage.setItem("nijer_bazaar_admin_token", token);
        set({ admin, token });
      },
      logout: () => {
        localStorage.removeItem("nijer_bazaar_admin_token");
        set({ admin: null, token: null });
      },
    }),
    { name: "nijer_bazaar_admin_auth" }
  )
);