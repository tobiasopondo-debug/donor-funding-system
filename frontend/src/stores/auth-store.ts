import { create } from "zustand";

export type User = {
  id: string;
  email: string;
  role: "DONOR" | "NGO_USER" | "PLATFORM_ADMIN";
};

type AuthState = {
  accessToken: string | null;
  user: User | null;
  hydrated: boolean;
  setSession: (accessToken: string, user: User) => void;
  clearSession: () => void;
  setHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  hydrated: false,
  setSession: (accessToken, user) => set({ accessToken, user }),
  clearSession: () => set({ accessToken: null, user: null }),
  setHydrated: (v) => set({ hydrated: v }),
}));
