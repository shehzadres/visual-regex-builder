import type { DFA, DFATransition } from "./dfaTypes";

export interface DFASimulationStep {
    stepIndex: number;
    consumedChar: string | null;
    /** The single active state at this point — a DFA has exactly one, unlike an NFA's set. */
    activeStateId: string | null;
    firedTransition: DFATransition | null;
}

export interface DFASimulationResult {
    steps: DFASimulationStep[];
    isAccepted: boolean;
    /** Index into `steps` where the input was rejected (no transition matched), or null if it never got stuck. */
    rejectedAtStepIndex: number | null;
}

/**
 * Runs `input` through a DFA step by step. Unlike NFA simulation, a DFA
 * has at most one active state and at most one matching transition per
 * character by construction, so no epsilon-closure or subset tracking is
 * needed — each step is a direct table lookup.
 */
export function simulateDFA(dfa: DFA, input: string): DFASimulationResult {
    const steps: DFASimulationStep[] = [
        {
            stepIndex: 0,
            consumedChar: null,
            activeStateId: dfa.startId,
            firedTransition: null,
        },
    ];

    let current: string | null = dfa.startId;
    let rejectedAtStepIndex: number | null = null;

    for (let i = 0; i < input.length; i++) {
        const ch = input[i];

        if (current === null) {
            steps.push({
                stepIndex: i + 1,
                consumedChar: ch,
                activeStateId: null,
                firedTransition: null,
            });
            continue;
        }

        const transition = dfa.transitions.find(
            (t) => t.from === current && t.symbol.test(ch)
        );

        if (!transition) {
            if (rejectedAtStepIndex === null) {
                rejectedAtStepIndex = i + 1;
            }
            current = null;
            steps.push({
                stepIndex: i + 1,
                consumedChar: ch,
                activeStateId: null,
                firedTransition: null,
            });
            continue;
        }

        current = transition.to;
        steps.push({
            stepIndex: i + 1,
            consumedChar: ch,
            activeStateId: current,
            firedTransition: transition,
        });
    }

    const isAccepted = current !== null && dfa.acceptingIds.includes(current);

    return { steps, isAccepted, rejectedAtStepIndex };
}
