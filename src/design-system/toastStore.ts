import { create } from "zustand";

export type ToastVariant = "neutral" | "success" | "warning" | "danger";

export interface ToastItem {
    id: string;
    title: string;
    description?: string;
    variant: ToastVariant;
}

interface ToastStore {
    toasts: ToastItem[];
    push: (toast: Omit<ToastItem, "id">) => void;
    dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],

    push: (toast) =>
        set((state) => ({
            toasts: [
                ...state.toasts,
                {
                    ...toast,
                    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                },
            ],
        })),

    dismiss: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}));

export function toast(options: Omit<ToastItem, "id">): void {
    useToastStore.getState().push(options);
}
