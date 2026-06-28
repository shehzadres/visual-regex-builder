import type { DFA } from "./dfaTypes";
import type { AutomatonGraph, GraphEdge, GraphNode } from "./nfaGraph";

/**
 * Computes a BFS layer for every DFA state, used to seed initial
 * x-positions so the force simulation starts from a left-to-right layout
 * that already roughly resembles the automaton's structure.
 */
function computeLayers(dfa: DFA): Map<string, number> {
    const layers = new Map<string, number>();
    layers.set(dfa.startId, 0);

    const queue: string[] = [dfa.startId];
    const adjacency = new Map<string, string[]>();

    for (const transition of dfa.transitions) {
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

    let maxLayer = 0;
    for (const value of layers.values()) {
        maxLayer = Math.max(maxLayer, value);
    }
    for (const state of dfa.states) {
        if (!layers.has(state.id)) {
            layers.set(state.id, maxLayer + 1);
        }
    }

    return layers;
}

/**
 * Converts a DFA (constructed or minimized) into the same graph shape
 * used for NFA rendering, so the existing D3 graph view component can
 * render either without modification. Each node's `groupLabel` is set to
 * the originating NFA-subset name (e.g. "{q0,q2}") so the diagram can
 * show subset-construction provenance on hover/inspection.
 */
export function dfaToGraph(dfa: DFA): AutomatonGraph {
    const layers = computeLayers(dfa);

    const nodes: GraphNode[] = dfa.states.map((state) => ({
        id: state.id,
        isStart: state.isStart,
        isAccepting: state.isAccepting,
        groupLabel:
            state.nfaStateIds.length > 0
                ? `{${state.nfaStateIds.join(",")}}`
                : undefined,
        layer: layers.get(state.id) ?? 0,
    }));

    const edges: GraphEdge[] = dfa.transitions.map((transition, index) => ({
        id: `e${index}-${transition.from}-${transition.to}-${transition.symbol.label}`,
        source: transition.from,
        target: transition.to,
        label: transition.symbol.label,
        isEpsilon: false,
        isSelfLoop: transition.from === transition.to,
    }));

    return {
        nodes,
        edges,
        startId: dfa.startId,
        acceptId: dfa.acceptingIds[0] ?? dfa.startId,
    };
}
