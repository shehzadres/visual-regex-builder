import type { AutomatonComparison } from "../../engine/automata/automatonStats";
import { formatDuration } from "../../utils/textHelpers";
import { StatCard } from "../../design-system/Card";

interface ComparisonPanelProps {
    comparison: AutomatonComparison;
}

export default function ComparisonPanel({ comparison }: ComparisonPanelProps) {
    const rows: Array<{
        label: string;
        nfa: string;
        dfa: string;
        minimizedDfa: string;
    }> = [
        {
            label: "States",
            nfa: String(comparison.nfa.stateCount),
            dfa: String(comparison.dfa.stateCount),
            minimizedDfa: String(comparison.minimizedDfa.stateCount),
        },
        {
            label: "Transitions",
            nfa: String(comparison.nfa.transitionCount),
            dfa: String(comparison.dfa.transitionCount),
            minimizedDfa: String(comparison.minimizedDfa.transitionCount),
        },
        {
            label: "Accepting states",
            nfa: String(comparison.nfa.acceptingStateCount),
            dfa: String(comparison.dfa.acceptingStateCount),
            minimizedDfa: String(comparison.minimizedDfa.acceptingStateCount),
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="overflow-x-auto rounded-lg border border-border-subtle">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="text-left text-text-tertiary bg-surface-raised border-b border-border-default">
                            <th className="py-2 px-3 font-semibold">Metric</th>
                            <th className="py-2 px-3 font-semibold">NFA</th>
                            <th className="py-2 px-3 font-semibold">DFA</th>
                            <th className="py-2 px-3 font-semibold">
                                Minimized DFA
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr
                                key={row.label}
                                className="border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors"
                            >
                                <td className="py-2 px-3 text-text-secondary">
                                    {row.label}
                                </td>
                                <td className="py-2 px-3 font-mono-tabular text-text-primary">
                                    {row.nfa}
                                </td>
                                <td className="py-2 px-3 font-mono-tabular text-text-primary">
                                    {row.dfa}
                                </td>
                                <td className="py-2 px-3 font-mono-tabular text-text-primary">
                                    {row.minimizedDfa}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <StatCard
                    label="NFA → DFA construction"
                    value={formatDuration(comparison.timing.dfaConstructionMs)}
                />
                <StatCard
                    label="Hopcroft minimization"
                    value={formatDuration(comparison.timing.minimizationMs)}
                />
                <StatCard
                    label="Total pipeline time"
                    value={formatDuration(comparison.timing.totalMs)}
                />
                <StatCard
                    label="State expansion (NFA→DFA)"
                    value={`${comparison.nfaToDfaExpansionRatio.toFixed(2)}x`}
                    accent="accent"
                />
            </div>

            <div className="rounded-md border border-success-600/30 bg-success-bg px-3 py-2.5 text-xs text-success-300">
                Minimization reduced the DFA from{" "}
                <span className="font-semibold">
                    {comparison.dfa.stateCount}
                </span>{" "}
                to{" "}
                <span className="font-semibold">
                    {comparison.minimizedDfa.stateCount}
                </span>{" "}
                states — a{" "}
                <span className="font-semibold">
                    {comparison.minimizationReductionPercent.toFixed(1)}%
                </span>{" "}
                reduction.
            </div>
        </div>
    );
}
