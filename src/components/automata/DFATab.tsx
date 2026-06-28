import { useMemo, useState } from "react";
import { GitBranch } from "lucide-react";
import { useRegexAutomaton } from "../../hooks/useRegexAutomaton";
import AutomatonGraphSwitcher from "./AutomatonGraphSwitcher";
import DFASimulatorControls from "./DFASimulatorControls";
import EmptyState from "../../design-system/EmptyState";
import Card from "../../design-system/Card";
import type { DFASimulationStep } from "../../engine/automata/dfaSimulator";

export default function DFATab() {
    const {
        pattern,
        isValid,
        error,
        nfa,
        graph,
        dfa,
        dfaGraph,
        minimizedDfa,
        minimizedDfaGraph,
    } = useRegexAutomaton();
    const [currentStep, setCurrentStep] = useState<DFASimulationStep | null>(
        null
    );

    const minimizedActiveStateIds = useMemo(
        () =>
            currentStep?.activeStateId
                ? new Set([currentStep.activeStateId])
                : new Set<string>(),
        [currentStep]
    );

    const minimizedActiveEdgeIds = useMemo(() => {
        if (!currentStep?.firedTransition || !minimizedDfaGraph)
            return new Set<string>();
        const { from, to } = currentStep.firedTransition;
        const matching = minimizedDfaGraph.edges.find(
            (edge) => edge.source === from && edge.target === to
        );
        return matching ? new Set([matching.id]) : new Set<string>();
    }, [currentStep, minimizedDfaGraph]);

    const emptySet = useMemo(() => new Set<string>(), []);

    if (pattern === "") {
        return (
            <EmptyState
                icon={<GitBranch className="w-5 h-5" />}
                title="Nothing to compile yet"
                description="Add blocks in the Builder tab to see its DFA here."
            />
        );
    }

    if (
        !isValid ||
        !nfa ||
        !graph ||
        !dfa ||
        !dfaGraph ||
        !minimizedDfa ||
        !minimizedDfaGraph
    ) {
        return (
            <EmptyState
                icon={<GitBranch className="w-5 h-5" />}
                title="Cannot build automaton"
                description={
                    error ?? "The current pattern could not be compiled."
                }
            />
        );
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            <AutomatonGraphSwitcher
                nfaGraph={graph}
                dfaGraph={dfaGraph}
                minimizedDfaGraph={minimizedDfaGraph}
                activeStateIds={emptySet}
                activeEdgeIds={emptySet}
                minimizedActiveStateIds={minimizedActiveStateIds}
                minimizedActiveEdgeIds={minimizedActiveEdgeIds}
            />
            <Card>
                <DFASimulatorControls
                    dfa={minimizedDfa}
                    onStepChange={setCurrentStep}
                    label="minimized DFA"
                />
            </Card>
        </div>
    );
}
