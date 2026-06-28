import { useState } from "react";
import { Play, Gauge, BarChart3 } from "lucide-react";
import {
    createDefaultBenchmarkConfig,
    runBenchmarkSuite,
} from "../../engine/benchmark/benchmarkRunner";
import type { BenchmarkSummary } from "../../engine/benchmark/benchmarkTypes";
import { useRegexAutomaton } from "../../hooks/useRegexAutomaton";
import BenchmarkTable from "./BenchmarkTable";
import BenchmarkChart from "./BenchmarkChart";
import BacktrackWarningBanner from "./BacktrackWarning";
import Button from "../../design-system/Button";
import EmptyState from "../../design-system/EmptyState";
import { StatCard } from "../../design-system/Card";
import { formatDuration } from "../../utils/textHelpers";

export default function BenchmarkPanel() {
    const { pattern, isValid } = useRegexAutomaton();
    const [summaries, setSummaries] = useState<BenchmarkSummary[] | null>(
        null
    );
    const [isRunning, setIsRunning] = useState(false);
    const [includeCurrentPattern, setIncludeCurrentPattern] = useState(true);

    const handleRun = () => {
        setIsRunning(true);

        const extraPatterns =
            includeCurrentPattern && isValid && pattern !== ""
                ? [
                      {
                          id: "current-pattern",
                          label: "Current builder pattern",
                          pattern,
                      },
                  ]
                : [];

        // Synchronous by design (see benchmarkRunner.ts) — the suite is
        // engineered to complete in well under a second even including
        // structurally risky patterns, so a setTimeout(0) here just lets
        // the "Running..." label paint before the (fast) suite executes.
        window.setTimeout(() => {
            const config = createDefaultBenchmarkConfig(extraPatterns);
            const results = runBenchmarkSuite(config);
            setSummaries(results);
            setIsRunning(false);
        }, 0);
    };

    const riskyCount =
        summaries?.filter((s) => s.warning.riskLevel === "high").length ?? 0;

    const allCompletedRuns =
        summaries?.flatMap((s) =>
            s.runs.filter((r) => !r.timedOut && !r.error)
        ) ?? [];
    const slowestRun = allCompletedRuns.length
        ? allCompletedRuns.reduce((a, b) =>
              a.executionTimeMs > b.executionTimeMs ? a : b
          )
        : null;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="primary"
                        size="md"
                        onClick={handleRun}
                        disabled={isRunning}
                        icon={<Play className="w-3.5 h-3.5" />}
                    >
                        {isRunning ? "Running…" : "Run benchmark suite"}
                    </Button>
                    <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <input
                            type="checkbox"
                            checked={includeCurrentPattern}
                            onChange={(e) =>
                                setIncludeCurrentPattern(e.target.checked)
                            }
                            className="rounded border-border-strong bg-surface-raised accent-accent-500"
                        />
                        Include current builder pattern
                    </label>
                </div>
            </div>

            <p className="text-xs text-text-tertiary leading-relaxed max-w-2xl">
                Runs a fixed set of common patterns (word, digit, email,
                date, alternation) plus two intentionally risky patterns
                against generated datasets of increasing size, timing each
                with{" "}
                <code className="font-mono-tabular text-text-secondary">
                    performance.now()
                </code>
                . Patterns flagged as structurally risky are automatically
                tested against a short adversarial input instead of the
                full-size dataset, since their execution time can grow
                exponentially.
            </p>

            {summaries === null ? (
                <EmptyState
                    icon={<BarChart3 className="w-5 h-5" />}
                    title="No benchmark run yet"
                    description="Click “Run benchmark suite” to measure execution time across pattern types and dataset sizes."
                />
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <StatCard
                            label="Patterns tested"
                            value={summaries.length}
                        />
                        <StatCard
                            label="High risk"
                            value={riskyCount}
                            accent={riskyCount > 0 ? "danger" : "success"}
                        />
                        <StatCard
                            label="Slowest run"
                            value={
                                slowestRun
                                    ? formatDuration(
                                          slowestRun.executionTimeMs
                                      )
                                    : "—"
                            }
                            sublabel={slowestRun?.patternLabel}
                        />
                        <StatCard
                            label="Total runs"
                            value={allCompletedRuns.length}
                            accent="accent"
                        />
                    </div>

                    {summaries
                        .filter((s) => s.warning.riskLevel !== "none")
                        .map((s) => (
                            <BacktrackWarningBanner
                                key={s.patternId}
                                warning={s.warning}
                            />
                        ))}

                    <div className="flex items-center gap-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                        <Gauge className="w-3.5 h-3.5" />
                        Execution time vs. dataset size
                    </div>
                    <BenchmarkChart summaries={summaries} />
                    <BenchmarkTable summaries={summaries} />
                </div>
            )}
        </div>
    );
}
