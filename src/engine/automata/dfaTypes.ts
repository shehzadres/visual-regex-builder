/**
 * A symbolic transition guard for a DFA edge. Unlike an NFA transition,
 * a DFA transition's symbol set must be mutually exclusive with every
 * other outgoing transition from the same state (determinism), so each
 * guard here represents one disjoint slice of the input alphabet rather
 * than an arbitrary possibly-overlapping predicate.
 */
export type DFASymbolKind = "char" | "class" | "any";

export interface DFASymbol {
    kind: DFASymbolKind;
    /** For kind === "char": the literal character. */
    char?: string;
    /** Human-readable label for this guard, e.g. "a", "\\d", ".". */
    label: string;
    /** Predicate used by the DFA simulator/minimizer to test an input character against this guard. */
    test: (input: string) => boolean;
}

export interface DFATransition {
    from: string;
    to: string;
    symbol: DFASymbol;
}

export interface DFAState {
    id: string;
    isStart: boolean;
    isAccepting: boolean;
    /**
     * The set of original NFA state ids this DFA state corresponds to,
     * i.e. the subset-construction "name" of the state. Kept for display
     * (e.g. "{q0,q2,q5}") and for minimization bookkeeping.
     */
    nfaStateIds: string[];
}

export interface DFA {
    states: DFAState[];
    transitions: DFATransition[];
    startId: string;
    /** A DFA may have more than one accepting state (subset construction can produce several). */
    acceptingIds: string[];
    /**
     * True if this DFA includes an explicit dead/reject state for guard
     * completeness bookkeeping. Subset construction here does not add an
     * explicit dead state — unmatched input simply has no transition —
     * so this is always false for constructed DFAs, but minimization
     * preserves whatever was true of its input.
     */
    hasExplicitDeadState: boolean;
}

let dfaStateCounter = 0;

export function resetDFAStateCounter(): void {
    dfaStateCounter = 0;
}

export function createDFAStateId(): string {
    const id = `d${dfaStateCounter}`;
    dfaStateCounter += 1;
    return id;
}
