import { SearchX, CircleSlash } from "lucide-react";
import type { MatchResult } from "../../types/match";
import { getGroupColor } from "../../utils/colors";
import { describeWhitespace, truncate } from "../../utils/textHelpers";
import EmptyState from "../../design-system/EmptyState";

interface CaptureGroupsProps {
    matches: MatchResult[];
    activeMatchIndex: number | null;
}

export default function CaptureGroups({
    matches,
    activeMatchIndex,
}: CaptureGroupsProps) {
    const visibleMatches =
        activeMatchIndex === null
            ? matches
            : matches.filter((m) => m.matchIndex === activeMatchIndex);

    const hasAnyGroups = visibleMatches.some((m) => m.groups.length > 0);

    if (visibleMatches.length === 0) {
        return (
            <EmptyState
                icon={<SearchX className="w-5 h-5" />}
                title="No matches to inspect"
                description="Build a pattern and enter test text to see capture groups here."
                compact
            />
        );
    }

    if (!hasAnyGroups) {
        return (
            <EmptyState
                icon={<CircleSlash className="w-5 h-5" />}
                title="No capture groups"
                description="Add a Group block to your pattern to capture sub-matches."
                compact
            />
        );
    }

    return (
        <div className="flex flex-col gap-2.5">
            {visibleMatches.map((match) => (
                <div
                    key={match.matchIndex}
                    className="rounded-md border border-border-subtle bg-surface-raised p-3"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-text-secondary">
                            Match #{match.matchIndex + 1}
                        </span>
                        <span className="text-xs font-mono-tabular text-text-tertiary">
                            [{match.start}, {match.end})
                        </span>
                    </div>

                    {match.groups.length === 0 ? (
                        <p className="text-xs text-text-tertiary">
                            No capture groups in this match.
                        </p>
                    ) : (
                        <ul className="flex flex-col gap-1.5">
                            {match.groups.map((group) => {
                                const color = getGroupColor(group.groupIndex);
                                const participated = group.value !== undefined;

                                return (
                                    <li
                                        key={group.groupIndex}
                                        className="flex items-center gap-2 text-xs"
                                    >
                                        <span
                                            className="w-2.5 h-2.5 rounded-sm shrink-0 border border-black/20"
                                            style={{
                                                backgroundColor: color.bg,
                                            }}
                                        />
                                        <span className="font-mono-tabular text-text-tertiary shrink-0">
                                            {group.name
                                                ? `<${group.name}>`
                                                : `Group ${group.groupIndex}`}
                                        </span>
                                        <span
                                            className={`font-mono-tabular px-1.5 py-0.5 rounded truncate ${
                                                participated
                                                    ? ""
                                                    : "text-text-disabled italic"
                                            }`}
                                            style={{
                                                backgroundColor: participated
                                                    ? color.bg
                                                    : "transparent",
                                                color: participated
                                                    ? "#1a1d24"
                                                    : undefined,
                                            }}
                                        >
                                            {participated
                                                ? truncate(
                                                      describeWhitespace(
                                                          group.value ?? ""
                                                      )
                                                  )
                                                : "did not participate"}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    );
}
