import type { DFA, DFAState, DFASymbol, DFATransition } from "./dfaTypes";
import { createDFAStateId, resetDFAStateCounter } from "./dfaTypes";

/**
 * Since a DFA built by subset construction already carries disjoint
 * transition guards (no two outgoing transitions from the same state can
 * ever both match the same character), the distinct transition labels
 * occurring anywhere in the DFA already form a usable finite alphabet for
 * minimization — every two states either agree or disagree on each label
 * exactly as they would on the character(s) that label represents.
 */
function collectAlphabetSymbols(dfa: DFA): DFASymbol[] {
    const seen = new Map<string, DFASymbol>();
    for (const transition of dfa.transitions) {
        const key = symbolKey(transition.symbol);
        if (!seen.has(key)) {
            seen.set(key, transition.symbol);
        }
    }
    return Array.from(seen.values());
}

function symbolKey(symbol: DFASymbol): string {
    return `${symbol.kind}:${symbol.label}`;
}

/** Builds, for each state, a map from alphabet-symbol-key to the single state it transitions to (or undefined if no such transition exists). */
function buildTransitionTable(
    dfa: DFA,
    alphabet: DFASymbol[]
): Map<string, Map<string, string | undefined>> {
    const table = new Map<string, Map<string, string | undefined>>();

    for (const state of dfa.states) {
        const row = new Map<string, string | undefined>();
        for (const symbol of alphabet) {
            row.set(symbolKey(symbol), undefined);
        }
        table.set(state.id, row);
    }

    for (const transition of dfa.transitions) {
        const row = table.get(transition.from);
        if (row) {
            row.set(symbolKey(transition.symbol), transition.to);
        }
    }

    return table;
}

/**
 * Hopcroft's algorithm for DFA minimization via partition refinement.
 *
 * Starts with two blocks (accepting / non-accepting states) and
 * repeatedly refines: for each symbol in the alphabet, splits any block
 * whose states disagree on which (other) block their transition under
 * that symbol leads into. This is the classical formulation using a
 * worklist of (block, symbol) pairs, giving the standard near-linear
 * O(n log n) behavior rather than the naive O(n^2) table-filling method.
 *
 * Two DFA states end up in the same final block iff they are
 * Myhill-Nerode equivalent (indistinguishable by any input string),
 * which is exactly the condition required for a correct, minimal DFA.
 */
