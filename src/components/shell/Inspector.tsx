import { PanelRightClose, PanelRightOpen, Info } from "lucide-react";
import { useUIStore } from "../../store/uiStore";
import { useRegexStore } from "../../store/regexStore";
import { useRegexMatcher } from "../../hooks/useRegexMatcher";
import { useRegexAutomaton } from "../../hooks/useRegexAutomaton";
import { StatCard } from "../../design-system/Card";
import Badge from "../../design-system/Badge";
import Tooltip from "../../design-system/Tooltip";
import ResizeHandle from "../../design-system/ResizeHandle";
import { formatDuration } from "../../utils/textHelpers";
import { getGroupColor } from "../../utils/colors";

function InspectorSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2.5 px-3 py-3 border-b border-border-subtle last:border-b-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                {title}
            </h3>
            {children}
        </div>
    );
}

function RegexPropertiesSection() {
    const { pattern, isValid } = useRegexMatcher();
    const flags = useRegexStore((s) => s.flags);

    return (
        <InspectorSection title="Regex properties">
            <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                    <span className="text-text-tertiary">Status</span>
                    <Badge variant={isValid ? "success" : "danger"} dot>
                        {isValid ? "Valid" : "Invalid"}
                    </Badge>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-text-tertiary">Length</span>
                    <span className="font-mono-tabular text-text-primary">
                        {pattern.length} chars
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-text-tertiary">Flags</span>
                    <span className="font-mono-tabular text-text-primary">
                        {flags || "—"}
                    </span>
                </div>
            </div>
        </InspectorSection>
    );
}

