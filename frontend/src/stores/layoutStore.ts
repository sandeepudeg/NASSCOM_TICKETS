import { create } from 'zustand'
import { ReactNode } from 'react'

interface LayoutState {
  footerActions: ReactNode | null
  setFooterActions: (actions: ReactNode | null) => void
  clearFooterActions: () => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  footerActions: null,
  setFooterActions: (actions) => set({ footerActions: actions }),
  clearFooterActions: () => set({ footerActions: null }),
}))
