import type { NFA } from "./nfaTypes";

export interface GraphNode {
    id: string;
    isStart: boolean;
    isAccepting: boolean;
    groupLabel?: string;
    /** Layer index from a BFS over non-epsilon-first traversal, used as the initial x position before force simulation settles. */
    layer: number;
    /** Mutable position fields filled in by the D3 force/zoom simulation; present here so the same object can be reused as a D3 simulation node. */
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    label: string;
    isEpsilon: boolean;
    /** True when source === target, so the renderer can draw a self-loop instead of a straight/curved line. */
    isSelfLoop: boolean;
}

export interface AutomatonGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
    startId: string;
    acceptId: string;
}

/**
 * Computes a BFS layer for every state, used to seed initial x-positions
 * so the force simulation starts from a left-to-right layout that already
 * roughly resembles the automaton's structure instead of a random scatter.
 */
function computeLayers(nfa: NFA): Map<string, number> {
    const layers = new Map<string, number>();
    layers.set(nfa.startId, 0);

    const queue: string[] = [nfa.startId];
    const adjacency = new Map<string, string[]>();

    for (const transition of nfa.transitions) {
        const list = adjacency.get(transition.from) ?? [];
        list.push(transition.to);
        adjacency.set(transition.from, list);
    }

    while (queue.length > 0) {
        const current = queue.shift();
        if (current === undefined) continue;
        const currentLayer = layers.get(current) ?? 0;

        for (const next of adjacency.get(current) ?? []) {
            const existing = layers.get(next);
            if (existing === undefined || existing > currentLayer + 1) {
                layers.set(next, currentLayer + 1);
                queue.push(next);
            }
        }
    }

    // Any states unreachable via forward traversal (shouldn't normally
    // happen for a well-formed Thompson construction, but guarded for
    // safety) get placed at the end.
    let maxLayer = 0;
    for (const value of layers.values()) {
        maxLayer = Math.max(maxLayer, value);
    }
    for (const state of nfa.states) {
        if (!layers.has(state.id)) {
            layers.set(state.id, maxLayer + 1);
        }
    }

    return layers;
}

function symbolLabel(symbol: NFA["transitions"][number]["symbol"]): string {
    switch (symbol.kind) {
        case "epsilon":
            return "ε";
        case "char":
            return symbol.char ?? "";
        case "any":
            return ".";
        case "class":
            return symbol.classLabel ?? "";
        default:
            return "";
    }
}

/**
 * Converts an NFA produced by Thompson's construction into a graph shape
 * that the D3 force/zoom renderer can consume directly: plain node/edge
 * arrays with stable ids, human-readable transition labels, and an initial
 * BFS-layer position hint so the layout starts in a sensible spot.
 */
export function nfaToGraph(nfa: NFA): AutomatonGraph {
    const layers = computeLayers(nfa);

    const nodes: GraphNode[] = nfa.states.map((state) => ({
        id: state.id,
        isStart: state.isStart,
        isAccepting: state.isAccepting,
        groupLabel: state.groupLabel,
        layer: layers.get(state.id) ?? 0,
    }));

    const edges: GraphEdge[] = nfa.transitions.map((transition, index) => ({
        id: `e${index}-${transition.from}-${transition.to}`,
        source: transition.from,
        target: transition.to,
        label: symbolLabel(transition.symbol),
        isEpsilon: transition.symbol.kind === "epsilon",
        isSelfLoop: transition.from === transition.to,
    }));

    return {
        nodes,
        edges,
        startId: nfa.startId,
        acceptId: nfa.acceptId,
    };
}
