import type { ASTNode, CharClassMember } from "../ast/astTypes";
import {
    createStateId,
    resetStateCounter,
    type NFA,
    type NFAState,
    type NFATransition,
    type TransitionSymbol,
} from "./nfaTypes";

/**
 * A fragment is an in-progress piece of NFA with exactly one dangling
 * start state and one dangling accept state, per Thompson's construction.
 * Fragments are combined (concatenation, alternation, closure) by wiring
 * their start/accept states together with epsilon transitions.
 */
interface Fragment {
    start: string;
    accept: string;
}

class NFABuilder {
    states = new Map<string, NFAState>();
    transitions: NFATransition[] = [];

    addState(): string {
        const id = createStateId();
        this.states.set(id, {
            id,
            isStart: false,
            isAccepting: false,
        });
        return id;
    }

    addTransition(from: string, to: string, symbol: TransitionSymbol): void {
        this.transitions.push({ from, to, symbol });
    }

    epsilon(from: string, to: string): void {
        this.addTransition(from, to, { kind: "epsilon" });
    }
}

function digitTest(ch: string): boolean {
    return ch >= "0" && ch <= "9";
}

function wordTest(ch: string): boolean {
    return /^[A-Za-z0-9_]$/.test(ch);
}

function whitespaceTest(ch: string): boolean {
    return /^\s$/.test(ch);
}

function escapedClassSymbol(letter: string): TransitionSymbol {
    switch (letter) {
        case "d":
            return { kind: "class", classLabel: "\\d", test: digitTest };
        case "D":
            return { kind: "class", classLabel: "\\D", test: (c) => !digitTest(c) };
        case "w":
            return { kind: "class", classLabel: "\\w", test: wordTest };
        case "W":
            return { kind: "class", classLabel: "\\W", test: (c) => !wordTest(c) };
        case "s":
            return { kind: "class", classLabel: "\\s", test: whitespaceTest };
        case "S":
            return {
                kind: "class",
                classLabel: "\\S",
                test: (c) => !whitespaceTest(c),
            };
        default:
            return { kind: "class", classLabel: `\\${letter}`, test: () => false };
    }
}

function charClassMemberTest(
    member: CharClassMember
): (ch: string) => boolean {
    switch (member.kind) {
        case "char":
            return (ch) => ch === member.value;
        case "range":
            return (ch) => ch >= member.from && ch <= member.to;
        case "escapedClass": {
            const symbol = escapedClassSymbol(member.letter);
            return symbol.test ?? (() => false);
        }
        default:
            return () => false;
    }
}

function charClassLabel(
    negated: boolean,
    members: CharClassMember[]
): string {
    const inner = members
        .map((m) => {
            if (m.kind === "char") return m.value;
            if (m.kind === "range") return `${m.from}-${m.to}`;
            return `\\${m.letter}`;
        })
        .join("");
    return `[${negated ? "^" : ""}${inner}]`;
}

/**
 * Builds a single NFA fragment for one AST node, recursively combining
 * child fragments according to Thompson's construction rules:
 * - Literal/AnyChar/EscapedClass/CharClass: a single transition between
 *   two fresh states.
 * - Concat: chain fragments with epsilon transitions, accept(i) -> start(i+1).
 * - Alternation: a new start state epsilon-branches into each option's
 *   start, and each option's accept epsilon-joins a new shared accept state.
 * - Group: structurally transparent — wraps the child fragment with
 *   epsilon transitions so the group's boundaries are visible in the
 *   graph without changing matching semantics.
 * - Quantifier (*, +, ?, {n,m}): built from repeated copies of the child
 *   fragment plus epsilon loops/skips as appropriate.
 */
function buildFragment(node: ASTNode, builder: NFABuilder): Fragment {
    switch (node.type) {
        case "Empty": {
            const start = builder.addState();
            const accept = builder.addState();
            builder.epsilon(start, accept);
            return { start, accept };
        }

        case "Literal": {
            const start = builder.addState();
            const accept = builder.addState();
            builder.addTransition(start, accept, {
                kind: "char",
                char: node.value,
            });
            return { start, accept };
        }

        case "AnyChar": {
            const start = builder.addState();
            const accept = builder.addState();
            builder.addTransition(start, accept, { kind: "any" });
            return { start, accept };
        }

        case "EscapedClass": {
            const start = builder.addState();
            const accept = builder.addState();
            builder.addTransition(
                start,
                accept,
                escapedClassSymbol(node.letter)
            );
            return { start, accept };
        }

        case "CharClass": {
            const start = builder.addState();
            const accept = builder.addState();
            const tests = node.members.map(charClassMemberTest);
            const label = charClassLabel(node.negated, node.members);
            const test = (ch: string) => {
                const matchesAny = tests.some((t) => t(ch));
                return node.negated ? !matchesAny : matchesAny;
            };
            builder.addTransition(start, accept, {
                kind: "class",
                classLabel: label,
                test,
            });
            return { start, accept };
        }

        case "Concat": {
            if (node.children.length === 0) {
                return buildFragment({ type: "Empty" }, builder);
            }
            const fragments = node.children.map((child) =>
                buildFragment(child, builder)
            );
            for (let i = 0; i < fragments.length - 1; i++) {
                builder.epsilon(fragments[i].accept, fragments[i + 1].start);
            }
            return {
                start: fragments[0].start,
                accept: fragments[fragments.length - 1].accept,
            };
        }

        case "Alternation": {
            const start = builder.addState();
            const accept = builder.addState();
            for (const option of node.options) {
                const fragment = buildFragment(option, builder);
                builder.epsilon(start, fragment.start);
                builder.epsilon(fragment.accept, accept);
            }
            return { start, accept };
        }

        case "Group": {
            const inner = buildFragment(node.child, builder);
            const start = builder.addState();
            const accept = builder.addState();
            const groupLabel = node.capturing
                ? node.name
                    ? `<${node.name}>`
                    : `(${node.groupIndex ?? ""})`
                : "(?:)";

            const startState = builder.states.get(start);
            const acceptState = builder.states.get(accept);
            if (startState) startState.groupLabel = `${groupLabel} start`;
            if (acceptState) acceptState.groupLabel = `${groupLabel} end`;

            builder.epsilon(start, inner.start);
            builder.epsilon(inner.accept, accept);
            return { start, accept };
        }

        case "Quantifier":
            return buildQuantifierFragment(node, builder);

        default:
            return buildFragment({ type: "Empty" }, builder);
    }
}

