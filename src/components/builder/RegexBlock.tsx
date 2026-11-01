import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, Trash2, GripVertical } from "lucide-react";
import type { RegexBlock as RegexBlockModel } from "../../types/regex";
import { useRegexStore } from "../../store/regexStore";
import ContextMenu from "../../design-system/ContextMenu";

const BLOCK_LABELS: Record<RegexBlockModel["type"], string> = {
    literal: "Literal",
    digit: "Digit \\d",
    word: "Word \\w",
    whitespace: "Whitespace \\s",
    group: "Group ( )",
    quantifier: "Quantifier",
};

const BLOCK_ACCENTS: Record<RegexBlockModel["type"], string> = {
    literal: "border-border-default bg-canvas text-text-primary",
    digit: "border-border-default bg-surface text-info-600",
    word: "border-border-default bg-surface text-success-600",
    whitespace: "border-border-default bg-canvas text-text-secondary",
    group: "border-border-default bg-surface text-accent-600",
    quantifier: "border-border-default bg-surface text-warning-600",
};

interface RegexBlockProps {
    block: RegexBlockModel;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

export default function RegexBlock({
    block,
    isSelected,
    onSelect,
}: RegexBlockProps) {
    const removeBlock = useRegexStore((s) => s.removeBlock);
    const duplicateBlock = useRegexStore((s) => s.duplicateBlock);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const previewValue = describePreview(block);

    return (
        <ContextMenu
            items={[
                {
                    id: "duplicate",
                    label: "Duplicate block",
                    icon: <Copy className="w-3.5 h-3.5" />,
                    onSelect: () => duplicateBlock(block.id),
                },
                { id: "sep", type: "separator" },
                {
                    id: "delete",
                    label: "Delete block",
                    danger: true,
                    icon: <Trash2 className="w-3.5 h-3.5" />,
                    onSelect: () => removeBlock(block.id),
                },
            ]}
        >
            <div
                ref={setNodeRef}
                style={style}
                className={[
                    "group flex items-center gap-2.5 rounded-lg border px-3 py-3 cursor-pointer select-none",
                    "transition-[box-shadow,border-color,opacity] duration-[var(--duration-fast)]",
                    BLOCK_ACCENTS[block.type],
                    isSelected
                        ? "border-accent-500 bg-accent-50 shadow-xs"
                        : "",
                    isDragging ? "opacity-40" : "",
                ].join(" ")}
                onClick={() => onSelect(block.id)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(block.id);
                    } else if (e.key === "Delete" || e.key === "Backspace") {
                        e.preventDefault();
                        removeBlock(block.id);
                    }
                }}
                {...attributes}
                {...listeners}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
            >
                <GripVertical className="w-3.5 h-3.5 text-current opacity-40 shrink-0" />
                <span className="text-xs font-semibold whitespace-nowrap font-mono-tabular">
                    {BLOCK_LABELS[block.type]}
                </span>
                {previewValue && (
                    <span className="text-xs font-mono-tabular bg-surface-raised border border-border-subtle rounded-md px-2 py-1 truncate max-w-[10rem]">
                        {previewValue}
                    </span>
                )}
                <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    <button
                        type="button"
                        aria-label="Duplicate block"
                        className="p-1.5 rounded-md text-current hover:bg-surface-hover"
                        onClick={(e) => {
                            e.stopPropagation();
                            duplicateBlock(block.id);
                        }}
                    >
                        <Copy className="w-3 h-3" />
                    </button>
                    <button
                        type="button"
                        aria-label="Remove block"
                        className="p-1.5 rounded-md text-current hover:bg-danger-bg hover:text-danger-500"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeBlock(block.id);
                        }}
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </ContextMenu>
    );
}

function describePreview(block: RegexBlockModel): string | null {
    switch (block.type) {
        case "literal":
            return block.value || "(empty)";
        case "group":
            return block.value ? `(${block.value})` : "(empty group)";
        case "quantifier":
            return block.value || "+";
        default:
            return null;
    }
}
