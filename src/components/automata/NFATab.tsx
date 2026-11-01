import { useMemo, useState } from "react";
import { Settings2 } from "lucide-react";
import { useRegexAutomaton } from "../../hooks/useRegexAutomaton";
import NFAGraphView from "./NFAGraphView";
import SimulatorControls from "./SimulatorControls";
import EmptyState from "../../design-system/EmptyState";
import type { SimulationStep } from "../../engine/automata/nfaSimulator";

export default function NFATab() {
  const { pattern, isValid, error, nfa, graph } = useRegexAutomaton();
  const [currentStep, setCurrentStep] = useState<SimulationStep | null>(null);
  const activeStateIds = useMemo(() => new Set(currentStep?.activeStateIds ?? []), [currentStep]);
  const activeEdgeIds = useMemo(() => {
    if (!currentStep || !graph) return new Set<string>();
    const fired = new Set(currentStep.firedTransitions.map((t) => `${t.from}->${t.to}`));
    return new Set(graph.edges.filter((edge) => fired.has(`${edge.source}->${edge.target}`)).map((edge) => edge.id));
  }, [currentStep, graph]);

  if (!pattern) return <div className="tool-empty-wrap"><EmptyState icon={<Settings2 className="w-5 h-5" />} title="Nothing to compile yet" description="Build an expression to generate its Thompson NFA and inspect every transition." /></div>;
  if (!isValid || !nfa || !graph) return <div className="tool-empty-wrap"><EmptyState icon={<Settings2 className="w-5 h-5" />} title="Cannot build automaton" description={error ?? "The current pattern could not be compiled."} /></div>;

  return <section className="tool-view automaton-view">
    <header className="tool-view-head">
      <div><span className="tool-eyebrow">03 / THOMPSON CONSTRUCTION</span><h1>Nondeterministic automaton</h1><p>Follow epsilon closures and transitions through the generated state machine.</p></div>
      <div className="tool-metrics"><div><strong>{graph.nodes.length}</strong><span>STATES</span></div><div><strong>{graph.edges.length}</strong><span>TRANSITIONS</span></div><div><strong>{graph.edges.filter(e => e.isEpsilon).length}</strong><span>EPSILON</span></div></div>
    </header>
    <div className="tool-panel graph-panel"><div className="tool-panel-head"><div><span className="tool-panel-index">A</span><strong>State graph</strong></div><span>DRAG NODES · SCROLL TO ZOOM</span></div><div className="graph-stage"><NFAGraphView graph={graph} activeStateIds={activeStateIds} activeEdgeIds={activeEdgeIds} /></div></div>
    <div className="tool-panel simulator-panel"><div className="tool-panel-head"><div><span className="tool-panel-index">B</span><strong>Trace simulator</strong></div><span>STEP THROUGH INPUT</span></div><SimulatorControls nfa={nfa} onStepChange={setCurrentStep} /></div>
    <div className="automaton-legend"><span><i className="legend-start"/>Start state</span><span><i className="legend-accept"/>Accepting state</span><span><i className="legend-epsilon"/>ε transition</span><span><i className="legend-active"/>Active in trace</span></div>
  </section>;
}