function buildQuantifierFragment(
    node: Extract<ASTNode, { type: "Quantifier" }>,
    builder: NFABuilder
): Fragment {
    if (node.kind === "*") {
        const start = builder.addState();
        const accept = builder.addState();
        const inner = buildFragment(node.child, builder);
        builder.epsilon(start, inner.start);
        builder.epsilon(start, accept);
        builder.epsilon(inner.accept, inner.start);
        builder.epsilon(inner.accept, accept);
        return { start, accept };
    }

    if (node.kind === "+") {
        const inner = buildFragment(node.child, builder);
        const accept = builder.addState();
        builder.epsilon(inner.accept, inner.start);
        builder.epsilon(inner.accept, accept);
        return { start: inner.start, accept };
    }

    if (node.kind === "?") {
        const start = builder.addState();
        const accept = builder.addState();
        const inner = buildFragment(node.child, builder);
        builder.epsilon(start, inner.start);
        builder.epsilon(start, accept);
        builder.epsilon(inner.accept, accept);
        return { start, accept };
    }

    // Counted range {min,max} / {min,}. Built as `min` mandatory copies
    // followed by either (max - min) optional copies, or — when max is
    // unbounded — a final '*'-style loop.
    const { min, max } = node;

    const mandatoryFragments: Fragment[] = [];
    for (let i = 0; i < min; i++) {
        mandatoryFragments.push(buildFragment(node.child, builder));
    }

    if (max === null) {
        // {min,} === min mandatory copies followed by a star of the child.
        const starFragment = buildQuantifierFragment(
            { type: "Quantifier", child: node.child, kind: "*", min: 0, max: null },
            builder
        );

        if (mandatoryFragments.length === 0) {
            return starFragment;
        }

        for (let i = 0; i < mandatoryFragments.length - 1; i++) {
            builder.epsilon(
                mandatoryFragments[i].accept,
                mandatoryFragments[i + 1].start
            );
        }
        builder.epsilon(
            mandatoryFragments[mandatoryFragments.length - 1].accept,
            starFragment.start
        );

        return {
            start: mandatoryFragments[0].start,
            accept: starFragment.accept,
        };
    }

    const optionalCount = Math.max(0, max - min);
    const optionalFragments: Fragment[] = [];
    for (let i = 0; i < optionalCount; i++) {
        optionalFragments.push(buildFragment(node.child, builder));
    }

    const allFragments = [...mandatoryFragments, ...optionalFragments];

    if (allFragments.length === 0) {
        // {0} / {0,0} — matches only the empty string.
        return buildFragment({ type: "Empty" }, builder);
    }

    for (let i = 0; i < allFragments.length - 1; i++) {
        builder.epsilon(allFragments[i].accept, allFragments[i + 1].start);
    }

    const finalAccept = builder.addState();
    builder.epsilon(
        allFragments[allFragments.length - 1].accept,
        finalAccept
    );

    // Each optional fragment's start can be skipped directly to the end,
    // making every copy after the mandatory ones independently optional.
    for (const optional of optionalFragments) {
        builder.epsilon(optional.start, finalAccept);
    }

    return { start: allFragments[0].start, accept: finalAccept };
}

/**
 * Converts a regex AST into an NFA using Thompson's construction.
 * The resulting NFA's states/transitions are suitable both for direct
 * simulation and for conversion into a renderable graph.
 */
export function buildNFA(ast: ASTNode): NFA {
    resetStateCounter();
    const builder = new NFABuilder();
    const fragment = buildFragment(ast, builder);

    const startState = builder.states.get(fragment.start);
    const acceptState = builder.states.get(fragment.accept);
    if (startState) startState.isStart = true;
    if (acceptState) acceptState.isAccepting = true;

    return {
        states: Array.from(builder.states.values()),
        transitions: builder.transitions,
        startId: fragment.start,
        acceptId: fragment.accept,
    };
}
