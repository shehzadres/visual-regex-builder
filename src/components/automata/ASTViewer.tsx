import { TreeDeciduous, ChevronDown } from "lucide-react";
import type { ASTNode } from "../../engine/ast/astTypes";
import EmptyState from "../../design-system/EmptyState";

interface ASTViewerProps {
    ast: ASTNode | null;
    isValid: boolean;
    error: string | null;
}

export default function ASTViewer({ ast, isValid, error }: ASTViewerProps) {
    if (!isValid || !ast) {
        return (
            <EmptyState
                icon={<TreeDeciduous className="w-5 h-5" />}
                title="No AST to display"
                description={error ?? "Build a pattern to see its syntax tree."}
            />
        );
    }

    return (
        <div className="font-mono-tabular text-xs text-text-primary overflow-x-auto">
            <ASTNodeView node={ast} depth={0} />
        </div>
    );
}

function describeNode(node: ASTNode): {
    label: string;
    detail?: string;
    accent: string;
} {
    switch (node.type) {
        case "Literal":
            return {
                label: "Literal",
                detail: `'${node.value}'`,
                accent: "text-text-primary",
            };
        case "AnyChar":
            return { label: "AnyChar", detail: ".", accent: "text-info-400" };
        case "EscapedClass":
            return {
                label: "EscapedClass",
                detail: `\\${node.letter}`,
                accent: "text-info-300",
            };
        case "CharClass":
            return {
                label: "CharClass",
                detail: `${node.negated ? "negated, " : ""}${node.members.length} member(s)`,
                accent: "text-success-300",
            };
        case "Concat":
            return {
                label: "Concat",
                detail: `${node.children.length} part(s)`,
                accent: "text-text-secondary",
            };
        case "Alternation":
            return {
                label: "Alternation",
                detail: `${node.options.length} option(s)`,
                accent: "text-warning-300",
            };
        case "Group":
            return {
                label: "Group",
                detail: node.name
                    ? `named <${node.name}>`
                    : node.capturing
                      ? `capturing #${node.groupIndex}`
                      : "non-capturing",
                accent: "text-accent-300",
            };
        case "Quantifier": {
            const rangeLabel =
                node.kind === "range"
                    ? `{${node.min}${node.max === null ? "," : node.max === node.min ? "" : `,${node.max}`}}`
                    : node.kind;
            return {
                label: "Quantifier",
                detail: rangeLabel,
                accent: "text-warning-500",
            };
        }
        case "Empty":
            return { label: "Empty", accent: "text-text-tertiary" };
        default:
            return { label: "Unknown", accent: "text-text-tertiary" };
    }
}

function getChildren(node: ASTNode): ASTNode[] {
    switch (node.type) {
        case "Concat":
            return node.children;
        case "Alternation":
            return node.options;
        case "Group":
            return [node.child];
        case "Quantifier":
            return [node.child];
        default:
            return [];
    }
}

function ASTNodeView({ node, depth }: { node: ASTNode; depth: number }) {
    const { label, detail, accent } = describeNode(node);
    const children = getChildren(node);

    return (
        <div>
            <div
                className="flex items-center gap-2 py-1 hover:bg-surface-hover rounded px-1.5 transition-colors duration-[var(--duration-fast)]"
                style={{ paddingLeft: `${depth * 16 + 6}px` }}
            >
                {children.length > 0 ? (
                    <ChevronDown className="w-3 h-3 text-text-tertiary shrink-0" />
                ) : (
                    <span className="w-3 h-3 flex items-center justify-center text-text-disabled shrink-0">
                        ·
                    </span>
                )}
                <span className={`font-semibold ${accent}`}>{label}</span>
                {detail && (
                    <span className="text-text-tertiary">{detail}</span>
                )}
            </div>
            {children.map((child, index) => (
                <ASTNodeView key={index} node={child} depth={depth + 1} />
            ))}
        </div>
    );
}
