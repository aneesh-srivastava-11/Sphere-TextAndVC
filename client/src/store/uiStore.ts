import { create } from "zustand";

interface UiState {
    isRightPanelOpen: boolean;
    toggleRightPanel: () => void;
    setRightPanelOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
    isRightPanelOpen: false,
    toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
    setRightPanelOpen: (open) => set({ isRightPanelOpen: open }),
}));
