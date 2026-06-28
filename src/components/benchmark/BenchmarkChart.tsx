import type { BenchmarkSummary } from "../../engine/benchmark/benchmarkTypes";
import { getGroupColor } from "../../utils/colors";

interface BenchmarkChartProps {
    summaries: BenchmarkSummary[];
}

const WIDTH = 640;
const HEIGHT = 280;
const PADDING_LEFT = 56;
const PADDING_BOTTOM = 36;
const PADDING_TOP = 16;
const PADDING_RIGHT = 16;

export default function BenchmarkChart({ summaries }: BenchmarkChartProps) {
    const plotWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT;
    const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    const allRuns = summaries.flatMap((s) =>
        s.runs.filter((r) => !r.timedOut && !r.error)
    );

    const maxLength = Math.max(1, ...allRuns.map((r) => r.datasetLength));
    const maxTime = Math.max(1, ...allRuns.map((r) => r.executionTimeMs));

    const xScale = (length: number) => (length / maxLength) * plotWidth;
    const yScale = (time: number) => plotHeight - (time / maxTime) * plotHeight;

    const yTicks = 4;
    const yTickValues = Array.from(
        { length: yTicks + 1 },
        (_, i) => (maxTime / yTicks) * i
    );

    return (
        <div className="flex flex-col gap-2">
            <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="w-full bg-surface rounded-lg border border-border-subtle"
                role="img"
                aria-label="Benchmark execution time by dataset size"
            >
                <g transform={`translate(${PADDING_LEFT}, ${PADDING_TOP})`}>
                    {yTickValues.map((value, index) => (
                        <g key={index}>
                            <line
                                x1={0}
                                x2={plotWidth}
                                y1={yScale(value)}
                                y2={yScale(value)}
                                stroke="#1e222c"
                                strokeWidth={1}
                            />
                            <text
                                x={-8}
                                y={yScale(value)}
                                textAnchor="end"
                                dominantBaseline="middle"
                                fontSize={10}
                                fill="#5c6577"
                                fontFamily="JetBrains Mono, ui-monospace, monospace"
                            >
                                {value.toFixed(value < 1 ? 2 : 0)}
                            </text>
                        </g>
                    ))}

                    <line
                        x1={0}
                        x2={0}
                        y1={0}
                        y2={plotHeight}
                        stroke="#343b4a"
                        strokeWidth={1}
                    />
                    <line
                        x1={0}
                        x2={plotWidth}
                        y1={plotHeight}
                        y2={plotHeight}
                        stroke="#343b4a"
                        strokeWidth={1}
                    />

                    <text x={-PADDING_LEFT + 10} y={-4} fontSize={10} fill="#5c6577">
                        ms
                    </text>
                    <text
                        x={plotWidth}
                        y={plotHeight + 28}
                        textAnchor="end"
                        fontSize={10}
                        fill="#5c6577"
                    >
                        dataset length (chars)
                    </text>

                    {summaries.map((summary, summaryIndex) => {
                        const color = getGroupColor(summaryIndex + 1);
                        const points = [...summary.runs]
                            .filter((r) => !r.timedOut && !r.error)
                            .sort((a, b) => a.datasetLength - b.datasetLength);

                        if (points.length === 0) return null;

                        const pathData = points
                            .map(
                                (p, i) =>
                                    `${i === 0 ? "M" : "L"} ${xScale(p.datasetLength)} ${yScale(p.executionTimeMs)}`
                            )
                            .join(" ");

                        return (
                            <g key={summary.patternId}>
                                <path
                                    d={pathData}
                                    fill="none"
                                    stroke={color.border}
                                    strokeWidth={2}
                                />
                                {points.map((p, i) => (
                                    <circle
                                        key={i}
                                        cx={xScale(p.datasetLength)}
                                        cy={yScale(p.executionTimeMs)}
                                        r={3.5}
                                        fill={color.bg}
                                        stroke={color.border}
                                        strokeWidth={1.5}
                                    />
                                ))}
                            </g>
                        );
                    })}
                </g>
            </svg>

            <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                {summaries.map((summary, index) => {
                    const color = getGroupColor(index + 1);
                    return (
                        <span
                            key={summary.patternId}
                            className="flex items-center gap-1.5"
                        >
                            <span
                                className="w-3 h-3 rounded-sm border border-black/20 inline-block"
                                style={{ backgroundColor: color.bg }}
                            />
                            {summary.patternLabel}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
