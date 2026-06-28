import { create } from "zustand";

export type LogLevel = "info" | "warning" | "error" | "success";

export interface LogEntry {
    id: string;
    level: LogLevel;
    message: string;
    detail?: string;
    timestamp: number;
}

interface ConsoleLogStore {
    entries: LogEntry[];
    log: (level: LogLevel, message: string, detail?: string) => void;
    clear: () => void;
}

const MAX_ENTRIES = 200;

export const useConsoleLogStore = create<ConsoleLogStore>((set) => ({
    entries: [],

    log: (level, message, detail) =>
        set((state) => {
            const last = state.entries[state.entries.length - 1];
            // Avoid flooding the console with an identical repeated entry
            // (e.g. the same validation error firing on every keystroke).
            if (last && last.level === level && last.message === message) {
                return { entries: state.entries };
            }
            const entry: LogEntry = {
                id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                level,
                message,
                detail,
                timestamp: Date.now(),
            };
            const next = [...state.entries, entry];
            return {
                entries:
                    next.length > MAX_ENTRIES
                        ? next.slice(next.length - MAX_ENTRIES)
                        : next,
            };
        }),

    clear: () => set({ entries: [] }),
}));
