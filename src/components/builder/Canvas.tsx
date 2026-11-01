import { useState } from "react";
import {
    DndContext, type DragEndEvent, type DragStartEvent, DragOverlay,
    PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import {
    SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ArrowRight, Braces, Command, GripVertical, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useRegexStore } from "../../store/regexStore";
import type { RegexBlock } from "../../types/regex";
import { PATTERN_LIBRARY } from "../shell/patternLibraryData";
import RegexBlockItem from "./RegexBlock";
import BlockEditor from "./BlockEditor";
import ExpressionPreview from "./ExpressionPreview";

const EXAMPLES: Record<string, string> = {
    "digits-only": "\\d+",
    "word-token": "\\w+",
    "optional-whitespace": "\\s*",
    "phone-like": "(\\d{3})",
    "named-year": "(?<year>\\d{4})",
};

function createBlockId(type: string) {
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
        const from = blocks.findIndex((block) => block.id === active.id);
        const to = blocks.findIndex((block) => block.id === over.id);
        if (from >= 0 && to >= 0) reorderBlocks(from, to);
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

    const draggingBlock = blocks.find((block) => block.id === draggingId) ?? null;

    return (
        <div className="regex-workbench">
            <header className="regex-page-heading">
                <div>
                    <div className="regex-eyebrow">REGEX / WORKSPACE 01</div>
                    <h1>Build a pattern<span>.</span></h1>
                    <p>Construct an expression from parts. See how every token changes the final match.</p>
                </div>
                <div className="regex-heading-actions">
                    {blocks.length > 0 && (
                        <>
                            <button type="button" className="regex-text-action" onClick={clearBlocks}>
                                <RotateCcw size={14} /> Reset
                            </button>
                            <button type="button" className="regex-text-action regex-danger-action" onClick={clearBlocks}>
                                <Trash2 size={14} /> Clear
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div className="regex-editor-layout">
                <main className="regex-construction">
                    <div className="regex-section-head">
                        <div>
                            <span className="regex-section-index">01</span>
                            <h2>Construction</h2>
                        </div>
                        <span className="regex-muted-meta">{String(blocks.length).padStart(2, "0")} TOKENS</span>
                    </div>

                    {blocks.length === 0 ? (
                        <div className="regex-empty-composition">
                            <div className="regex-empty-copy">
                                <span className="regex-empty-mark"><Braces size={24} strokeWidth={1.5} /></span>
                                <h3>Start with a building block</h3>
                                <p>Choose a common expression to inspect its structure, or assemble one from the toolbox.</p>
                            </div>
                            <div className="regex-pattern-list">
                                {PATTERN_LIBRARY.map((entry, index) => (
                                    <button key={entry.id} type="button" className="regex-pattern-row" onClick={() => loadStarter(entry)}>
                                        <span className="regex-pattern-number">{String(index + 1).padStart(2, "0")}</span>
                                        <span className="regex-pattern-name">{entry.name}</span>
                                        <code>{EXAMPLES[entry.id] ?? "…"}</code>
                                        <span className="regex-pattern-description">{entry.description}</span>
                                        <ArrowRight className="regex-pattern-arrow" size={15} />
                                    </button>
                                ))}
                            </div>
                            <div className="regex-empty-foot"><Command size={13} /> Add tokens from the left-hand toolbox <span>or press a pattern above</span></div>
                        </div>
                    ) : (
                        <div className="regex-sequence-area">
                            <div className="regex-sequence-note">
                                <span>SEQUENCE</span>
                                <span><GripVertical size={12} /> Drag rows to reorder</span>
                            </div>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                                <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
                                    <div className="regex-token-list">
                                        {blocks.map((block, index) => (
                                            <div key={block.id} className="regex-token-row">
                                                <span className="regex-token-index">{String(index + 1).padStart(2, "0")}</span>
                                                <div className="regex-token-item">
                                                    <RegexBlockItem block={block} isSelected={block.id === selectedBlockId} onSelect={selectBlock} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </SortableContext>
                                <DragOverlay>
                                    {draggingBlock ? <div className="regex-drag-preview">{draggingBlock.type}</div> : null}
                                </DragOverlay>
                            </DndContext>
                            <div className="regex-add-hint"><Plus size={13} /> Add another token using the toolbox</div>
                        </div>
                    )}

                    <ExpressionPreview />
                </main>

                <aside className="regex-properties">
                    <div className="regex-section-head">
                        <div>
                            <span className="regex-section-index">02</span>
                            <h2>Inspector</h2>
                        </div>
                    </div>
                    {blocks.length === 0 ? (
                        <div className="regex-inspector-empty">
                            <span className="regex-inspector-rule" />
                            <p>Nothing to inspect yet.</p>
                            <span>Select a token to see its controls and behaviour.</span>
                        </div>
                    ) : (
                        <div className="regex-inspector-content"><BlockEditor /></div>
                    )}
                    <div className="regex-inspector-foot">
                        <span>TIP</span>
                        <p>Select any token in the construction area to edit its value and options.</p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
