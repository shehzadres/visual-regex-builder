import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import type {
    AutomatonGraph,
    GraphEdge,
    GraphNode,
} from "../../engine/automata/nfaGraph";
import Button from "../../design-system/Button";

interface NFAGraphViewProps {
    graph: AutomatonGraph;
    /** State ids currently "live" during simulation playback; highlighted distinctly. */
    activeStateIds: Set<string>;
    /** Edge ids that fired on the most recent simulation step; highlighted distinctly. */
    activeEdgeIds: Set<string>;
}

type SimNode = GraphNode & d3.SimulationNodeDatum;
type SimLink = Omit<GraphEdge, "source" | "target"> & {
    source: string | SimNode;
    target: string | SimNode;
};

const NODE_RADIUS = 22;
const WIDTH = 820;
const HEIGHT = 480;

const COLOR_DEFAULT_FILL = "#171b23";
const COLOR_DEFAULT_STROKE = "#3a4153";
const COLOR_START_STROKE = "#6c84ff";
const COLOR_ACCEPT_STROKE = "#3ad68c";
const COLOR_ACTIVE_FILL = "#efb446";
const COLOR_ACTIVE_STROKE = "#d2932a";
const COLOR_EDGE_DEFAULT = "#3a4153";
const COLOR_EDGE_EPSILON = "#2d3340";
const COLOR_EDGE_ACTIVE = "#efb446";
const COLOR_LABEL_DEFAULT = "#97a0b3";
const COLOR_LABEL_EPSILON = "#5c6577";

