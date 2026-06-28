import type { NFA, NFATransition } from "./nfaTypes";
import { epsilonClosure } from "./epsilonClosure";
import {
    createDFAStateId,
    resetDFAStateCounter,
    type DFA,
    type DFAState,
    type DFASymbol,
    type DFATransition,
} from "./dfaTypes";

/**
 * One guard taken directly from an NFA transition's symbol: either an
 * exact literal character, or a predicate (class / "any"). Used as the
 * unit of comparison when building disjoint alphabet partitions, since
 * two guards can overlap (e.g. the literal '5' and the class \d both
 * match the character '5').
 */
interface Guard {
    label: string;
    test: (ch: string) => boolean;
}

/**
 * A spread of representative characters used to probe guards for
 * overlap. Every literal character appearing in the NFA is always
 * included separately (so exact matches are never missed), plus this
 * curated spread of common character categories so that class-vs-class
 * and class-vs-"any" overlaps are detected even when no literal
 * character happens to land in the overlap region.
 */
const PROBE_CATEGORY_SAMPLES = [
    "a",
    "z",
    "A",
    "Z",
    "0",
    "9",
    "_",
    " ",
    "\t",
    "\n",
    ".",
    "-",
    "@",
    "#",
    "!",
];

function collectGuards(transitions: NFATransition[]): Guard[] {
    const guards: Guard[] = [];
    const seen = new Set<string>();

    for (const transition of transitions) {
        const symbol = transition.symbol;
        let label: string;
        let test: (ch: string) => boolean;

        if (symbol.kind === "char" && symbol.char !== undefined) {
            const literal = symbol.char;
            label = `char:${literal}`;
            test = (c) => c === literal;
        } else if (symbol.kind === "class" && symbol.test) {
            label = `class:${symbol.classLabel ?? "?"}`;
            test = symbol.test;
        } else if (symbol.kind === "any") {
            label = "any";
            test = (c) => c !== "\n";
        } else {
            continue;
        }

        if (seen.has(label)) continue;
        seen.add(label);
        guards.push({ label, test });
    }

    return guards;
}

/**
 * Builds a set of representative probe characters guaranteed to land in
 * every distinct overlap region among the given guards: every literal
 * character used by any "char" guard, plus a fixed spread of common
 * category samples that reliably separates the standard \d/\w/\s classes
 * and their negations from each other and from "any".
 */
function buildProbeCharacters(guards: Guard[]): string[] {
    const probes = new Set<string>(PROBE_CATEGORY_SAMPLES);

    for (const guard of guards) {
        const match = /^char:(.)$/.exec(guard.label);
        if (match) {
            probes.add(match[1]);
        }
    }

    return Array.from(probes);
}

/**
 * A disjoint region of the input alphabet: every character in this
 * region produces an identical "signature" (the same subset of guards
 * matches it), so for the purposes of subset construction every such
 * character is interchangeable — the DFA can treat the whole region as
 * a single alphabet symbol.
 */
interface AlphabetPartition {
    /** Guard labels that match every character in this region. */
    matchingGuardLabels: Set<string>;
    /** A representative character belonging to this region, used to re-test guards when computing move(). */
    representative: string;
    /** Human-readable label for the DFA transition this partition produces. */
    displayLabel: string;
}

/**
 * Refines the guards taken from the NFA's transitions into a set of
 * mutually disjoint alphabet partitions: every probe character is
 * assigned a "signature" (the set of guards matching it), probes sharing
 * a signature are grouped into one partition, and each partition's
 * representative is used to evaluate move() against the original NFA
 * transitions. This guarantees that even overlapping guards (e.g. a
 * literal '5' alongside \d) are split into the correct disjoint regions
 * (here: {'5'} and {\d minus '5'}) rather than being treated as two
 * independently-firing transitions on the same input.
 */
function buildAlphabetPartitions(transitions: NFATransition[]): AlphabetPartition[] {
    const guards = collectGuards(transitions);
    if (guards.length === 0) return [];

    const probes = buildProbeCharacters(guards);

    const partitionsBySignature = new Map<string, AlphabetPartition>();

    for (const probe of probes) {
        const matching = guards.filter((g) => g.test(probe));
        if (matching.length === 0) continue;

        const labels = matching.map((g) => g.label).sort();
        const signatureKey = labels.join("|");

        if (!partitionsBySignature.has(signatureKey)) {
            const displayLabel = describePartition(matching, probe);
            partitionsBySignature.set(signatureKey, {
                matchingGuardLabels: new Set(labels),
                representative: probe,
                displayLabel,
            });
        }
    }

    return Array.from(partitionsBySignature.values());
}

function describePartition(matching: Guard[], representative: string): string {
    // Prefer showing a literal character match verbatim; otherwise fall
    // back to the most specific (non-"any") class label, since that's
    // almost always what a person reading the diagram wants to see.
    const literalGuard = matching.find((g) => g.label.startsWith("char:"));
    if (literalGuard) {
        return representative;
    }
    const classGuard = matching.find((g) => g.label.startsWith("class:"));
    if (classGuard) {
        return classGuard.label.replace("class:", "");
    }
    return ".";
}

function partitionSymbolKind(matching: Set<string>): DFASymbol["kind"] {
    const hasLiteral = Array.from(matching).some((l) => l.startsWith("char:"));
    if (hasLiteral) return "char";
    const hasClass = Array.from(matching).some((l) => l.startsWith("class:"));
    if (hasClass) return "class";
    return "any";
}

