import { useState } from "react";
import type { AutomatonGraph } from "../../engine/automata/nfaGraph";
import NFAGraphView from "./NFAGraphView";
import Tabs from "../../design-system/Tabs";

type ViewMode = "nfa" | "dfa" | "minimized" | "side-by-side";

interface AutomatonGraphSwitcherProps {
    nfaGraph: AutomatonGraph;
    dfaGraph: AutomatonGraph;
    minimizedDfaGraph: AutomatonGraph;
    activeStateIds: Set<string>;
    activeEdgeIds: Set<string>;
    minimizedActiveStateIds: Set<string>;
    minimizedActiveEdgeIds: Set<string>;
}

const EMPTY_SET: Set<string> = new Set();

export default function AutomatonGraphSwitcher({
    nfaGraph,
    dfaGraph,
    minimizedDfaGraph,
    activeStateIds,
    activeEdgeIds,
    minimizedActiveStateIds,
    minimizedActiveEdgeIds,
}: AutomatonGraphSwitcherProps) {
    const [mode, setMode] = useState<ViewMode>("dfa");

    return (
        <div className="flex flex-col gap-3">
            <Tabs
                size="sm"
                value={mode}
                onChange={setMode}
                items={[
                    { value: "nfa", label: "NFA" },
                    { value: "dfa", label: "DFA" },
                    { value: "minimized", label: "Minimized DFA" },
                    { value: "side-by-side", label: "Side by side" },
                ]}
                className="bg-surface rounded-lg p-1 border border-border-subtle w-fit"
            />

            {mode === "side-by-side" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-text-tertiary">
                            NFA ({nfaGraph.nodes.length} states)
                        </span>
                        <div className="h-[360px]">
                            <NFAGraphView
                                graph={nfaGraph}
                                activeStateIds={activeStateIds}
                                activeEdgeIds={activeEdgeIds}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-text-tertiary">
                            Minimized DFA ({minimizedDfaGraph.nodes.length}{" "}
                            states)
                        </span>
                        <div className="h-[360px]">
                            <NFAGraphView
                                graph={minimizedDfaGraph}
                                activeStateIds={minimizedActiveStateIds}
                                activeEdgeIds={minimizedActiveEdgeIds}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-[460px]">
                    {mode === "nfa" && (
                        <NFAGraphView
                            graph={nfaGraph}
                            activeStateIds={activeStateIds}
                            activeEdgeIds={activeEdgeIds}
                        />
                    )}
                    {mode === "dfa" && (
                        <NFAGraphView
                            graph={dfaGraph}
                            activeStateIds={EMPTY_SET}
                            activeEdgeIds={EMPTY_SET}
                        />
                    )}
                    {mode === "minimized" && (
                        <NFAGraphView
                            graph={minimizedDfaGraph}
                            activeStateIds={minimizedActiveStateIds}
                            activeEdgeIds={minimizedActiveEdgeIds}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
