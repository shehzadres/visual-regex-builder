import { ChevronDown, TreeDeciduous } from "lucide-react";
import type { CSSProperties } from "react";
import type { ASTNode } from "../../engine/ast/astTypes";
import EmptyState from "../../design-system/EmptyState";

interface ASTViewerProps { ast: ASTNode | null; isValid: boolean; error: string | null; }

export default function ASTViewer({ ast, isValid, error }: ASTViewerProps) {
  if (!isValid || !ast) return <EmptyState icon={<TreeDeciduous className="w-4 h-4" />} title="No syntax tree available" description={error ?? "Build a pattern to inspect its syntax tree."} compact />;
  return <div className="ast-tree-root"><ASTNodeView node={ast} depth={0} path="root" /></div>;
}

function describeNode(node: ASTNode): { label: string; detail?: string; kind: string } {
  switch (node.type) {
    case "Literal": return { label: "Literal", detail: JSON.stringify(node.value), kind: "literal" };
    case "AnyChar": return { label: "Any character", detail: ".", kind: "class" };
    case "EscapedClass": return { label: "Character class", detail: `\\${node.letter}`, kind: "class" };
    case "CharClass": return { label: "Character set", detail: `${node.negated ? "negated · " : ""}${node.members.length} members`, kind: "class" };
    case "Concat": return { label: "Sequence", detail: `${node.children.length} parts`, kind: "operator" };
    case "Alternation": return { label: "Alternation", detail: `${node.options.length} branches`, kind: "operator" };
    case "Group": return { label: node.name ? "Named group" : "Group", detail: node.name ? `<${node.name}>` : node.capturing ? `capture #${node.groupIndex}` : "non-capturing", kind: "group" };
    case "Quantifier": return { label: "Repetition", detail: node.kind === "range" ? `{${node.min},${node.max ?? ""}}` : node.kind, kind: "quantifier" };
    case "Empty": return { label: "Empty", detail: "ε", kind: "muted" };
    default: return { label: "Unknown", kind: "muted" };
  }
}

function getChildren(node: ASTNode): ASTNode[] {
  switch (node.type) {
    case "Concat": return node.children;
    case "Alternation": return node.options;
    case "Group": case "Quantifier": return [node.child];
    default: return [];
  }
}

function ASTNodeView({ node, depth, path }: { node: ASTNode; depth: number; path: string }) {
  const { label, detail, kind } = describeNode(node);
  const children = getChildren(node);
  return <div className="ast-node" style={{ "--tree-depth": depth } as CSSProperties}>
    <div className={`ast-node-row ast-kind-${kind}`}>
      <span className="ast-node-branch">{children.length ? <ChevronDown size={12}/> : <i/>}</span>
      <span className="ast-node-kind">{label}</span>
      {detail && <code>{detail}</code>}
      <span className="ast-node-path">{path}</span>
    </div>
    {children.length > 0 && <div className="ast-node-children">{children.map((child, index) => <ASTNodeView key={`${path}.${index}`} node={child} depth={depth + 1} path={`${path}.${index + 1}`}/>)}</div>}
  </div>;
}
