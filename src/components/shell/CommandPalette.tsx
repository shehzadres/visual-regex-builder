import { useEffect, useMemo, useRef, useState } from "react";
import {
    Search,
    Boxes,
    Regex,
    TreeDeciduous,
    Settings2,
    GitBranch,
    BarChart3,
    Moon,
    PanelLeftClose,
    PanelRightClose,
    Trash2,
} from "lucide-react";
import { useUIStore, type WorkspaceTab } from "../../store/uiStore";
import { useRegexStore } from "../../store/regexStore";

interface CommandEntry {
    id: string;
    label: string;
    group: string;
    icon: React.ReactNode;
    onRun: () => void;
}

export default function CommandPalette() {
    const open = useUIStore((s) => s.commandPaletteOpen);
    const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
    const setActiveWorkspaceTab = useUIStore((s) => s.setActiveWorkspaceTab);
    const toggleTheme = useUIStore((s) => s.toggleTheme);
    const toggleSidebar = useUIStore((s) => s.toggleSidebar);
    const toggleInspector = useUIStore((s) => s.toggleInspector);
    const clearBlocks = useRegexStore((s) => s.clearBlocks);

    const [query, setQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const goToTab = (tab: WorkspaceTab) => () => {
        setActiveWorkspaceTab(tab);
        setOpen(false);
    };

    const commands: CommandEntry[] = useMemo(
        () => [
            {
                id: "go-builder",
                label: "Go to Builder",
                group: "Navigate",
                icon: <Boxes className="w-3.5 h-3.5" />,
                onRun: goToTab("builder"),
            },
            {
                id: "go-regex",
                label: "Go to Regex",
                group: "Navigate",
                icon: <Regex className="w-3.5 h-3.5" />,
                onRun: goToTab("regex"),
            },
            {
                id: "go-ast",
                label: "Go to AST",
                group: "Navigate",
                icon: <TreeDeciduous className="w-3.5 h-3.5" />,
                onRun: goToTab("ast"),
            },
            {
                id: "go-nfa",
                label: "Go to NFA",
                group: "Navigate",
                icon: <Settings2 className="w-3.5 h-3.5" />,
                onRun: goToTab("nfa"),
            },
            {
                id: "go-dfa",
                label: "Go to DFA",
                group: "Navigate",
                icon: <GitBranch className="w-3.5 h-3.5" />,
                onRun: goToTab("dfa"),
            },
            {
                id: "go-benchmark",
                label: "Go to Benchmark",
                group: "Navigate",
                icon: <BarChart3 className="w-3.5 h-3.5" />,
                onRun: goToTab("benchmark"),
            },
            {
                id: "toggle-theme",
                label: "Toggle theme",
                group: "View",
                icon: <Moon className="w-3.5 h-3.5" />,
                onRun: () => {
                    toggleTheme();
                    setOpen(false);
                },
            },
            {
                id: "toggle-sidebar",
                label: "Toggle sidebar",
                group: "View",
                icon: <PanelLeftClose className="w-3.5 h-3.5" />,
                onRun: () => {
                    toggleSidebar();
                    setOpen(false);
                },
            },
            {
                id: "toggle-inspector",
                label: "Toggle inspector",
                group: "View",
                icon: <PanelRightClose className="w-3.5 h-3.5" />,
                onRun: () => {
                    toggleInspector();
                    setOpen(false);
                },
            },
            {
                id: "clear-canvas",
                label: "Clear builder canvas",
                group: "Actions",
                icon: <Trash2 className="w-3.5 h-3.5" />,
                onRun: () => {
                    clearBlocks();
                    setOpen(false);
                },
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const filtered = useMemo(() => {
        if (query.trim() === "") return commands;
        const q = query.toLowerCase();
        return commands.filter((c) => c.label.toLowerCase().includes(q));
    }, [commands, query]);

    useEffect(() => {
        setHighlightedIndex(0);
    }, [query]);

    useEffect(() => {
        function handleGlobalKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen(true);
            }
        }
        document.addEventListener("keydown", handleGlobalKey);
        return () => document.removeEventListener("keydown", handleGlobalKey);
    }, [setOpen]);

    useEffect(() => {
        if (open) {
            setQuery("");
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [open]);

    if (!open) return null;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setOpen(false);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((i) => Math.min(filtered.length - 1, i + 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((i) => Math.max(0, i - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            filtered[highlightedIndex]?.onRun();
        }
    };

    let lastGroup = "";

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
            <div
                className="absolute inset-0 bg-black/60 animate-[panel-fade-in_var(--duration-base)_var(--ease-out)]"
                onClick={() => setOpen(false)}
            />
            <div className="relative w-full max-w-lg rounded-xl bg-surface-overlay border border-border-default shadow-lg animate-[panel-fade-in_var(--duration-base)_var(--ease-out)] overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 h-12 border-b border-border-subtle">
                    <Search className="w-4 h-4 text-text-tertiary shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search patterns, actions…"
                        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
                    />
                    <span className="kbd">esc</span>
                </div>
                <div className="max-h-80 overflow-y-auto py-1.5">
                    {filtered.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-text-tertiary">
                            No matching commands.
                        </p>
                    ) : (
                        filtered.map((command, index) => {
                            const showGroupHeader = command.group !== lastGroup;
                            lastGroup = command.group;
                            return (
                                <div key={command.id}>
                                    {showGroupHeader && (
                                        <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-disabled">
                                            {command.group}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={command.onRun}
                                        onMouseEnter={() =>
                                            setHighlightedIndex(index)
                                        }
                                        className={[
                                            "w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors duration-[var(--duration-fast)]",
                                            index === highlightedIndex
                                                ? "bg-accent-500/15 text-text-primary"
                                                : "text-text-secondary hover:bg-surface-hover",
                                        ].join(" ")}
                                    >
                                        <span className="text-text-tertiary">
                                            {command.icon}
                                        </span>
                                        {command.label}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
