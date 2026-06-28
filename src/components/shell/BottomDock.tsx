import { useMemo } from "react";
import {
    Terminal,
    ScrollText,
    AlertCircle,
    Gauge,
    ChevronDown,
    ChevronUp,
    Trash2,
} from "lucide-react";
import { useUIStore, type DockTab } from "../../store/uiStore";
import { useConsoleLogStore } from "../../store/consoleLogStore";
import { useRegexAutomaton } from "../../hooks/useRegexAutomaton";
import Tabs from "../../design-system/Tabs";
import Button from "../../design-system/Button";
import ResizeHandle from "../../design-system/ResizeHandle";
import EmptyState from "../../design-system/EmptyState";
import { formatDuration } from "../../utils/textHelpers";

const LEVEL_COLORS: Record<string, string> = {
    info: "text-info-400",
    warning: "text-warning-400",
    error: "text-danger-400",
    success: "text-success-400",
};

function formatTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString(undefined, {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function ConsoleView() {
    const entries = useConsoleLogStore((s) => s.entries);

    if (entries.length === 0) {
        return (
            <EmptyState
                icon={<Terminal className="w-5 h-5" />}
                title="Console is empty"
                description="Pipeline activity (compiles, errors) will appear here as you build."
                compact
            />
        );
    }

    return (
        <div className="flex flex-col gap-0.5 font-mono-tabular text-[12px] px-3 py-2">
            {entries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2 py-0.5">
                    <span className="text-text-disabled shrink-0">
                        {formatTime(entry.timestamp)}
                    </span>
                    <span
                        className={`shrink-0 uppercase font-semibold ${LEVEL_COLORS[entry.level]}`}
                    >
                        {entry.level}
                    </span>
                    <span className="text-text-primary">{entry.message}</span>
                    {entry.detail && (
                        <span className="text-text-tertiary truncate">
                            {entry.detail}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

function ErrorsView() {
    const entries = useConsoleLogStore((s) => s.entries);
    const errorEntries = useMemo(
        () => entries.filter((e) => e.level === "error"),
        [entries]
    );

    if (errorEntries.length === 0) {
        return (
            <EmptyState
                icon={<AlertCircle className="w-5 h-5" />}
                title="No errors"
                description="Regex compile errors will be listed here."
                compact
            />
        );
    }

    return (
        <div className="flex flex-col gap-1 px-3 py-2">
            {errorEntries.map((entry) => (
                <div
                    key={entry.id}
                    className="rounded-md border border-danger-600/30 bg-danger-bg px-2.5 py-1.5 text-xs text-danger-300"
                >
                    <div className="font-mono-tabular font-medium">
                        {entry.message}
                    </div>
                    {entry.detail && (
                        <div className="text-danger-400/80 mt-0.5">
                            {entry.detail}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function PerformanceView() {
    const { comparison } = useRegexAutomaton();

    if (!comparison) {
        return (
            <EmptyState
                icon={<Gauge className="w-5 h-5" />}
                title="No performance data"
                description="Build a valid pattern to see pipeline construction timing."
                compact
            />
        );
    }

    const rows = [
        { label: "NFA construction (Thompson's)", ms: comparison.timing.nfaConstructionMs },
        { label: "DFA construction (subset)", ms: comparison.timing.dfaConstructionMs },
        { label: "Minimization (Hopcroft's)", ms: comparison.timing.minimizationMs },
        { label: "Total pipeline", ms: comparison.timing.totalMs },
    ];

    const maxMs = Math.max(...rows.map((r) => r.ms), 0.001);

    return (
        <div className="flex flex-col gap-2 px-3 py-2.5">
            {rows.map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary w-48 shrink-0">
                        {row.label}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-surface-raised overflow-hidden">
                        <div
                            className="h-full bg-accent-500 rounded-full transition-all duration-[var(--duration-base)]"
                            style={{
                                width: `${Math.max(2, (row.ms / maxMs) * 100)}%`,
                            }}
                        />
                    </div>
                    <span className="text-xs font-mono-tabular text-text-primary w-16 text-right">
                        {formatDuration(row.ms)}
                    </span>
                </div>
            ))}
        </div>
    );
}

const DOCK_TABS: Array<{ value: DockTab; label: string; icon: React.ReactNode }> = [
    { value: "console", label: "Console", icon: <Terminal className="w-3.5 h-3.5" /> },
    { value: "logs", label: "Logs", icon: <ScrollText className="w-3.5 h-3.5" /> },
    { value: "errors", label: "Errors", icon: <AlertCircle className="w-3.5 h-3.5" /> },
    { value: "performance", label: "Performance", icon: <Gauge className="w-3.5 h-3.5" /> },
];

export default function BottomDock() {
    const dockOpen = useUIStore((s) => s.dockOpen);
    const toggleDock = useUIStore((s) => s.toggleDock);
    const dockHeight = useUIStore((s) => s.dockHeight);
    const setDockHeight = useUIStore((s) => s.setDockHeight);
    const activeDockTab = useUIStore((s) => s.activeDockTab);
    const setActiveDockTab = useUIStore((s) => s.setActiveDockTab);
    const clearLogs = useConsoleLogStore((s) => s.clear);
    const allEntries = useConsoleLogStore((s) => s.entries);
    const errorCount = useMemo(
        () => allEntries.filter((e) => e.level === "error").length,
        [allEntries]
    );

    return (
        <div
            className="shrink-0 flex flex-col bg-surface border-t border-border-subtle"
            style={{ height: dockOpen ? dockHeight : 32 }}
        >
            {dockOpen && (
                <ResizeHandle
                    direction="vertical"
                    edge="top"
                    onResize={(delta) => setDockHeight(dockHeight - delta)}
                />
            )}

            <div className="flex items-center justify-between h-8 px-2 shrink-0">
                <Tabs
                    size="sm"
                    value={activeDockTab}
                    onChange={setActiveDockTab}
                    items={DOCK_TABS.map((t) => ({
                        ...t,
                        badge:
                            t.value === "errors" && errorCount > 0 ? (
                                <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-danger-500 text-[10px] font-semibold text-white">
                                    {errorCount}
                                </span>
                            ) : undefined,
                    }))}
                />
                <div className="flex items-center gap-1">
                    {dockOpen && activeDockTab === "console" && (
                        <Button
                            variant="ghost"
                            size="xs"
                            iconOnly
                            aria-label="Clear console"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={clearLogs}
                        />
                    )}
                    <Button
                        variant="ghost"
                        size="xs"
                        iconOnly
                        aria-label={dockOpen ? "Collapse dock" : "Expand dock"}
                        icon={
                            dockOpen ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                                <ChevronUp className="w-3.5 h-3.5" />
                            )
                        }
                        onClick={toggleDock}
                    />
                </div>
            </div>

            {dockOpen && (
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {activeDockTab === "console" && <ConsoleView />}
                    {activeDockTab === "logs" && <ConsoleView />}
                    {activeDockTab === "errors" && <ErrorsView />}
                    {activeDockTab === "performance" && <PerformanceView />}
                </div>
            )}
        </div>
    );
}
