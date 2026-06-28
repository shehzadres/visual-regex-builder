import type { NFA, NFATransition } from "./nfaTypes";

/** All states reachable from `from` via zero or more epsilon transitions, including `from` itself. */
function epsilonClosure(
    stateIds: Iterable<string>,
    transitions: NFATransition[]
): Set<string> {
    const closure = new Set<string>(stateIds);
    const stack = [...closure];

    const epsilonTransitions = transitions.filter(
        (t) => t.symbol.kind === "epsilon"
    );

    while (stack.length > 0) {
        const current = stack.pop();
        if (current === undefined) continue;

        for (const transition of epsilonTransitions) {
            if (transition.from === current && !closure.has(transition.to)) {
                closure.add(transition.to);
                stack.push(transition.to);
            }
        }
    }

    return closure;
}

function matchesSymbol(transition: NFATransition, ch: string): boolean {
    switch (transition.symbol.kind) {
        case "char":
            return transition.symbol.char === ch;
        case "any":
            return ch !== "\n";
        case "class":
            return transition.symbol.test ? transition.symbol.test(ch) : false;
        default:
            return false;
    }
}

/** One step of the simulation: which states were active, which character was consumed, and which transitions fired. */
export interface SimulationStep {
    stepIndex: number;
    /** The character consumed to produce this step, or null for the initial step (before any input is read). */
    consumedChar: string | null;
    /** States active (after epsilon closure) at this point in the simulation. */
    activeStateIds: string[];
    /** Non-epsilon transitions that fired to reach this step's active states. */
    firedTransitions: NFATransition[];
}

export interface SimulationResult {
    steps: SimulationStep[];
    isAccepted: boolean;
    /** Index into `steps` of the longest prefix that reached an accepting state, or null if never accepted. */
    acceptingStepIndex: number | null;
}

/**
 * Runs `input` through the NFA step by step using subset (powerset)
 * simulation: at each step the simulator tracks the full set of states the
 * automaton could be in simultaneously, exactly as a true NFA does, rather
 * than committing to a single guess. This gives the animation a faithful,
 * branch-aware trace and lets the UI show every state that's "live" at once.
 */
export function simulateNFA(nfa: NFA, input: string): SimulationResult {
    const steps: SimulationStep[] = [];

    let activeStates = epsilonClosure([nfa.startId], nfa.transitions);
    steps.push({
        stepIndex: 0,
        consumedChar: null,
        activeStateIds: Array.from(activeStates),
        firedTransitions: [],
    });

    let acceptingStepIndex = activeStates.has(nfa.acceptId) ? 0 : null;

    for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        const fired: NFATransition[] = [];
        const nextStates = new Set<string>();

        for (const transition of nfa.transitions) {
            if (transition.symbol.kind === "epsilon") continue;
            if (!activeStates.has(transition.from)) continue;
            if (!matchesSymbol(transition, ch)) continue;

            fired.push(transition);
            nextStates.add(transition.to);
        }

        activeStates = epsilonClosure(nextStates, nfa.transitions);

        steps.push({
            stepIndex: i + 1,
            consumedChar: ch,
            activeStateIds: Array.from(activeStates),
            firedTransitions: fired,
        });

        if (activeStates.has(nfa.acceptId)) {
            acceptingStepIndex = i + 1;
        }

        if (activeStates.size === 0) {
            // No live states remain; further characters cannot revive the
            // match, but we keep stepping so the trace stays aligned with
            // the full input for the animation timeline.
            continue;
        }
    }

    return {
        steps,
        isAccepted: acceptingStepIndex === steps.length - 1,
        acceptingStepIndex,
    };
}
