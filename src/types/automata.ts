import type { ASTNode } from "../engine/ast/astTypes";
import type { AutomatonGraph } from "../engine/automata/nfaGraph";
import type { NFA } from "../engine/automata/nfaTypes";
import type { DFA } from "../engine/automata/dfaTypes";
import type { SimulationResult } from "../engine/automata/nfaSimulator";
import type { AutomatonComparison } from "../engine/automata/automatonStats";

/**
 * The full result of running a regex pattern through the compiler
 * pipeline: tokenize -> parse -> AST -> Thompson's construction -> NFA ->
 * subset construction -> DFA -> Hopcroft minimization -> minimized DFA ->
 * graphs. Always defined even on failure, with isValid/error describing
 * what went wrong and at which stage.
 */
export interface AutomatonResult {
    pattern: string;
    isValid: boolean;
    error: string | null;
    errorPosition: number | null;
    ast: ASTNode | null;
    nfa: NFA | null;
    graph: AutomatonGraph | null;
    dfa: DFA | null;
    dfaGraph: AutomatonGraph | null;
    minimizedDfa: DFA | null;
    minimizedDfaGraph: AutomatonGraph | null;
    comparison: AutomatonComparison | null;
}

export interface AutomatonSimulationState {
    result: SimulationResult | null;
    /** Index of the step currently displayed/animated, clamped to [0, steps.length - 1]. */
    currentStepIndex: number;
    isPlaying: boolean;
}