function MatchStatisticsSection() {
    const { stats, matches } = useRegexMatcher();

    return (
        <InspectorSection title="Match statistics">
            <div className="grid grid-cols-2 gap-2">
                <StatCard label="Matches" value={stats.totalMatches} />
                <StatCard
                    label="Groups"
                    value={stats.totalCaptureGroups}
                />
                <StatCard
                    label="Exec time"
                    value={formatDuration(stats.executionTimeMs)}
                />
                <StatCard label="Input" value={`${stats.textLength}c`} />
            </div>
            {matches.length > 0 && matches[0].groups.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[11px] text-text-tertiary">
                        Capture groups (first match)
                    </span>
                    {matches[0].groups.map((g) => {
                        const color = getGroupColor(g.groupIndex);
                        return (
                            <div
                                key={g.groupIndex}
                                className="flex items-center gap-2 text-[11px]"
                            >
                                <span
                                    className="w-2 h-2 rounded-sm shrink-0"
                                    style={{ backgroundColor: color.bg }}
                                />
                                <span className="font-mono-tabular text-text-tertiary">
                                    {g.name ? `<${g.name}>` : `#${g.groupIndex}`}
                                </span>
                                <span className="font-mono-tabular text-text-secondary truncate">
                                    {g.value ?? "—"}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </InspectorSection>
    );
}

function AutomataMetricsSection() {
    const { comparison } = useRegexAutomaton();

    if (!comparison) {
        return (
            <InspectorSection title="Automata metrics">
                <p className="text-[11px] text-text-tertiary">
                    Build a valid pattern to see NFA/DFA metrics.
                </p>
            </InspectorSection>
        );
    }

    return (
        <InspectorSection title="Automata metrics">
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-text-tertiary uppercase">
                        NFA
                    </span>
                    <span className="text-sm font-mono-tabular font-semibold text-text-primary">
                        {comparison.nfa.stateCount}
                    </span>
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-text-tertiary uppercase">
                        DFA
                    </span>
                    <span className="text-sm font-mono-tabular font-semibold text-text-primary">
                        {comparison.dfa.stateCount}
                    </span>
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-text-tertiary uppercase">
                        Min DFA
                    </span>
                    <span className="text-sm font-mono-tabular font-semibold text-success-400">
                        {comparison.minimizedDfa.stateCount}
                    </span>
                </div>
            </div>
            <div className="flex flex-col gap-1.5 text-xs mt-1">
                <div className="flex items-center justify-between">
                    <span className="text-text-tertiary">
                        Minimization reduction
                    </span>
                    <span className="font-mono-tabular text-success-400">
                        {comparison.minimizationReductionPercent.toFixed(1)}%
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-text-tertiary">
                        NFA→DFA expansion
                    </span>
                    <span className="font-mono-tabular text-text-primary">
                        {comparison.nfaToDfaExpansionRatio.toFixed(2)}x
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-text-tertiary">Total pipeline</span>
                    <span className="font-mono-tabular text-text-primary">
                        {formatDuration(comparison.timing.totalMs)}
                    </span>
                </div>
            </div>
        </InspectorSection>
    );
}

function BlockCountSection() {
    const blocks = useRegexStore((s) => s.blocks);
    const selectedBlockId = useRegexStore((s) => s.selectedBlockId);
    const selected = blocks.find((b) => b.id === selectedBlockId);

    return (
        <InspectorSection title="Builder state">
            <div className="flex items-center justify-between text-xs">
                <span className="text-text-tertiary">Total blocks</span>
                <span className="font-mono-tabular text-text-primary">
                    {blocks.length}
                </span>
            </div>
            {selected && (
                <div className="flex items-center justify-between text-xs">
                    <span className="text-text-tertiary">Selected</span>
                    <Badge variant="accent">{selected.type}</Badge>
                </div>
            )}
        </InspectorSection>
    );
}

export default function Inspector() {
    const inspectorWidth = useUIStore((s) => s.inspectorWidth);
    const setInspectorWidth = useUIStore((s) => s.setInspectorWidth);
    const inspectorCollapsed = useUIStore((s) => s.inspectorCollapsed);
    const toggleInspector = useUIStore((s) => s.toggleInspector);
    const activeWorkspaceTab = useUIStore((s) => s.activeWorkspaceTab);

    if (inspectorCollapsed) {
        return (
            <div className="w-10 shrink-0 flex flex-col items-center py-2 bg-surface border-l border-border-subtle">
                <Tooltip label="Expand inspector" side="left">
                    <button
                        type="button"
                        onClick={toggleInspector}
                        aria-label="Expand inspector"
                        className="flex items-center justify-center w-7 h-7 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                    >
                        <PanelRightOpen className="w-4 h-4" />
                    </button>
                </Tooltip>
            </div>
        );
    }

    return (
        <div
            style={{ width: inspectorWidth }}
            className="shrink-0 flex bg-surface border-l border-border-subtle"
        >
            <ResizeHandle
                direction="horizontal"
                edge="left"
                onResize={(delta) => setInspectorWidth(inspectorWidth - delta)}
            />
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <div className="flex items-center justify-between px-3 h-9 shrink-0 border-b border-border-subtle">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                        <Info className="w-3.5 h-3.5" />
                        Inspector
                    </span>
                    <Tooltip label="Collapse inspector" side="left">
                        <button
                            type="button"
                            onClick={toggleInspector}
                            aria-label="Collapse inspector"
                            className="flex items-center justify-center w-6 h-6 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
                        >
                            <PanelRightClose className="w-3.5 h-3.5" />
                        </button>
                    </Tooltip>
                </div>

                {activeWorkspaceTab === "builder" && <BlockCountSection />}
                {activeWorkspaceTab === "regex" && (
                    <>
                        <RegexPropertiesSection />
                        <MatchStatisticsSection />
                    </>
                )}
                {activeWorkspaceTab === "ast" && <RegexPropertiesSection />}
                {(activeWorkspaceTab === "nfa" ||
                    activeWorkspaceTab === "dfa") && (
                    <>
                        <RegexPropertiesSection />
                        <AutomataMetricsSection />
                    </>
                )}
                {activeWorkspaceTab === "benchmark" && (
                    <InspectorSection title="Benchmark summary">
                        <p className="text-[11px] text-text-tertiary">
                            Run the benchmark suite to see a summary here.
                            Full results are shown in the main workspace.
                        </p>
                    </InspectorSection>
                )}
            </div>
        </div>
    );
}
