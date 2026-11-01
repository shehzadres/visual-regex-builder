import { useState } from "react";
import { DndContext, type DragEndEvent, type DragStartEvent, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ArrowUpRight, GripVertical, Plus, RotateCcw, Trash2, Braces, Command } from "lucide-react";
import { useRegexStore } from "../../store/regexStore";
import type { RegexBlock } from "../../types/regex";
import { PATTERN_LIBRARY } from "../shell/patternLibraryData";
import RegexBlockItem from "./RegexBlock";
import BlockEditor from "./BlockEditor";
import ExpressionPreview from "./ExpressionPreview";

const EXAMPLES: Record<string, string> = {
  "digits-only": "\\d+", "word-token": "\\w+", "optional-whitespace": "\\s*",
  "phone-like": "(\\d{3})", "named-year": "(?<year>\\d{4})",
};
function createBlockId(type: string) { return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

export default function Canvas() {
  const blocks = useRegexStore((s) => s.blocks);
  const selectedBlockId = useRegexStore((s) => s.selectedBlockId);
  const selectBlock = useRegexStore((s) => s.selectBlock);
  const reorderBlocks = useRegexStore((s) => s.reorderBlocks);
  const clearBlocks = useRegexStore((s) => s.clearBlocks);
  const addBlock = useRegexStore((s) => s.addBlock);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
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
      <header className="rw-masthead">
        <div className="rw-title-group">
          <div className="rw-kicker"><span>REGEX STUDIO</span><i /> PATTERN WORKSPACE</div>
          <h1>Pattern <em>workbench</em></h1>
          <p>Compose, inspect and compile regular expressions one token at a time.</p>
        </div>
        <div className="rw-actions">
          <span className="rw-session">LOCAL SESSION <b>01</b></span>
          {blocks.length > 0 && <>
            <button type="button" onClick={clearBlocks} className="rw-action"><RotateCcw size={13}/> Reset</button>
            <button type="button" onClick={clearBlocks} className="rw-action rw-clear"><Trash2 size={13}/> Clear</button>
          </>}
        </div>
      </header>

      <div className="rw-workspace">
        <main className="rw-stage">
          <div className="rw-stage-top">
            <div><span className="rw-index">A / 01</span><h2>Composition</h2></div>
            <div className="rw-stage-meta"><span className={blocks.length ? "rw-live" : ""}/>{blocks.length ? "EDITING" : "AWAITING INPUT"} <b>{String(blocks.length).padStart(2, "0")} BLOCKS</b></div>
          </div>

          {blocks.length === 0 ? (
            <div className="rw-empty">
              <div className="rw-empty-intro">
                <div className="rw-empty-symbol"><Braces size={29} strokeWidth={1.2}/><span>01</span></div>
                <div>
                  <div className="rw-overline">THE CANVAS IS YOURS</div>
                  <h3>Start with a pattern.<br/><i>Make it precise.</i></h3>
                  <p>Choose a starting point below, or add individual tokens from the toolbox. Every piece stays editable.</p>
                </div>
              </div>
              <div className="rw-library">
                <div className="rw-library-heading"><span>QUICK START</span><span>SELECT A FOUNDATION <ArrowUpRight size={12}/></span></div>
                {PATTERN_LIBRARY.slice(0, 5).map((entry, index) => (
                  <button key={entry.id} type="button" className="rw-library-item" onClick={() => loadStarter(entry)}>
                    <span className="rw-library-no">{String(index + 1).padStart(2, "0")}</span>
                    <span className="rw-library-label">{entry.name}<small>{entry.description}</small></span>
                    <code>{EXAMPLES[entry.id] ?? "…"}</code>
                    <ArrowUpRight size={14} className="rw-library-arrow"/>
                  </button>
                ))}
              </div>
              <div className="rw-shortcut"><Command size={13}/> Or build from the <strong>Blocks</strong> toolbox <span>on the left</span></div>
            </div>
          ) : (
            <div className="rw-sequence">
              <div className="rw-sequence-head"><span>SEQUENCE / LEFT TO RIGHT</span><span><GripVertical size={12}/> DRAG TO REORDER</span></div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
                  <div className="rw-token-list">
                    {blocks.map((block, index) => <div key={block.id} className="rw-token-row">
                      <span className="rw-token-no">{String(index + 1).padStart(2, "0")}</span>
                      <div className="rw-token-connector"/>
                      <div className="rw-token-content"><RegexBlockItem block={block} isSelected={block.id === selectedBlockId} onSelect={selectBlock}/></div>
                    </div>)}
                  </div>
                </SortableContext>
                <DragOverlay>{draggingBlock ? <div className="rw-drag">{draggingBlock.type}</div> : null}</DragOverlay>
              </DndContext>
              <div className="rw-add-note"><Plus size={13}/> Add another block from the toolbox</div>
            </div>
          )}
          <div className="rw-output"><div className="rw-output-label">COMPILED EXPRESSION <span>LIVE OUTPUT</span></div><ExpressionPreview/></div>
        </main>

        <aside className="rw-inspector">
          <div className="rw-inspector-head"><span className="rw-index">B / 02</span><h2>Properties</h2><span className="rw-inspector-mark">⌘</span></div>
          {blocks.length === 0 ? <div className="rw-inspector-empty">
            <div className="rw-inspector-glyph">∅</div>
            <h3>No selection</h3>
            <p>Choose a block in the composition or add one from the toolbox to edit its properties.</p>
            <div className="rw-inspector-divider"/>
            <span>INSPECTOR</span><small>Token settings appear here.</small>
          </div> : <div className="rw-inspector-editor"><BlockEditor/></div>}
          <div className="rw-inspector-bottom"><span>REFERENCE</span><p>Changes are reflected immediately in the compiled expression and automata views.</p></div>
        </aside>
      </div>
    </div>
  );
}