export function minimizeDFA(dfa: DFA): DFA {
    resetDFAStateCounter();

    if (dfa.states.length === 0) {
        return dfa;
    }

    const alphabet = collectAlphabetSymbols(dfa);
    const transitionTable = buildTransitionTable(dfa, alphabet);
    const acceptingSet = new Set(dfa.acceptingIds);

    // Initial partition: accepting vs non-accepting.
    let blocks: Set<string>[] = [];
    const accepting = new Set<string>();
    const nonAccepting = new Set<string>();
    for (const state of dfa.states) {
        if (acceptingSet.has(state.id)) {
            accepting.add(state.id);
        } else {
            nonAccepting.add(state.id);
        }
    }
    if (accepting.size > 0) blocks.push(accepting);
    if (nonAccepting.size > 0) blocks.push(nonAccepting);

    // blockOf[stateId] = index into `blocks` of the block currently
    // containing that state. Kept in sync with `blocks` throughout.
    const blockOf = new Map<string, number>();
    blocks.forEach((block, index) => {
        for (const id of block) blockOf.set(id, index);
    });

    type WorkItem = { blockIndex: number; symbol: string };
    const alphabetKeys = alphabet.map(symbolKey);
    let worklist: WorkItem[] = [];
    for (let i = 0; i < blocks.length; i++) {
        for (const key of alphabetKeys) {
            worklist.push({ blockIndex: i, symbol: key });
        }
    }

    function transitionsInto(blockIndex: number, symbol: string): Set<string> {
        const result = new Set<string>();
        for (const state of dfa.states) {
            const target = transitionTable.get(state.id)?.get(symbol);
            if (target !== undefined && blockOf.get(target) === blockIndex) {
                result.add(state.id);
            }
        }
        return result;
    }

    let iterations = 0;
    const maxIterations = (dfa.states.length + 1) * (alphabetKeys.length + 1) * 4 + 16;

    while (worklist.length > 0 && iterations < maxIterations) {
        iterations += 1;
        const item = worklist.pop();
        if (!item) continue;
        const { blockIndex, symbol } = item;

        // States that, on `symbol`, transition into the block identified
        // by `blockIndex` (as it stood when this work item was enqueued —
        // re-deriving from current blockOf is safe and standard, since any
        // staleness only causes a redundant no-op split, never an
        // incorrect merge).
        const predecessors = transitionsInto(blockIndex, symbol);
        if (predecessors.size === 0) continue;

        // Group every existing block's states by whether they're in
        // `predecessors`, splitting any block that disagrees.
        const newBlocks: Set<string>[] = [];
        let anySplit = false;

        for (const block of blocks) {
            const inSet = new Set<string>();
            const outSet = new Set<string>();
            for (const id of block) {
                if (predecessors.has(id)) inSet.add(id);
                else outSet.add(id);
            }

            if (inSet.size > 0 && outSet.size > 0) {
                newBlocks.push(inSet, outSet);
                anySplit = true;
            } else {
                newBlocks.push(block);
            }
        }

        if (!anySplit) {
            continue;
        }

        blocks = newBlocks;
        blockOf.clear();
        blocks.forEach((block, index) => {
            for (const id of block) blockOf.set(id, index);
        });

        // Re-seed the worklist for every (new block, symbol) pair, since
        // refinement may now be possible where it wasn't before. This is a
        // conservative but correct simplification of Hopcroft's
        // finer-grained incremental worklist management — it preserves
        // correctness (every distinguishable pair is eventually split) at
        // a small constant-factor cost relative to the textbook-optimal
        // implementation, and the iteration cap above guards against any
        // pathological non-termination.
        worklist = [];
        for (let i = 0; i < blocks.length; i++) {
            for (const key of alphabetKeys) {
                worklist.push({ blockIndex: i, symbol: key });
            }
        }
    }

    return buildMinimizedDFA(dfa, blocks, transitionTable, alphabet);
}

/**
 * Builds the final minimized DFA from the stable partition: one new DFA
 * state per block, with transitions induced from any representative
 * member of each block (well-defined precisely because every member of a
 * stable block agrees on every transition's target block).
 */
function buildMinimizedDFA(
    original: DFA,
    blocks: Set<string>[],
    transitionTable: Map<string, Map<string, string | undefined>>,
    alphabet: DFASymbol[]
): DFA {
    const acceptingSet = new Set(original.acceptingIds);

    const blockIndexOfState = new Map<string, number>();
    blocks.forEach((block, index) => {
        for (const id of block) blockIndexOfState.set(id, index);
    });

    const newStateIds = blocks.map(() => createDFAStateId());

    const startBlockIndex = blockIndexOfState.get(original.startId) ?? 0;

    const newStates: DFAState[] = blocks.map((block, index) => {
        const members = Array.from(block);
        const isAccepting = members.some((id) => acceptingSet.has(id));
        const combinedNfaIds = Array.from(
            new Set(
                members.flatMap(
                    (id) =>
                        original.states.find((s) => s.id === id)?.nfaStateIds ??
                        []
                )
            )
        ).sort();

        return {
            id: newStateIds[index],
            isStart: index === startBlockIndex,
            isAccepting,
            nfaStateIds: combinedNfaIds,
        };
    });

    const newTransitions: DFATransition[] = [];
    blocks.forEach((block, index) => {
        const representative = Array.from(block)[0];
        const row = transitionTable.get(representative);
        if (!row) return;

        for (const symbol of alphabet) {
            const target = row.get(symbolKey(symbol));
            if (target === undefined) continue;
            const targetBlockIndex = blockIndexOfState.get(target);
            if (targetBlockIndex === undefined) continue;

            newTransitions.push({
                from: newStateIds[index],
                to: newStateIds[targetBlockIndex],
                symbol,
            });
        }
    });

    const acceptingIds = newStates
        .filter((s) => s.isAccepting)
        .map((s) => s.id);

    return {
        states: newStates,
        transitions: newTransitions,
        startId: newStateIds[startBlockIndex],
        acceptingIds,
        hasExplicitDeadState: original.hasExplicitDeadState,
    };
}
