import type { NFA, NFATransition } from "./nfaTypes";

/**
 * Computes the epsilon-closure of a set of NFA states: every state
 * reachable from the given states via zero or more epsilon transitions,
 * including the given states themselves. This is the standard automata-
 * theory ECLOSE(T) operation, used both directly by subset construction
 * and to seed the DFA's start state from the NFA's start state.
 */
export function epsilonClosure(
    stateIds: Iterable<string>,
    nfa: NFA
): Set<string> {
    const closure = new Set<string>(stateIds);
    const stack: string[] = [...closure];

    // Precompute epsilon adjacency once per call so repeated lookups
    // during the traversal are O(1) instead of re-scanning all transitions.
    const epsilonAdjacency = new Map<string, string[]>();
    for (const transition of nfa.transitions) {
        if (transition.symbol.kind !== "epsilon") continue;
        const list = epsilonAdjacency.get(transition.from) ?? [];
        list.push(transition.to);
        epsilonAdjacency.set(transition.from, list);
    }

    while (stack.length > 0) {
        const current = stack.pop();
        if (current === undefined) continue;

        for (const next of epsilonAdjacency.get(current) ?? []) {
            if (!closure.has(next)) {
                closure.add(next);
                stack.push(next);
            }
        }
    }

    return closure;
}

/**
 * The classic automata-theory MOVE(T, a) operation: given a set of NFA
 * states T and an input character a, returns every state reachable by
 * consuming exactly one transition labeled with a symbol that matches a
 * (epsilon transitions are never followed here — closure handles those).
 */
export function move(
    stateIds: Iterable<string>,
    char: string,
    nfa: NFA
): Set<string> {
    const sourceSet = new Set(stateIds);
    const result = new Set<string>();

    for (const transition of nfa.transitions) {
        if (transition.symbol.kind === "epsilon") continue;
        if (!sourceSet.has(transition.from)) continue;
        if (matchesSymbol(transition, char)) {
            result.add(transition.to);
        }
    }

    return result;
}

/**
 * Same operation as `move`, but parameterized over a pre-filtered list of
 * transitions instead of the full NFA — used by subset construction so it
 * can pass in just the transitions relevant to a particular symbolic
 * partition, avoiding re-scanning the whole transition list per partition.
 */
export function moveOverTransitions(
    stateIds: ReadonlySet<string>,
    transitions: NFATransition[],
    char: string
): Set<string> {
    const result = new Set<string>();
    for (const transition of transitions) {
        if (!stateIds.has(transition.from)) continue;
        if (matchesSymbol(transition, char)) {
            result.add(transition.to);
        }
    }
    return result;
}

export function matchesSymbol(transition: NFATransition, ch: string): boolean {
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
