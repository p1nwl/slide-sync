import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface PresentationStore {
  userId: string;
  nickname: string;
  setUserInfo: (userId: string, nickname: string) => void;
  clearUserInfo: () => void;
}

export const usePresentationStore = create<PresentationStore>()(
  persist(
    (set) => ({
      userId: "",
      nickname: "",
      setUserInfo: (userId, nickname) => set({ userId, nickname }),
      clearUserInfo: () => set({ userId: "", nickname: "" }),
    }),
    {
      name: "presentation_user_storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
