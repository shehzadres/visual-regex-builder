import { useMemo } from "react";
import { TreeDeciduous } from "lucide-react";
import { useRegexAutomaton } from "../../hooks/useRegexAutomaton";
import ASTViewer from "./ASTViewer";
import EmptyState from "../../design-system/EmptyState";

export default function ASTTab() {
  const { pattern, isValid, error, ast } = useRegexAutomaton();
  const metrics = useMemo(() => {
    if (!ast) return { nodes: 0, depth: 0 };
    let nodes = 0;
    let depth = 0;
    const visit = (node: typeof ast, level: number) => {
      if (!node) return;
      nodes += 1;
      depth = Math.max(depth, level);
      const children = "children" in node ? node.children : "options" in node ? node.options : "child" in node ? [node.child] : [];
      children.forEach((child) => visit(child, level + 1));
    };
    visit(ast, 1);
    return { nodes, depth };
  }, [ast]);

  if (pattern === "") return <div className="tool-empty-wrap"><EmptyState icon={<TreeDeciduous className="w-5 h-5" />} title="Nothing parsed yet" description="Compose a pattern first. Its parsed structure will appear here as an inspectable syntax tree." /></div>;

  return <section className="tool-view ast-view">
    <header className="tool-view-head">
      <div><span className="tool-eyebrow">02 / PARSER OUTPUT</span><h1>Syntax tree</h1><p>The expression, resolved into its grammatical structure.</p></div>
      <div className="tool-metrics"><div><strong>{metrics.nodes}</strong><span>NODES</span></div><div><strong>{metrics.depth}</strong><span>DEPTH</span></div><div><strong>{isValid ? "Valid" : "Error"}</strong><span>PARSE</span></div></div>
    </header>
    <div className="tool-code-strip"><span>REGEX</span><code>/{pattern}/</code><span className={isValid ? "tool-state-ok" : "tool-state-error"}>{isValid ? "PARSED" : "INVALID"}</span></div>
    <div className="tool-panel ast-tree-panel">
      <div className="tool-panel-head"><div><span className="tool-panel-index">A</span><strong>Abstract syntax tree</strong></div><span>ROOT → LEAF</span></div>
      <div className="ast-tree-content"><ASTViewer ast={ast} isValid={isValid} error={error} /></div>
    </div>
  </section>;
}
