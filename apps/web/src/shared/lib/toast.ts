"use client";

import type { ReactNode } from "react";
import { create } from "zustand";

export type Toast = {
  id: number;
  message: ReactNode;
  /** Leading visual, typically a mascot avatar for important events. */
  icon?: ReactNode;
};

type ToastState = {
  toasts: readonly Toast[];
  dismiss: (id: number) => void;
};

const AUTO_DISMISS_MS = 6000;
let sequence = 0;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

/** Shows a toast; it dismisses itself after a few seconds. */
export function toast(message: ReactNode, options: { icon?: ReactNode } = {}) {
  const id = ++sequence;
  useToastStore.setState((state) => ({ toasts: [...state.toasts, { id, message, icon: options.icon }] }));
  setTimeout(() => useToastStore.getState().dismiss(id), AUTO_DISMISS_MS);
}
