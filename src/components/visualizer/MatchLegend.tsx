import { getGroupColor, MATCH_HIGHLIGHT_COLOR } from "../../utils/colors";

interface MatchLegendProps {
    groupCount: number;
}

export default function MatchLegend({ groupCount }: MatchLegendProps) {
    const groupIndices = Array.from({ length: groupCount }, (_, i) => i + 1);

    return (
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
            <LegendSwatch color={MATCH_HIGHLIGHT_COLOR.bg} label="Full match" />
            {groupIndices.map((groupIndex) => (
                <LegendSwatch
                    key={groupIndex}
                    color={getGroupColor(groupIndex).bg}
                    label={`Group ${groupIndex}`}
                />
            ))}
        </div>
    );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
    return (
        <span className="flex items-center gap-1.5">
            <span
                className="w-3 h-3 rounded-sm border border-black/20 inline-block"
                style={{ backgroundColor: color }}
            />
            {label}
        </span>
    );
}
