import { useState } from "react";
import {
    DndContext,
    type DragEndEvent,
    type DragStartEvent,
    DragOverlay,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    closestCenter,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Boxes, Trash2, SlidersHorizontal, GripVertical } from "lucide-react";
import { useRegexStore } from "../../store/regexStore";
import RegexBlockItem from "./RegexBlock";
import BlockEditor from "./BlockEditor";
import EmptyState from "../../design-system/EmptyState";
import Button from "../../design-system/Button";
import Card from "../../design-system/Card";
import ExpressionPreview from "./ExpressionPreview";

export default function Canvas() {
    const blocks = useRegexStore((s) => s.blocks);
    const selectedBlockId = useRegexStore((s) => s.selectedBlockId);
    const selectBlock = useRegexStore((s) => s.selectBlock);
    const reorderBlocks = useRegexStore((s) => s.reorderBlocks);
    const clearBlocks = useRegexStore((s) => s.clearBlocks);

    const [draggingId, setDraggingId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 4 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setDraggingId(String(event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setDraggingId(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const fromIndex = blocks.findIndex((b) => b.id === active.id);
        const toIndex = blocks.findIndex((b) => b.id === over.id);
        if (fromIndex === -1 || toIndex === -1) return;

        reorderBlocks(fromIndex, toIndex);
    };

    const draggingBlock = blocks.find((b) => b.id === draggingId) ?? null;

    return (
        <div className="flex flex-col gap-5 h-full">
            <div className="flex items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-[20px] leading-tight font-semibold tracking-[-0.04em] text-text-primary">
                            Pattern canvas
                        </h1>
                        <span className="text-[11px] text-text-tertiary border-l border-border-default pl-2.5">
                            {blocks.length} {blocks.length === 1 ? "block" : "blocks"}
                        </span>
                    </div>
                    <p className="text-[12px] text-text-secondary">
                        Assemble an expression from building blocks, then refine each part.
                    </p>
                </div>
                {blocks.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={clearBlocks}
                    >
                        Clear canvas
                    </Button>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
                <Card className="flex-1 min-h-[360px] overflow-y-auto flex flex-col">
                    <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3 mb-4">
                        <div className="flex items-center gap-2">
                            <Boxes className="w-4 h-4 text-accent-600" />
                            <span className="text-[13px] font-semibold text-text-primary">Sequence</span>
                        </div>
                        <span className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                            <GripVertical className="w-3.5 h-3.5" />
                            Drag to reorder
                        </span>
                    </div>
                    {blocks.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <EmptyState
                                icon={<Boxes className="w-5 h-5" />}
                                title="Start with a building block"
                                description="Choose Literal, Digit, Group or another block from the left. Your expression updates as you build."
                            />
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={blocks.map((b) => b.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="flex flex-col gap-2">
                                    {blocks.map((block) => (
                                        <RegexBlockItem
                                            key={block.id}
                                            block={block}
                                            isSelected={block.id === selectedBlockId}
                                            onSelect={selectBlock}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                            <DragOverlay>
                                {draggingBlock ? (
                                    <div className="rounded-lg border border-accent-500 bg-surface-overlay px-3 py-2.5 shadow-md opacity-95">
                                        <span className="text-xs font-semibold font-mono-tabular text-text-primary">
                                            {draggingBlock.type}
                                        </span>
                                    </div>
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    )}
                </Card>

                <Card className="w-full lg:w-[320px] shrink-0 overflow-y-auto">
                    <div className="flex items-center gap-2 border-b border-border-subtle pb-3 mb-4">
                        <SlidersHorizontal className="w-4 h-4 text-accent-600" />
                        <span className="text-[13px] font-semibold text-text-primary">Block settings</span>
                    </div>
                    <BlockEditor />
                </Card>
            </div>

            <ExpressionPreview />
        </div>
    );
}
