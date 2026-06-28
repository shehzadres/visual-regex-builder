/**
 * The kind of symbol an NFA transition consumes.
 * - "epsilon": no input consumed (ε-transition)
 * - "char": a single literal character
 * - "class": a character class predicate (digit/word/whitespace/custom set)
 * - "any": the '.' wildcard (any character)
 */
export type TransitionSymbolKind = "epsilon" | "char" | "class" | "any";

export interface TransitionSymbol {
    kind: TransitionSymbolKind;
    /** For kind === "char": the literal character. */
    char?: string;
    /** For kind === "class": a human-readable label, e.g. "\\d", "[a-z0-9]". */
    classLabel?: string;
    /** For kind === "class": predicate used by the simulator to test an input character. */
    test?: (input: string) => boolean;
}

export interface NFATransition {
    from: string;
    to: string;
    symbol: TransitionSymbol;
}

export interface NFAState {
    id: string;
    isStart: boolean;
    isAccepting: boolean;
    /**
     * Set when this state corresponds to entering or leaving a capture
     * group, used only for richer labeling in the visualization — not
     * needed for simulation correctness.
     */
    groupLabel?: string;
}

export interface NFA {
    states: NFAState[];
    transitions: NFATransition[];
    startId: string;
    acceptId: string;
}

let stateCounter = 0;

/** Resets the global NFA state-id counter; useful between independent builds so ids stay short and readable. */
export function resetStateCounter(): void {
    stateCounter = 0;
}

export function createStateId(): string {
    const id = `q${stateCounter}`;
    stateCounter += 1;
    return id;
}
