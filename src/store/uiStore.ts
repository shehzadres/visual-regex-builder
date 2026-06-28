import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WorkspaceTab =
    | "builder"
    | "regex"
    | "ast"
    | "nfa"
    | "dfa"
    | "benchmark";

export type DockTab = "console" | "logs" | "errors" | "performance";

interface UIStore {
    theme: "dark" | "light";
    toggleTheme: () => void;

    sidebarWidth: number;
    setSidebarWidth: (width: number) => void;
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;

    inspectorWidth: number;
    setInspectorWidth: (width: number) => void;
    inspectorCollapsed: boolean;
    toggleInspector: () => void;

    dockHeight: number;
    setDockHeight: (height: number) => void;
    dockOpen: boolean;
    toggleDock: () => void;
    activeDockTab: DockTab;
    setActiveDockTab: (tab: DockTab) => void;

    activeWorkspaceTab: WorkspaceTab;
    setActiveWorkspaceTab: (tab: WorkspaceTab) => void;

    commandPaletteOpen: boolean;
    setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>()(
    persist(
        (set) => ({
            theme: "dark",
            toggleTheme: () =>
                set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),

            sidebarWidth: 280,
            setSidebarWidth: (width) =>
                set({ sidebarWidth: Math.min(420, Math.max(220, width)) }),
            sidebarCollapsed: false,
            toggleSidebar: () =>
                set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

            inspectorWidth: 300,
            setInspectorWidth: (width) =>
                set({ inspectorWidth: Math.min(440, Math.max(240, width)) }),
            inspectorCollapsed: false,
            toggleInspector: () =>
                set((s) => ({ inspectorCollapsed: !s.inspectorCollapsed })),

            dockHeight: 220,
            setDockHeight: (height) =>
                set({ dockHeight: Math.min(520, Math.max(120, height)) }),
            dockOpen: true,
            toggleDock: () => set((s) => ({ dockOpen: !s.dockOpen })),
            activeDockTab: "console",
            setActiveDockTab: (tab) => set({ activeDockTab: tab }),

            activeWorkspaceTab: "builder",
            setActiveWorkspaceTab: (tab) => set({ activeWorkspaceTab: tab }),

            commandPaletteOpen: false,
            setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
        }),
        {
            name: "visual-regex-builder-ui-layout",
            partialize: (state) => ({
                theme: state.theme,
                sidebarWidth: state.sidebarWidth,
                sidebarCollapsed: state.sidebarCollapsed,
                inspectorWidth: state.inspectorWidth,
                inspectorCollapsed: state.inspectorCollapsed,
                dockHeight: state.dockHeight,
                dockOpen: state.dockOpen,
                activeWorkspaceTab: state.activeWorkspaceTab,
            }),
        }
    )
);
