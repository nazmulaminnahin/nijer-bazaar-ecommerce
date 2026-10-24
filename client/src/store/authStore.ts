import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: UserData | null;
  token: string | null;
  setUser: (user: UserData, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user, token) => {
        localStorage.setItem("nijer_bazaar_token", token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem("nijer_bazaar_token");
        set({ user: null, token: null });
      },
    }),
    { name: "nijer_bazaar_auth" }
  )
);