import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  settingsReturnPath: string | null;
  saveSettingsReturnPath: (path: string) => void;
  popSettingsReturnPath: () => string | null;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isCollapsed: false,
      toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      settingsReturnPath: null,
      saveSettingsReturnPath: (path: string) => set({ settingsReturnPath: path }),
      popSettingsReturnPath: () => {
        const path = get().settingsReturnPath;
        set({ settingsReturnPath: null });
        return path;
      },
    }),
    { name: 'sidebar-store' },
  ),
);
