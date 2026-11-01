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
import {
    ArrowDown,
    ArrowUpRight,
    Braces,
    CalendarDays,
    GripVertical,
    Hash,
    Layers3,
    Plus,
    Regex,
    RotateCcw,
    SlidersHorizontal,
    Trash2,
    Type,
} from "lucide-react";
import { useRegexStore } from "../../store/regexStore";
import type { RegexBlock } from "../../types/regex";
import { PATTERN_LIBRARY } from "../shell/patternLibraryData";
import RegexBlockItem from "./RegexBlock";
import BlockEditor from "./BlockEditor";
import Button from "../../design-system/Button";
import ExpressionPreview from "./ExpressionPreview";

const STARTER_DETAILS: Record<string, {
    expression: string;
    category: string;
    icon: typeof Regex;
}> = {
    "digits-only": { expression: "\\d+", category: "Character set", icon: Hash },
    "word-token": { expression: "\\w+", category: "Text", icon: Type },
    "optional-whitespace": { expression: "\\s*", category: "Whitespace", icon: ArrowDown },
    "phone-like": { expression: "(\\d{3})", category: "Capture group", icon: Braces },
    "named-year": { expression: "(?<year>\\d{4})", category: "Named group", icon: CalendarDays },
};

function createBlockId(type: string): string {
    return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Canvas() {
    const blocks = useRegexStore((s) => s.blocks);
    const selectedBlockId = useRegexStore((s) => s.selectedBlockId);
    const selectBlock = useRegexStore((s) => s.selectBlock);
    const reorderBlocks = useRegexStore((s) => s.reorderBlocks);
    const clearBlocks = useRegexStore((s) => s.clearBlocks);
    const addBlock = useRegexStore((s) => s.addBlock);

    const [draggingId, setDraggingId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => setDraggingId(String(event.active.id));

    const handleDragEnd = (event: DragEndEvent) => {
        setDraggingId(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const fromIndex = blocks.findIndex((b) => b.id === active.id);
        const toIndex = blocks.findIndex((b) => b.id === over.id);
        if (fromIndex < 0 || toIndex < 0) return;
        reorderBlocks(fromIndex, toIndex);
    };

    const loadStarter = (entry: typeof PATTERN_LIBRARY[number]) => {
        clearBlocks();
        let firstId: string | null = null;
        entry.blocks.forEach((block) => {
            const id = createBlockId(block.type);
            if (!firstId) firstId = id;
            addBlock({ ...block, id } as RegexBlock);
        });
        selectBlock(firstId);
    };

    const draggingBlock = blocks.find((b) => b.id === draggingId) ?? null;

    return (
        <div className="flex flex-col gap-4 min-h-full">
            <header className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-500/20 bg-accent-50 text-accent-700">
                        <Layers3 className="h-[18px] w-[18px]" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-[19px] leading-tight font-semibold tracking-[-0.035em] text-text-primary">
                                Expression workspace
                            </h1>
                            <span className="rounded-md border border-border-default bg-surface px-2 py-0.5 text-[11px] font-mono-tabular text-text-secondary">
                                {blocks.length.toString().padStart(2, "0")} nodes
                            </span>
                        </div>
                        <p className="mt-1 text-[12px] text-text-secondary">
                            Compose, connect and inspect each part of your regular expression.
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {blocks.length > 0 && (
                        <Button variant="ghost" size="sm" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={clearBlocks}>
                            Reset
                        </Button>
                    )}
                    {blocks.length > 0 && (
                        <Button variant="secondary" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={clearBlocks}>
                            Clear
                        </Button>
                    )}
                </div>
            </header>

            <div className="grid flex-1 min-h-[480px] grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
                <section className="expression-canvas panel-surface flex min-h-[480px] flex-col overflow-hidden rounded-2xl">
                    <div className="flex items-center justify-between border-b border-border-subtle bg-surface/90 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-50 text-accent-700">
                                <Braces className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-[12px] font-semibold text-text-primary">Expression flow</h2>
                                <p className="text-[10px] text-text-tertiary">Ordered sequence · left to right</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
                            <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                            Live compiler
                            <span className="mx-1 h-4 w-px bg-border-default" />
                            <GripVertical className="h-3.5 w-3.5" />
                            Drag to reorder
                        </div>
                    </div>

                    <div className="flex-1 p-4 sm:p-5">
                        {blocks.length === 0 ? (
                            <div className="flex h-full min-h-[390px] flex-col justify-center">
                                <div className="mx-auto mb-6 max-w-md text-center">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent-500/20 bg-accent-50 text-accent-700 shadow-sm">
                                        <Regex className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-text-primary">
                                        Start with a pattern
                                    </h3>
                                    <p className="mt-1.5 text-[12px] leading-5 text-text-secondary">
                                        Pick a starting point or add individual blocks from the left. Every change is compiled as you work.
                                    </p>
                                </div>

                                <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                                    {PATTERN_LIBRARY.map((entry) => {
                                        const detail = STARTER_DETAILS[entry.id] ?? {
                                            expression: "",
                                            category: "Starter",
                                            icon: Regex,
                                        };
                                        const Icon = detail.icon;
                                        return (
                                            <button
                                                key={entry.id}
                                                type="button"
                                                onClick={() => loadStarter(entry)}
                                                className="group flex min-h-[112px] flex-col rounded-xl border border-border-default bg-surface/95 p-3.5 text-left shadow-[0_1px_2px_rgba(20,24,20,0.03)] transition-all duration-150 hover:-translate-y-0.5 hover:border-accent-500/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                                            >
                                                <div className="flex w-full items-center justify-between">
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-raised text-text-secondary transition-colors group-hover:bg-accent-50 group-hover:text-accent-700">
                                                        <Icon className="h-3.5 w-3.5" />
                                                    </span>
                                                    <ArrowUpRight className="h-3.5 w-3.5 text-text-disabled transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-600" />
                                                </div>
                                                <span className="mt-3 text-[12px] font-semibold text-text-primary">{entry.name}</span>
                                                <span className="mt-0.5 text-[10px] text-text-tertiary">{entry.description}</span>
                                                <code className="mt-2 font-mono-tabular text-[11px] text-accent-700">{detail.expression}</code>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="mx-auto mt-5 flex items-center gap-2 text-[10px] text-text-tertiary">
                                    <Plus className="h-3 w-3" />
                                    Or choose a block from the toolbox
                                </div>
                            </div>
                        ) : (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                                    <div className="relative mx-auto flex max-w-3xl flex-col gap-2.5">
                                        <div className="absolute bottom-8 left-[17px] top-8 w-px bg-border-strong" />
                                        {blocks.map((block, index) => (
                                            <div key={block.id} className="relative flex items-start gap-3">
                                                <div className="relative z-10 mt-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-default bg-surface text-[10px] font-mono-tabular text-text-tertiary shadow-sm">
                                                    {String(index + 1).padStart(2, "0")}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <RegexBlockItem block={block} isSelected={block.id === selectedBlockId} onSelect={selectBlock} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </SortableContext>
                                <DragOverlay>
                                    {draggingBlock ? (
                                        <div className="rounded-xl border border-accent-500 bg-surface-overlay px-4 py-3 shadow-lg opacity-95">
                                            <span className="text-xs font-semibold font-mono-tabular text-text-primary">{draggingBlock.type}</span>
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        )}
                    </div>
                    <div className="flex items-center justify-between border-t border-border-subtle bg-surface/75 px-4 py-2.5">
                        <span className="text-[10px] text-text-tertiary">Changes compile automatically</span>
                        <span className="font-mono-tabular text-[10px] text-text-tertiary">REGEX / BUILDER</span>
                    </div>
                </section>

                <aside className="flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(20,24,20,0.03)]">
                    <div className="flex items-center gap-2.5 border-b border-border-subtle px-4 py-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-raised text-text-secondary">
                            <SlidersHorizontal className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-[12px] font-semibold text-text-primary">Properties</h2>
                            <p className="text-[10px] text-text-tertiary">Selected block configuration</p>
                        </div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                        {blocks.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-border-strong text-text-tertiary">
                                    <SlidersHorizontal className="h-4 w-4" />
                                </div>
                                <p className="text-[12px] font-medium text-text-secondary">Nothing selected</p>
                                <p className="mt-1 max-w-[190px] text-[11px] leading-5 text-text-tertiary">
                                    Choose a starter or add a block to configure its properties here.
                                </p>
                            </div>
                        ) : (
                            <BlockEditor />
                        )}
                    </div>
                </aside>
            </div>

            <ExpressionPreview />
        </div>
    );
}
