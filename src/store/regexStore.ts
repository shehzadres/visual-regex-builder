import { create } from "zustand";
import type { RegexBlock } from "../types/regex";

interface RegexStore {
    blocks: RegexBlock[];
    testText: string;
    flags: string;
    selectedBlockId: string | null;

    addBlock: (block: RegexBlock) => void;
    removeBlock: (id: string) => void;
    duplicateBlock: (id: string) => void;
    updateBlock: (id: string, value: string) => void;
    updateBlockFull: (id: string, patch: Partial<RegexBlock>) => void;
    reorderBlocks: (fromIndex: number, toIndex: number) => void;
    clearBlocks: () => void;

    setTestText: (text: string) => void;
    setFlags: (flags: string) => void;
    toggleFlag: (flag: string) => void;

    selectBlock: (id: string | null) => void;
}

export const useRegexStore = create<RegexStore>((set) => ({
    blocks: [],
    testText: "",
    flags: "g",
    selectedBlockId: null,

    addBlock: (block) =>
        set((state) => ({
            blocks: [...state.blocks, block],
        })),

    removeBlock: (id) =>
        set((state) => ({
            blocks: state.blocks.filter((b) => b.id !== id),
            selectedBlockId:
                state.selectedBlockId === id ? null : state.selectedBlockId,
        })),

    duplicateBlock: (id) =>
        set((state) => {
            const index = state.blocks.findIndex((b) => b.id === id);
            if (index === -1) return { blocks: state.blocks };
            const original = state.blocks[index];
            const copyId = `${original.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const next = [...state.blocks];
            next.splice(index + 1, 0, { ...original, id: copyId });
            return { blocks: next, selectedBlockId: copyId };
        }),

    updateBlock: (id, value) =>
        set((state) => ({
            blocks: state.blocks.map((b) =>
                b.id === id ? { ...b, value } : b
            ),
        })),

    updateBlockFull: (id, patch) =>
        set((state) => ({
            blocks: state.blocks.map((b) =>
                b.id === id ? { ...b, ...patch } : b
            ),
        })),

    reorderBlocks: (fromIndex, toIndex) =>
        set((state) => {
            const next = [...state.blocks];
            const [moved] = next.splice(fromIndex, 1);
            if (!moved) return { blocks: state.blocks };
            next.splice(toIndex, 0, moved);
            return { blocks: next };
        }),

    clearBlocks: () =>
        set({ blocks: [], selectedBlockId: null }),

    setTestText: (text) => set({ testText: text }),

    setFlags: (flags) => set({ flags }),

    toggleFlag: (flag) =>
        set((state) => {
            const has = state.flags.includes(flag);
            const next = has
                ? state.flags.replace(flag, "")
                : state.flags + flag;
            return { flags: next };
        }),

    selectBlock: (id) => set({ selectedBlockId: id }),
}));