export default function NFAGraphView({
    graph,
    activeStateIds,
    activeEdgeIds,
}: NFAGraphViewProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
    const zoomBehaviorRef = useRef<d3.ZoomBehavior<
        SVGSVGElement,
        unknown
    > | null>(null);
    const highlightRef = useRef<{
        updateHighlight: (active: Set<string>, activeEdges: Set<string>) => void;
    } | null>(null);
    const [zoomPercent, setZoomPercent] = useState(100);

    // Full (re)build of the graph whenever its structure changes (i.e. the
    // pattern changed and produced a different NFA). Highlighting alone is
    // handled by a separate, cheaper effect below so playback animation
    // doesn't tear down and restart the force simulation every frame.
    useEffect(() => {
        const svgEl = svgRef.current;
        if (!svgEl) return;

        const svg = d3.select(svgEl);
        svg.selectAll("*").remove();

        const zoomRoot = svg.append("g").attr("class", "zoom-root");

        const defs = svg.append("defs");

        defs
            .append("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 9)
            .attr("refY", 5)
            .attr("markerWidth", 6.5)
            .attr("markerHeight", 6.5)
            .attr("orient", "auto-start-reverse")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z")
            .attr("fill", COLOR_EDGE_DEFAULT);

        defs
            .append("marker")
            .attr("id", "arrow-active")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 9)
            .attr("refY", 5)
            .attr("markerWidth", 6.5)
            .attr("markerHeight", 6.5)
            .attr("orient", "auto-start-reverse")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z")
            .attr("fill", COLOR_EDGE_ACTIVE);

        const zoomBehavior = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.25, 3.5])
            .on("zoom", (event) => {
                zoomRoot.attr("transform", event.transform.toString());
                setZoomPercent(Math.round(event.transform.k * 100));
            });

        svg.call(zoomBehavior);
        zoomBehaviorRef.current = zoomBehavior;

        const maxLayer = Math.max(1, ...graph.nodes.map((n) => n.layer));
        const nodes: SimNode[] = graph.nodes.map((node) => ({
            ...node,
            x: 70 + (node.layer / maxLayer) * (WIDTH - 140),
            y: HEIGHT / 2 + (Math.random() - 0.5) * 140,
        }));

        const nodeById = new Map(nodes.map((n) => [n.id, n]));

        const links: SimLink[] = graph.edges
            .filter((edge) => !edge.isSelfLoop)
            .map((edge) => ({
                ...edge,
                source: nodeById.get(edge.source) ?? edge.source,
                target: nodeById.get(edge.target) ?? edge.target,
            }));

        const selfLoops = graph.edges.filter((edge) => edge.isSelfLoop);

        const simulation = d3
            .forceSimulation(nodes)
            .force(
                "link",
                d3
                    .forceLink<SimNode, SimLink>(links)
                    .id((d) => d.id)
                    .distance(110)
                    .strength(0.4)
            )
            .force("charge", d3.forceManyBody().strength(-280))
            .force(
                "x",
                d3
                    .forceX<SimNode>(
                        (d) => 70 + (d.layer / maxLayer) * (WIDTH - 140)
                    )
                    .strength(0.25)
            )
            .force("y", d3.forceY<SimNode>(HEIGHT / 2).strength(0.08))
            .force("collide", d3.forceCollide<SimNode>(NODE_RADIUS + 10));

        simulationRef.current = simulation;

        const linkGroup = zoomRoot.append("g").attr("class", "links");
        const linkSelection = linkGroup
            .selectAll<SVGGElement, SimLink>("g.link")
            .data(links)
            .join("g")
            .attr("class", "link");

        linkSelection
            .append("path")
            .attr("class", "link-path")
            .attr("fill", "none")
            .attr("stroke", (d) =>
                d.isEpsilon ? COLOR_EDGE_EPSILON : COLOR_EDGE_DEFAULT
            )
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", (d) => (d.isEpsilon ? "4,3" : "none"))
            .attr("marker-end", "url(#arrow)")
            .attr(
                "style",
                "transition: stroke var(--duration-base) var(--ease-out), stroke-width var(--duration-base) var(--ease-out)"
            );

        const linkLabels = linkSelection
            .append("text")
            .attr("class", "link-label")
            .attr("text-anchor", "middle")
            .attr("font-size", 11)
            .attr("font-family", "JetBrains Mono, ui-monospace, monospace")
            .attr("fill", (d) =>
                d.isEpsilon ? COLOR_LABEL_EPSILON : COLOR_LABEL_DEFAULT
            )
            .text((d) => d.label);

        // Self-loops are drawn as fixed small arcs above their node and
        // updated in the same tick handler.
        const selfLoopGroup = zoomRoot.append("g").attr("class", "self-loops");
        const selfLoopSelection = selfLoopGroup
            .selectAll<SVGGElement, GraphEdge>("g.self-loop")
            .data(selfLoops)
            .join("g")
            .attr("class", "self-loop");

        selfLoopSelection
            .append("path")
            .attr("class", "self-loop-path")
            .attr("fill", "none")
            .attr("stroke", (d) =>
                d.isEpsilon ? COLOR_EDGE_EPSILON : COLOR_EDGE_DEFAULT
            )
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", (d) => (d.isEpsilon ? "4,3" : "none"))
            .attr("marker-end", "url(#arrow)");

        selfLoopSelection
            .append("text")
            .attr("class", "self-loop-label")
            .attr("text-anchor", "middle")
            .attr("font-size", 11)
            .attr("font-family", "JetBrains Mono, ui-monospace, monospace")
            .attr("fill", COLOR_LABEL_DEFAULT)
            .text((d) => d.label);

        const nodeGroup = zoomRoot.append("g").attr("class", "nodes");
        const nodeSelection = nodeGroup
            .selectAll<SVGGElement, SimNode>("g.node")
            .data(nodes)
            .join("g")
            .attr("class", "node")
            .style("cursor", "grab")
            .call(
                d3
                    .drag<SVGGElement, SimNode>()
                    .on("start", (event, d) => {
                        if (!event.active) simulation.alphaTarget(0.3).restart();
                        d.fx = d.x;
                        d.fy = d.y;
                    })
                    .on("drag", (event, d) => {
                        d.fx = event.x;
                        d.fy = event.y;
                    })
                    .on("end", (event, d) => {
                        if (!event.active) simulation.alphaTarget(0);
                        d.fx = null;
                        d.fy = null;
                    })
            );

        // Outer ring marks accepting states (double-circle convention).
        nodeSelection
            .filter((d) => d.isAccepting)
            .append("circle")
            .attr("class", "accept-ring")
            .attr("r", NODE_RADIUS + 5)
            .attr("fill", "none")
            .attr("stroke", COLOR_ACCEPT_STROKE)
            .attr("stroke-width", 2);

        nodeSelection
            .append("circle")
            .attr("class", "node-circle")
            .attr("r", NODE_RADIUS)
            .attr("fill", COLOR_DEFAULT_FILL)
            .attr("stroke", (d) =>
                d.isStart ? COLOR_START_STROKE : COLOR_DEFAULT_STROKE
            )
            .attr("stroke-width", (d) => (d.isStart ? 2.5 : 1.5))
            .attr(
                "style",
                "transition: fill var(--duration-base) var(--ease-out), stroke var(--duration-base) var(--ease-out)"
            );

        // Start-state indicator: a short arrow pointing into the node from the left.
        nodeSelection
            .filter((d) => d.isStart)
            .append("path")
            .attr("class", "start-arrow")
            .attr("d", `M ${-NODE_RADIUS - 26} 0 L ${-NODE_RADIUS - 2} 0`)
            .attr("stroke", COLOR_START_STROKE)
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#arrow)");

        nodeSelection
            .append("text")
            .attr("class", "node-label")
            .attr("text-anchor", "middle")
            .attr("dy", "0.32em")
            .attr("font-size", 11)
            .attr("font-family", "JetBrains Mono, ui-monospace, monospace")
            .attr("font-weight", 500)
            .attr("fill", "#e8eaf0")
            .style("pointer-events", "none")
            .text((d) => d.id);

        nodeSelection
            .filter((d) => Boolean(d.groupLabel))
            .append("text")
            .attr("class", "node-group-label")
            .attr("text-anchor", "middle")
            .attr("dy", -(NODE_RADIUS + 12))
            .attr("font-size", 9)
            .attr("font-family", "JetBrains Mono, ui-monospace, monospace")
            .attr("fill", "#aabcff")
            .style("pointer-events", "none")
            .text((d) => d.groupLabel ?? "");

        // Hover tooltip: a small floating label group, toggled on
        // pointerenter/leave, showing the state's id and role.
        const tooltip = zoomRoot
            .append("g")
            .attr("class", "node-tooltip")
            .style("opacity", 0)
            .style("pointer-events", "none");

        const tooltipRect = tooltip
            .append("rect")
            .attr("rx", 6)
            .attr("fill", "#1d212b")
            .attr("stroke", "#343b4a")
            .attr("stroke-width", 1);

        const tooltipText = tooltip
            .append("text")
            .attr("font-size", 10.5)
            .attr("font-family", "JetBrains Mono, ui-monospace, monospace")
            .attr("fill", "#e8eaf0")
            .attr("dy", "0.32em");

        nodeSelection
            .on("pointerenter", (_event, d) => {
                const roleParts: string[] = [];
                if (d.isStart) roleParts.push("start");
                if (d.isAccepting) roleParts.push("accepting");
                const roleLabel =
                    roleParts.length > 0 ? roleParts.join(", ") : "intermediate";
                const label = `${d.id} · ${roleLabel}`;
                tooltipText.text(label);
                const bbox = (tooltipText.node() as SVGTextElement).getBBox();
                tooltipRect
                    .attr("x", -bbox.width / 2 - 8)
                    .attr("y", -bbox.height / 2 - 5)
                    .attr("width", bbox.width + 16)
                    .attr("height", bbox.height + 10);
                tooltip
                    .attr(
                        "transform",
                        `translate(${d.x ?? 0}, ${(d.y ?? 0) - NODE_RADIUS - 26})`
                    )
                    .transition()
                    .duration(120)
                    .style("opacity", 1);
            })
            .on("pointerleave", () => {
                tooltip.transition().duration(120).style("opacity", 0);
            });

        function curvedPath(source: SimNode, target: SimNode): string {
            const dx = (target.x ?? 0) - (source.x ?? 0);
            const dy = (target.y ?? 0) - (source.y ?? 0);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const offsetX = (source.x ?? 0) + (dx * NODE_RADIUS) / dist;
            const offsetY = (source.y ?? 0) + (dy * NODE_RADIUS) / dist;
            const targetX = (target.x ?? 0) - (dx * (NODE_RADIUS + 6)) / dist;
            const targetY = (target.y ?? 0) - (dy * (NODE_RADIUS + 6)) / dist;
            const curveAmount = 22;
            const midX = (offsetX + targetX) / 2 - (dy / dist) * curveAmount;
            const midY = (offsetY + targetY) / 2 + (dx / dist) * curveAmount;
            return `M ${offsetX} ${offsetY} Q ${midX} ${midY} ${targetX} ${targetY}`;
        }

        simulation.on("tick", () => {
            linkSelection
                .select<SVGPathElement>("path.link-path")
                .attr("d", (d) => {
                    const source = d.source as SimNode;
                    const target = d.target as SimNode;
                    return curvedPath(source, target);
                });

            linkLabels.attr("x", (d) => {
                const source = d.source as SimNode;
                const target = d.target as SimNode;
                return ((source.x ?? 0) + (target.x ?? 0)) / 2;
            });
            linkLabels.attr("y", (d) => {
                const source = d.source as SimNode;
                const target = d.target as SimNode;
                const dx = (target.x ?? 0) - (source.x ?? 0);
                const dy = (target.y ?? 0) - (source.y ?? 0);
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                return (
                    ((source.y ?? 0) + (target.y ?? 0)) / 2 -
                    (dx / dist) * 12 -
                    4
                );
            });

            selfLoopSelection
                .select<SVGPathElement>("path.self-loop-path")
                .attr("d", (d) => {
                    const node = nodeById.get(d.source);
                    const x = node?.x ?? 0;
                    const y = node?.y ?? 0;
                    return `M ${x - 6} ${y - NODE_RADIUS} C ${x - 30} ${y - NODE_RADIUS - 40}, ${x + 30} ${y - NODE_RADIUS - 40}, ${x + 6} ${y - NODE_RADIUS}`;
                });

            selfLoopSelection
                .select<SVGTextElement>("text.self-loop-label")
                .attr("x", (d) => nodeById.get(d.source)?.x ?? 0)
                .attr(
                    "y",
                    (d) => (nodeById.get(d.source)?.y ?? 0) - NODE_RADIUS - 44
                );

            nodeSelection.attr(
                "transform",
                (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`
            );
        });

        function applyHighlight(active: Set<string>, activeEdges: Set<string>) {
            nodeSelection
                .select<SVGCircleElement>("circle.node-circle")
                .attr("fill", (d) =>
                    active.has(d.id) ? COLOR_ACTIVE_FILL : COLOR_DEFAULT_FILL
                )
                .attr("stroke", (d) =>
                    active.has(d.id)
                        ? COLOR_ACTIVE_STROKE
                        : d.isStart
                          ? COLOR_START_STROKE
                          : COLOR_DEFAULT_STROKE
                )
                .attr("stroke-width", (d) =>
                    active.has(d.id) ? 3 : d.isStart ? 2.5 : 1.5
                );

            nodeSelection
                .select<SVGTextElement>("text.node-label")
                .attr("fill", (d) => (active.has(d.id) ? "#1a1d24" : "#e8eaf0"));

            linkSelection
                .select<SVGPathElement>("path.link-path")
                .attr("stroke", (d) =>
                    activeEdges.has(d.id)
                        ? COLOR_EDGE_ACTIVE
                        : d.isEpsilon
                          ? COLOR_EDGE_EPSILON
                          : COLOR_EDGE_DEFAULT
                )
                .attr("stroke-width", (d) => (activeEdges.has(d.id) ? 3 : 1.5))
                .attr("marker-end", (d) =>
                    activeEdges.has(d.id)
                        ? "url(#arrow-active)"
                        : "url(#arrow)"
                );

            selfLoopSelection
                .select<SVGPathElement>("path.self-loop-path")
                .attr("stroke", (d) =>
                    activeEdges.has(d.id)
                        ? COLOR_EDGE_ACTIVE
                        : d.isEpsilon
                          ? COLOR_EDGE_EPSILON
                          : COLOR_EDGE_DEFAULT
                )
                .attr("stroke-width", (d) => (activeEdges.has(d.id) ? 3 : 1.5));
        }

        highlightRef.current = { updateHighlight: applyHighlight };
        applyHighlight(activeStateIds, activeEdgeIds);

        // Settle quickly then stop, since this is a static-ish diagram, not
        // a continuously bouncing force simulation.
        simulation.alpha(1).restart();
        const settleTimeout = window.setTimeout(() => {
            simulation.alphaTarget(0);
        }, 800);

        return () => {
            window.clearTimeout(settleTimeout);
            simulation.stop();
            simulationRef.current = null;
            highlightRef.current = null;
        };
        // Deliberately re-running only when the graph's structural identity
        // changes, not on every highlight update — see the effect below for that.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [graph]);

    // Cheap highlight-only update on every simulation step, without
    // rebuilding the force layout.
    useEffect(() => {
        highlightRef.current?.updateHighlight(activeStateIds, activeEdgeIds);
    }, [activeStateIds, activeEdgeIds]);

    const handleZoom = (factor: number) => {
        const svgEl = svgRef.current;
        const zoomBehavior = zoomBehaviorRef.current;
        if (!svgEl || !zoomBehavior) return;
        d3.select(svgEl)
            .transition()
            .duration(200)
            .call(zoomBehavior.scaleBy, factor);
    };

    const handleResetZoom = () => {
        const svgEl = svgRef.current;
        const zoomBehavior = zoomBehaviorRef.current;
        if (!svgEl || !zoomBehavior) return;
        d3.select(svgEl)
            .transition()
            .duration(280)
            .call(zoomBehavior.transform, d3.zoomIdentity);
    };

    return (
        <div className="relative w-full h-full">
            <svg
                ref={svgRef}
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="w-full h-full bg-canvas rounded-lg border border-border-subtle"
                role="img"
                aria-label="NFA state diagram"
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-surface-overlay border border-border-default rounded-md p-1 shadow-sm">
                <Button
                    variant="ghost"
                    size="xs"
                    iconOnly
                    aria-label="Zoom out"
                    icon={<ZoomOut className="w-3.5 h-3.5" />}
                    onClick={() => handleZoom(0.8)}
                />
                <span className="text-[10px] font-mono-tabular text-text-tertiary w-9 text-center">
                    {zoomPercent}%
                </span>
                <Button
                    variant="ghost"
                    size="xs"
                    iconOnly
                    aria-label="Zoom in"
                    icon={<ZoomIn className="w-3.5 h-3.5" />}
                    onClick={() => handleZoom(1.25)}
                />
                <div className="w-px h-4 bg-border-default mx-0.5" />
                <Button
                    variant="ghost"
                    size="xs"
                    iconOnly
                    aria-label="Reset zoom"
                    icon={<Maximize2 className="w-3.5 h-3.5" />}
                    onClick={handleResetZoom}
                />
            </div>
        </div>
    );
}
