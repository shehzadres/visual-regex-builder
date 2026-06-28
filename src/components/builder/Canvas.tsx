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
import { Boxes, Trash2 } from "lucide-react";
import { useRegexStore } from "../../store/regexStore";
import RegexBlockItem from "./RegexBlock";
import BlockEditor from "./BlockEditor";
import EmptyState from "../../design-system/EmptyState";
import Button from "../../design-system/Button";
import Card from "../../design-system/Card";

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
        <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-text-tertiary" />
                    <h2 className="text-sm font-semibold text-text-primary">
                        Canvas
                    </h2>
                    <span className="text-xs text-text-tertiary">
                        Drag to reorder · click to edit · right-click for more
                    </span>
                </div>
                {blocks.length > 0 && (
                    <Button
                        variant="ghost"
                        size="xs"
                        icon={<Trash2 className="w-3 h-3" />}
                        onClick={clearBlocks}
                    >
                        Clear all
                    </Button>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
                <Card className="flex-1 min-h-[220px] overflow-y-auto">
                    {blocks.length === 0 ? (
                        <EmptyState
                            icon={<Boxes className="w-5 h-5" />}
                            title="No blocks yet"
                            description="Add blocks from the sidebar toolbox to start building a pattern."
                        />
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
                                <div className="flex flex-col gap-1.5">
                                    {blocks.map((block) => (
                                        <RegexBlockItem
                                            key={block.id}
                                            block={block}
                                            isSelected={
                                                block.id === selectedBlockId
                                            }
                                            onSelect={selectBlock}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                            <DragOverlay>
                                {draggingBlock ? (
                                    <div className="rounded-md border border-accent-500 bg-surface-overlay px-2.5 py-2 shadow-lg opacity-90">
                                        <span className="text-xs font-semibold font-mono-tabular text-text-primary">
                                            {draggingBlock.type}
                                        </span>
                                    </div>
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    )}
                </Card>

                <Card className="w-full lg:w-72 shrink-0 overflow-y-auto">
                    <BlockEditor />
                </Card>
            </div>
        </div>
    );
}
