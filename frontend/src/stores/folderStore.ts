import { create } from 'zustand'

interface FolderState {
  selectedFolderId: string | null
  setSelectedFolderId: (id: string | null) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  mobileDrawerOpen: boolean
  setMobileDrawerOpen: (open: boolean) => void
}

export const useFolderStore = create<FolderState>((set) => ({
  selectedFolderId: null,
  setSelectedFolderId: (id) => set({ selectedFolderId: id }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  mobileDrawerOpen: false,
  setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),
}))
