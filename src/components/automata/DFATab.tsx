import { useMemo, useState } from "react";
import { GitBranch } from "lucide-react";
import { useRegexAutomaton } from "../../hooks/useRegexAutomaton";
import AutomatonGraphSwitcher from "./AutomatonGraphSwitcher";
import DFASimulatorControls from "./DFASimulatorControls";
import EmptyState from "../../design-system/EmptyState";
import type { DFASimulationStep } from "../../engine/automata/dfaSimulator";

export default function DFATab() {
  const { pattern, isValid, error, nfa, graph, dfa, dfaGraph, minimizedDfa, minimizedDfaGraph } = useRegexAutomaton();
  const [currentStep, setCurrentStep] = useState<DFASimulationStep | null>(null);
  const minimizedActiveStateIds = useMemo(() => currentStep?.activeStateId ? new Set([currentStep.activeStateId]) : new Set<string>(), [currentStep]);
  const minimizedActiveEdgeIds = useMemo(() => {
    if (!currentStep?.firedTransition || !minimizedDfaGraph) return new Set<string>();
    const { from, to } = currentStep.firedTransition;
    const edge = minimizedDfaGraph.edges.find((item) => item.source === from && item.target === to);
    return edge ? new Set([edge.id]) : new Set<string>();
  }, [currentStep, minimizedDfaGraph]);
  const emptySet = useMemo(() => new Set<string>(), []);

  if (!pattern) return <div className="tool-empty-wrap"><EmptyState icon={<GitBranch className="w-5 h-5" />} title="Nothing to compile yet" description="A deterministic machine will be generated from your current expression." /></div>;
  if (!isValid || !nfa || !graph || !dfa || !dfaGraph || !minimizedDfa || !minimizedDfaGraph) return <div className="tool-empty-wrap"><EmptyState icon={<GitBranch className="w-5 h-5" />} title="Cannot build automaton" description={error ?? "The current pattern could not be compiled."} /></div>;

  return <section className="tool-view automaton-view">
    <header className="tool-view-head"><div><span className="tool-eyebrow">04 / SUBSET CONSTRUCTION + HOPCROFT</span><h1>Deterministic automaton</h1><p>Compare the generated DFA with its minimized equivalent.</p></div>
      <div className="tool-metrics"><div><strong>{dfa.states.length}</strong><span>DFA STATES</span></div><div><strong>{minimizedDfa.states.length}</strong><span>MINIMIZED</span></div><div><strong>{Math.max(0, dfa.states.length - minimizedDfa.states.length)}</strong><span>REMOVED</span></div></div>
    </header>
    <div className="tool-panel graph-panel"><div className="tool-panel-head"><div><span className="tool-panel-index">A</span><strong>Automaton comparison</strong></div><span>SELECT A REPRESENTATION</span></div><AutomatonGraphSwitcher nfaGraph={graph} dfaGraph={dfaGraph} minimizedDfaGraph={minimizedDfaGraph} activeStateIds={emptySet} activeEdgeIds={emptySet} minimizedActiveStateIds={minimizedActiveStateIds} minimizedActiveEdgeIds={minimizedActiveEdgeIds} /></div>
    <div className="tool-panel simulator-panel"><div className="tool-panel-head"><div><span className="tool-panel-index">B</span><strong>Execution trace</strong></div><span>MINIMIZED DFA</span></div><DFASimulatorControls dfa={minimizedDfa} onStepChange={setCurrentStep} label="minimized DFA" /></div>
  </section>;
}
