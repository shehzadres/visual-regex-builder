import type { BenchmarkSummary } from "../../engine/benchmark/benchmarkTypes";
import { formatDuration } from "../../utils/textHelpers";
import Badge from "../../design-system/Badge";

interface BenchmarkTableProps {
    summaries: BenchmarkSummary[];
}

type RiskLevel = "none" | "low" | "high";

const RISK_BADGE_VARIANT: Record<
    RiskLevel,
    "success" | "warning" | "danger"
> = {
    none: "success",
    low: "warning",
    high: "danger",
};

export default function BenchmarkTable({ summaries }: BenchmarkTableProps) {
    const sizeLabels = Array.from(
        new Set(summaries.flatMap((s) => s.runs.map((r) => r.sizeLabel)))
    );

    return (
        <div className="overflow-x-auto rounded-lg border border-border-subtle">
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="text-left text-text-tertiary bg-surface-raised border-b border-border-default">
                        <th className="py-2 px-3 font-semibold">Pattern</th>
                        <th className="py-2 px-3 font-semibold">Risk</th>
                        {sizeLabels.map((label) => (
                            <th
                                key={label}
                                className="py-2 px-3 font-semibold capitalize"
                            >
                                {label}
                            </th>
                        ))}
                        <th className="py-2 px-3 font-semibold">
                            Growth (ms/char)
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {summaries.map((summary) => (
                        <tr
                            key={summary.patternId}
                            className="border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors"
                        >
                            <td className="py-2 px-3">
                                <div className="font-medium text-text-primary">
                                    {summary.patternLabel}
                                </div>
                                <div className="font-mono-tabular text-text-tertiary">
                                    /{summary.pattern}/
                                </div>
                            </td>
                            <td className="py-2 px-3">
                                <Badge
                                    variant={
                                        RISK_BADGE_VARIANT[
                                            summary.warning.riskLevel
                                        ]
                                    }
                                    dot
                                >
                                    {summary.warning.riskLevel}
                                </Badge>
                            </td>
                            {sizeLabels.map((label) => {
                                const run = summary.runs.find(
                                    (r) => r.sizeLabel === label
                                );
                                if (!run) {
                                    return (
                                        <td
                                            key={label}
                                            className="py-2 px-3 text-text-disabled"
                                        >
                                            —
                                        </td>
                                    );
                                }
                                return (
                                    <td
                                        key={label}
                                        className={`py-2 px-3 font-mono-tabular ${
                                            run.timedOut
                                                ? "text-danger-400"
                                                : "text-text-secondary"
                                        }`}
                                    >
                                        {run.timedOut
                                            ? "timeout"
                                            : run.error
                                              ? "error"
                                              : formatDuration(
                                                    run.executionTimeMs
                                                )}
                                    </td>
                                );
                            })}
                            <td className="py-2 px-3 font-mono-tabular text-text-secondary">
                                {summary.growthSlopeMsPerChar.toFixed(5)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
