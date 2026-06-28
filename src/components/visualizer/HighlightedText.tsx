import type { TextSegment } from "../../types/match";
import { MATCH_HIGHLIGHT_COLOR } from "../../utils/colors";

interface HighlightedTextProps {
    segments: TextSegment[];
    activeMatchIndex?: number | null;
}

export default function HighlightedText({
    segments,
    activeMatchIndex = null,
}: HighlightedTextProps) {
    if (segments.length === 0) {
        return null;
    }

    return (
        <div className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-text-primary">
            {segments.map((segment, index) => {
                if (segment.type !== "match") {
                    return <span key={index}>{segment.text}</span>;
                }

                const isActive =
                    activeMatchIndex === null ||
                    activeMatchIndex === undefined ||
                    segment.matchIndex === activeMatchIndex;

                return (
                    <mark
                        key={index}
                        className="rounded px-0.5 transition-colors"
                        style={{
                            backgroundColor: isActive
                                ? MATCH_HIGHLIGHT_COLOR.bg
                                : "transparent",
                            outline: isActive
                                ? `1px solid ${MATCH_HIGHLIGHT_COLOR.border}`
                                : "none",
                            color: isActive ? "#1a1d24" : "inherit",
                        }}
                        title={`Match #${(segment.matchIndex ?? 0) + 1}`}
                    >
                        {segment.text.length === 0 ? "\u200b" : segment.text}
                    </mark>
                );
            })}
        </div>
    );
}
