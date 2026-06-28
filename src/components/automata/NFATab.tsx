import { useMemo, useState } from "react";
import { Settings2 } from "lucide-react";
import { useRegexAutomaton } from "../../hooks/useRegexAutomaton";
import NFAGraphView from "./NFAGraphView";
import SimulatorControls from "./SimulatorControls";
import EmptyState from "../../design-system/EmptyState";
import Card from "../../design-system/Card";
import type { SimulationStep } from "../../engine/automata/nfaSimulator";

export default function NFATab() {
    const { pattern, isValid, error, nfa, graph } = useRegexAutomaton();
    const [currentStep, setCurrentStep] = useState<SimulationStep | null>(
        null
    );

    const activeStateIds = useMemo(
        () => new Set(currentStep?.activeStateIds ?? []),
        [currentStep]
    );

    const activeEdgeIds = useMemo(() => {
        if (!currentStep || !graph) return new Set<string>();
        const firedPairs = new Set(
            currentStep.firedTransitions.map((t) => `${t.from}->${t.to}`)
        );
        const ids = graph.edges
            .filter((edge) => firedPairs.has(`${edge.source}->${edge.target}`))
            .map((edge) => edge.id);
        return new Set(ids);
    }, [currentStep, graph]);

    if (pattern === "") {
        return (
            <EmptyState
                icon={<Settings2 className="w-5 h-5" />}
                title="Nothing to compile yet"
                description="Add blocks in the Builder tab to see its Thompson NFA here."
            />
        );
    }

    if (!isValid || !nfa || !graph) {
        return (
            <EmptyState
                icon={<Settings2 className="w-5 h-5" />}
                title="Cannot build automaton"
                description={error ?? "The current pattern could not be compiled."}
            />
        );
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex-1 min-h-[420px]">
                <NFAGraphView
                    graph={graph}
                    activeStateIds={activeStateIds}
                    activeEdgeIds={activeEdgeIds}
                />
            </div>
            <Legend />
            <Card>
                <SimulatorControls nfa={nfa} onStepChange={setCurrentStep} />
            </Card>
        </div>
    );
}

function Legend() {
    return (
        <div className="flex flex-wrap items-center gap-4 text-xs text-text-tertiary">
            <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-accent-500 inline-block" />
                Start state
            </span>
            <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-success-500 inline-block" />
                Accepting state
            </span>
            <span className="flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-dashed border-border-strong inline-block" />
                ε transition
            </span>
            <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-warning-500 border border-warning-600 inline-block" />
                Active during simulation
            </span>
            <span className="text-text-disabled">
                Scroll to zoom, drag to pan or reposition states
            </span>
        </div>
    );
}
