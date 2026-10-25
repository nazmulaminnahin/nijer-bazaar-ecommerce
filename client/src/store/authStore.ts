import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserData {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar?: string | null;
  role: string;
  loyaltyPoints: number;
  createdAt?: string;
}

interface AuthState {
  user: UserData | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: UserData, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user, token) => {
        localStorage.setItem("nijer_bazaar_token", token);
        set({
          user: {
            ...user,
            phone: user.phone ?? "",
            loyaltyPoints: user.loyaltyPoints ?? 0,
          },
          token,
          isAuthenticated: Boolean(user && token),
        });
      },
      logout: () => {
        localStorage.removeItem("nijer_bazaar_token");
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "nijer_bazaar_auth",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = Boolean(state.user && state.token);
        }
      },
    }
  )
);