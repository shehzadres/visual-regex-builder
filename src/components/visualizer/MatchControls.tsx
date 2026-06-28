import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MatchStats } from "../../types/match";
import { formatDuration } from "../../utils/textHelpers";
import Button from "../../design-system/Button";
import { StatCard } from "../../design-system/Card";

interface MatchControlsProps {
    totalMatches: number;
    activeMatchIndex: number | null;
    onSelectMatch: (index: number | null) => void;
    stats: MatchStats;
}

export default function MatchControls({
    totalMatches,
    activeMatchIndex,
    onSelectMatch,
    stats,
}: MatchControlsProps) {
    const hasMatches = totalMatches > 0;

    const goTo = (delta: number) => {
        if (!hasMatches) return;
        const current = activeMatchIndex ?? 0;
        const next = (current + delta + totalMatches) % totalMatches;
        onSelectMatch(next);
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <Button
                        variant="ghost"
                        size="xs"
                        iconOnly
                        disabled={!hasMatches}
                        onClick={() => goTo(-1)}
                        aria-label="Previous match"
                        icon={<ChevronLeft className="w-3.5 h-3.5" />}
                    />
                    <span className="text-xs font-mono-tabular text-text-secondary min-w-[6.5rem] text-center">
                        {hasMatches
                            ? `Match ${(activeMatchIndex ?? 0) + 1} of ${totalMatches}`
                            : "No matches"}
                    </span>
                    <Button
                        variant="ghost"
                        size="xs"
                        iconOnly
                        disabled={!hasMatches}
                        onClick={() => goTo(1)}
                        aria-label="Next match"
                        icon={<ChevronRight className="w-3.5 h-3.5" />}
                    />
                </div>
                {activeMatchIndex !== null && (
                    <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onSelectMatch(null)}
                    >
                        Show all
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatCard label="Matches" value={stats.totalMatches} />
                <StatCard
                    label="Capture groups"
                    value={stats.totalCaptureGroups}
                />
                <StatCard
                    label="Exec time"
                    value={formatDuration(stats.executionTimeMs)}
                />
                <StatCard
                    label="Text length"
                    value={`${stats.textLength}`}
                    sublabel="chars"
                />
            </div>
        </div>
    );
}