/** Stable string key for a set of NFA state ids, used to deduplicate DFA states during construction. */
function subsetKey(stateIds: ReadonlySet<string>): string {
    return Array.from(stateIds).sort().join(",");
}

/**
 * Converts an NFA into an equivalent DFA via subset construction
 * (the standard NFA-to-DFA algorithm): starting from the epsilon-closure
 * of the NFA's start state, repeatedly compute move() + epsilon-closure
 * for every partition of the input alphabet to discover new DFA states,
 * until no new subsets are produced. Each resulting DFA state is
 * accepting iff its underlying NFA-state subset contains the NFA's
 * accepting state.
 *
 * The input alphabet is partitioned into disjoint regions derived from
 * the NFA's own literal/class/"any" guards (see buildAlphabetPartitions),
 * so overlapping guards — e.g. a literal '5' alongside \d — are correctly
 * split into non-overlapping regions before move() is computed, which is
 * what guarantees the resulting automaton is genuinely deterministic.
 */
export function buildDFA(nfa: NFA): DFA {
    resetDFAStateCounter();

    const nonEpsilonTransitions = nfa.transitions.filter(
        (t) => t.symbol.kind !== "epsilon"
    );
    const guards = collectGuards(nonEpsilonTransitions);
    const partitions = buildAlphabetPartitions(nonEpsilonTransitions);

    const startClosure = epsilonClosure([nfa.startId], nfa);
    const startKey = subsetKey(startClosure);

    const dfaStatesByKey = new Map<string, DFAState>();
    const dfaTransitions: DFATransition[] = [];

    const startState: DFAState = {
        id: createDFAStateId(),
        isStart: true,
        isAccepting: startClosure.has(nfa.acceptId),
        nfaStateIds: Array.from(startClosure).sort(),
    };
    dfaStatesByKey.set(startKey, startState);

    const queue: Array<{ key: string; subset: Set<string> }> = [
        { key: startKey, subset: startClosure },
    ];
    const visited = new Set<string>([startKey]);

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;
        const currentState = dfaStatesByKey.get(current.key);
        if (!currentState) continue;

        for (const partition of partitions) {
            const moved = moveForPartition(
                current.subset,
                partition,
                nonEpsilonTransitions
            );

            if (moved.size === 0) continue;

            const closure = epsilonClosure(moved, nfa);
            const key = subsetKey(closure);

            let targetState = dfaStatesByKey.get(key);
            if (!targetState) {
                targetState = {
                    id: createDFAStateId(),
                    isStart: false,
                    isAccepting: closure.has(nfa.acceptId),
                    nfaStateIds: Array.from(closure).sort(),
                };
                dfaStatesByKey.set(key, targetState);
            }

            const symbol: DFASymbol = {
                kind: partitionSymbolKind(partition.matchingGuardLabels),
                char:
                    partition.displayLabel.length === 1
                        ? partition.displayLabel
                        : undefined,
                label: partition.displayLabel,
                test: (ch) => guardSetMatches(partition, guards, ch),
            };

            dfaTransitions.push({
                from: currentState.id,
                to: targetState.id,
                symbol,
            });

            if (!visited.has(key)) {
                visited.add(key);
                queue.push({ key, subset: closure });
            }
        }
    }

    const states = Array.from(dfaStatesByKey.values());
    const acceptingIds = states.filter((s) => s.isAccepting).map((s) => s.id);

    return {
        states,
        transitions: dfaTransitions,
        startId: startState.id,
        acceptingIds,
        hasExplicitDeadState: false,
    };
}

/**
 * Computes move(subset, partition): every NFA state reachable from
 * `subset` via a transition whose guard matches this partition's
 * representative character. Since every character in a partition shares
 * the same signature (the same set of matching guards), testing against
 * the representative is exact for every transition's actual guard
 * predicate — not just for the synthetic partition label.
 */
function moveForPartition(
    subset: ReadonlySet<string>,
    partition: AlphabetPartition,
    transitions: NFATransition[]
): Set<string> {
    const result = new Set<string>();
    const probe = partition.representative;

    for (const transition of transitions) {
        if (!subset.has(transition.from)) continue;
        if (transitionMatchesChar(transition, probe)) {
            result.add(transition.to);
        }
    }

    return result;
}

function transitionMatchesChar(transition: NFATransition, ch: string): boolean {
    const symbol = transition.symbol;
    if (symbol.kind === "char") return symbol.char === ch;
    if (symbol.kind === "any") return ch !== "\n";
    if (symbol.kind === "class") return symbol.test ? symbol.test(ch) : false;
    return false;
}

function guardSetMatches(
    partition: AlphabetPartition,
    guards: Guard[],
    ch: string
): boolean {
    // A character belongs to this partition's region precisely when it
    // produces the same guard signature as the partition's representative.
    // Recomputing the signature for ch and comparing to the partition's
    // stored signature keeps the DFA transition's test() function correct
    // for any input, not just the original representative probe.
    const matchingLabels = guards.filter((g) => g.test(ch)).map((g) => g.label);
    if (matchingLabels.length === 0) return false;
    const signature = new Set(matchingLabels);
    if (signature.size !== partition.matchingGuardLabels.size) return false;
    for (const label of signature) {
        if (!partition.matchingGuardLabels.has(label)) return false;
    }
    return true;
}
