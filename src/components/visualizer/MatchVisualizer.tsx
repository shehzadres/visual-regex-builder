import { useState } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { useRegexMatcher } from "../../hooks/useRegexMatcher";
import HighlightedText from "./HighlightedText";
import MatchControls from "./MatchControls";
import MatchLegend from "./MatchLegend";
import CaptureGroups from "./CaptureGroups";
import EmptyState from "../../design-system/EmptyState";
import Card from "../../design-system/Card";

export default function MatchVisualizer() {
    const { segments, matches, stats, isValid, error, pattern } =
        useRegexMatcher();
    const [activeMatchIndex, setActiveMatchIndex] = useState<number | null>(
        null
    );

    const maxGroupCount = matches.reduce(
        (max, m) => Math.max(max, m.groups.length),
        0
    );

    if (!isValid) {
        return (
            <EmptyState
                icon={<AlertTriangle className="w-5 h-5" />}
                title="Invalid pattern"
                description={
                    error ?? "The current pattern could not be compiled."
                }
            />
        );
    }

    if (pattern === "") {
        return (
            <EmptyState
                icon={<Sparkles className="w-5 h-5" />}
                title="Nothing to match yet"
                description="Add blocks in the Builder to generate a pattern."
            />
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <MatchControls
                totalMatches={matches.length}
                activeMatchIndex={activeMatchIndex}
                onSelectMatch={setActiveMatchIndex}
                stats={stats}
            />

            <Card className="bg-surface">
                <HighlightedText
                    segments={segments}
                    activeMatchIndex={activeMatchIndex}
                />
            </Card>

            {maxGroupCount > 0 && <MatchLegend groupCount={maxGroupCount} />}

            <CaptureGroups
                matches={matches}
                activeMatchIndex={activeMatchIndex}
            />
        </div>
    );
}
