import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RegexBlock } from "../types/regex";

export interface SavedPattern {
    id: string;
    name: string;
    blocks: RegexBlock[];
    createdAt: number;
}

interface SavedPatternsStore {
    patterns: SavedPattern[];
    save: (name: string, blocks: RegexBlock[]) => void;
    remove: (id: string) => void;
    rename: (id: string, name: string) => void;
}

export const useSavedPatternsStore = create<SavedPatternsStore>()(
    persist(
        (set) => ({
            patterns: [],

            save: (name, blocks) =>
                set((state) => ({
                    patterns: [
                        {
                            id: `pattern-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                            name,
                            blocks,
                            createdAt: Date.now(),
                        },
                        ...state.patterns,
                    ],
                })),

            remove: (id) =>
                set((state) => ({
                    patterns: state.patterns.filter((p) => p.id !== id),
                })),

            rename: (id, name) =>
                set((state) => ({
                    patterns: state.patterns.map((p) =>
                        p.id === id ? { ...p, name } : p
                    ),
                })),
        }),
        { name: "visual-regex-builder-saved-patterns" }
    )
);
