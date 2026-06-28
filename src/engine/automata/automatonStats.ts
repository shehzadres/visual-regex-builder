import type { NFA } from "./nfaTypes";
import type { DFA } from "./dfaTypes";

export interface AutomatonStats {
    stateCount: number;
    transitionCount: number;
    acceptingStateCount: number;
}

export interface ConstructionTiming {
    nfaConstructionMs: number;
    dfaConstructionMs: number;
    minimizationMs: number;
    totalMs: number;
}

export interface AutomatonComparison {
    nfa: AutomatonStats;
    dfa: AutomatonStats;
    minimizedDfa: AutomatonStats;
    timing: ConstructionTiming;
    /** Percentage reduction in state count from DFA to minimized DFA, e.g. 25 means a 25% reduction. */
    minimizationReductionPercent: number;
    /** Ratio of DFA states to NFA states — illustrates subset construction's potential state-space blowup. */
    nfaToDfaExpansionRatio: number;
}

function statsForNFA(nfa: NFA): AutomatonStats {
    return {
        stateCount: nfa.states.length,
        transitionCount: nfa.transitions.length,
        acceptingStateCount: nfa.states.filter((s) => s.isAccepting).length,
    };
}

function statsForDFA(dfa: DFA): AutomatonStats {
    return {
        stateCount: dfa.states.length,
        transitionCount: dfa.transitions.length,
        acceptingStateCount: dfa.acceptingIds.length,
    };
}

/**
 * Builds the full NFA/DFA/minimized-DFA comparison, including state and
 * transition counts, accepting-state counts, and derived ratios. Timing
 * is supplied by the caller (measured around each construction phase with
 * performance.now()) rather than re-measured here, so this function stays
 * a pure, side-effect-free summarizer.
 */
export function compareAutomata(
    nfa: NFA,
    dfa: DFA,
    minimizedDfa: DFA,
    timing: ConstructionTiming
): AutomatonComparison {
    const nfaStats = statsForNFA(nfa);
    const dfaStats = statsForDFA(dfa);
    const minimizedStats = statsForDFA(minimizedDfa);

    const reduction =
        dfaStats.stateCount === 0
            ? 0
            : ((dfaStats.stateCount - minimizedStats.stateCount) /
                  dfaStats.stateCount) *
              100;

    const expansionRatio =
        nfaStats.stateCount === 0
            ? 0
            : dfaStats.stateCount / nfaStats.stateCount;

    return {
        nfa: nfaStats,
        dfa: dfaStats,
        minimizedDfa: minimizedStats,
        timing,
        minimizationReductionPercent: reduction,
        nfaToDfaExpansionRatio: expansionRatio,
    };
}
