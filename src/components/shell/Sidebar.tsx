import { useState, type ReactNode } from "react";
import {
    ChevronRight,
    Type,
    Hash,
    CaseSensitive,
    Space,
    Parentheses,
    Repeat,
    Library,
    Bookmark,
    Trash2,
    PanelLeftClose,
    PanelLeftOpen,
    Save,
} from "lucide-react";
import { useRegexStore } from "../../store/regexStore";
import { useUIStore } from "../../store/uiStore";
import {
    useSavedPatternsStore,
    type SavedPattern,
} from "../../store/savedPatternsStore";
import type { BlockType, ToolboxBlockDefinition } from "../../types/regex";
import { PATTERN_LIBRARY } from "./patternLibraryData";
import ResizeHandle from "../../design-system/ResizeHandle";
import Tooltip from "../../design-system/Tooltip";
import ContextMenu from "../../design-system/ContextMenu";
import { toast } from "../../design-system/toastStore";

const TOOLBOX_BLOCKS: Array<ToolboxBlockDefinition & { icon: typeof Type }> = [
    {
        type: "literal",
        label: "Literal",
        description: "Exact text",
        defaultValue: "",
        icon: Type,
    },
    {
        type: "digit",
        label: "Digit",
        description: "\\d — 0-9",
        icon: Hash,
    },
    {
        type: "word",
        label: "Word",
        description: "\\w — letters, digits, _",
        icon: CaseSensitive,
    },
    {
        type: "whitespace",
        label: "Whitespace",
        description: "\\s — space, tab, newline",
        icon: Space,
    },
    {
        type: "group",
        label: "Group",
        description: "( ) — capture group",
        defaultValue: "",
        icon: Parentheses,
    },
    {
        type: "quantifier",
        label: "Quantifier",
        description: "Repeat previous block",
        defaultValue: "+",
        icon: Repeat,
    },
];

function createBlockId(type: BlockType): string {
    return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function SidebarSection({
    title,
    icon,
    defaultOpen = true,
    children,
    action,
}: {
    title: string;
    icon: ReactNode;
    defaultOpen?: boolean;
    children: ReactNode;
    action?: ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-border-subtle last:border-b-0">
            <div className="flex items-center">
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="flex-1 flex items-center gap-2 px-3 py-2.5 text-left group"
                >
                    <ChevronRight
                        className={`w-3.5 h-3.5 text-text-tertiary transition-transform duration-[var(--duration-fast)] ${
                            open ? "rotate-90" : ""
                        }`}
                    />
                    <span className="text-text-tertiary">{icon}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary group-hover:text-text-primary transition-colors">
                        {title}
                    </span>
                </button>
                {action && <div className="pr-2">{action}</div>}
            </div>
            {open && <div className="px-2 pb-3">{children}</div>}
        </div>
    );
}

export default function Sidebar() {
    const sidebarWidth = useUIStore((s) => s.sidebarWidth);
    const setSidebarWidth = useUIStore((s) => s.setSidebarWidth);
    const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
    const toggleSidebar = useUIStore((s) => s.toggleSidebar);

    const blocks = useRegexStore((s) => s.blocks);
    const addBlock = useRegexStore((s) => s.addBlock);
    const selectBlock = useRegexStore((s) => s.selectBlock);
    const clearBlocks = useRegexStore((s) => s.clearBlocks);

    const savedPatterns = useSavedPatternsStore((s) => s.patterns);
    const savePattern = useSavedPatternsStore((s) => s.save);
    const removeSavedPattern = useSavedPatternsStore((s) => s.remove);

    const handleAddToolboxBlock = (definition: ToolboxBlockDefinition) => {
        const id = createBlockId(definition.type);
        addBlock({
            id,
            type: definition.type,
            value: definition.defaultValue,
            capturing: definition.type === "group" ? true : undefined,
        });
        selectBlock(id);
    };

    const handleInsertLibraryEntry = (
        entryBlocks: Array<{ type: BlockType } & Record<string, unknown>>
    ) => {
        for (const b of entryBlocks) {
            const id = createBlockId(b.type);
            addBlock({ ...(b as object), id } as Parameters<typeof addBlock>[0]);
        }
        toast({
            title: "Pattern inserted",
            description: "Added to the end of your current builder canvas.",
            variant: "success",
        });
    };

    const handleSaveCurrentPattern = () => {
        if (blocks.length === 0) {
            toast({
                title: "Nothing to save",
                description: "Add some blocks to the canvas first.",
                variant: "warning",
            });
            return;
        }
        const name = window.prompt("Name this pattern:", "My pattern");
        if (!name) return;
        savePattern(name, blocks);
        toast({
            title: "Pattern saved",
            description: `"${name}" was added to Saved Patterns.`,
            variant: "success",
        });
    };

    const handleLoadSavedPattern = (pattern: SavedPattern) => {
        clearBlocks();
        for (const b of pattern.blocks) {
            addBlock({ ...b, id: createBlockId(b.type) });
        }
        toast({
            title: "Pattern loaded",
            description: `"${pattern.name}" replaced your current canvas.`,
            variant: "neutral",
        });
    };

    if (sidebarCollapsed) {
        return (
            <div className="w-10 shrink-0 flex flex-col items-center py-2 bg-surface border-r border-border-subtle">
                <Tooltip label="Expand sidebar" side="right">
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        aria-label="Expand sidebar"
                        className="flex items-center justify-center w-7 h-7 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                    >
                        <PanelLeftOpen className="w-4 h-4" />
                    </button>
                </Tooltip>
            </div>
        );
    }

    return (
        <div
            style={{ width: sidebarWidth }}
            className="shrink-0 flex bg-surface border-r border-border-subtle"
        >
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <div className="flex items-center justify-between px-3 h-9 shrink-0 border-b border-border-subtle">
                    <span className="text-xs font-semibold text-text-secondary">
                        Explorer
                    </span>
                    <Tooltip label="Collapse sidebar" side="right">
                        <button
                            type="button"
                            onClick={toggleSidebar}
                            aria-label="Collapse sidebar"
                            className="flex items-center justify-center w-6 h-6 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
                        >
                            <PanelLeftClose className="w-3.5 h-3.5" />
                        </button>
                    </Tooltip>
                </div>

                <SidebarSection
                    title="Block toolbox"
                    icon={<Type className="w-3.5 h-3.5" />}
                >
                    <div className="flex flex-col gap-1">
                        {TOOLBOX_BLOCKS.map((definition) => {
                            const Icon = definition.icon;
                            return (
                                <button
                                    key={definition.type}
                                    type="button"
                                    onClick={() =>
                                        handleAddToolboxBlock(definition)
                                    }
                                    className="flex items-start gap-2.5 text-left rounded-md px-2 py-1.5 hover:bg-surface-hover transition-colors duration-[var(--duration-fast)] group"
                                >
                                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-surface-raised text-text-tertiary group-hover:text-accent-400 group-hover:bg-accent-500/10 transition-colors shrink-0 mt-0.5">
                                        <Icon className="w-3.5 h-3.5" />
                                    </span>
                                    <span className="flex flex-col min-w-0">
                                        <span className="text-[13px] font-medium text-text-primary truncate">
                                            {definition.label}
                                        </span>
                                        <span className="text-[11px] text-text-tertiary font-mono-tabular truncate">
                                            {definition.description}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </SidebarSection>

                <SidebarSection
                    title="Pattern library"
                    icon={<Library className="w-3.5 h-3.5" />}
                    defaultOpen={false}
                >
                    <div className="flex flex-col gap-1">
                        {PATTERN_LIBRARY.map((entry) => (
                            <button
                                key={entry.id}
                                type="button"
                                onClick={() =>
                                    handleInsertLibraryEntry(
                                        entry.blocks as Array<
                                            { type: BlockType } & Record<
                                                string,
                                                unknown
                                            >
                                        >
                                    )
                                }
                                className="flex flex-col gap-0.5 text-left rounded-md px-2 py-1.5 hover:bg-surface-hover transition-colors duration-[var(--duration-fast)]"
                            >
                                <span className="text-[13px] font-medium text-text-primary">
                                    {entry.name}
                                </span>
                                <span className="text-[11px] text-text-tertiary">
                                    {entry.description}
                                </span>
                            </button>
                        ))}
                    </div>
                </SidebarSection>

                <SidebarSection
                    title="Saved patterns"
                    icon={<Bookmark className="w-3.5 h-3.5" />}
                    defaultOpen={false}
                    action={
                        <Tooltip label="Save current pattern" side="left">
                            <button
                                type="button"
                                onClick={handleSaveCurrentPattern}
                                aria-label="Save current pattern"
                                className="flex items-center justify-center w-6 h-6 rounded-md text-text-tertiary hover:text-accent-400 hover:bg-accent-500/10 transition-colors"
                            >
                                <Save className="w-3.5 h-3.5" />
                            </button>
                        </Tooltip>
                    }
                >
                    {savedPatterns.length === 0 ? (
                        <p className="text-[11px] text-text-tertiary px-2 py-1">
                            No saved patterns yet. Build something, then click
                            the save icon above.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {savedPatterns.map((pattern) => (
                                <ContextMenu
                                    key={pattern.id}
                                    items={[
                                        {
                                            id: "load",
                                            label: "Load into canvas",
                                            onSelect: () =>
                                                handleLoadSavedPattern(
                                                    pattern
                                                ),
                                        },
                                        {
                                            id: "delete",
                                            label: "Delete",
                                            danger: true,
                                            icon: (
                                                <Trash2 className="w-3.5 h-3.5" />
                                            ),
                                            onSelect: () =>
                                                removeSavedPattern(
                                                    pattern.id
                                                ),
                                        },
                                    ]}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleLoadSavedPattern(pattern)
                                        }
                                        className="w-full flex items-center justify-between gap-2 text-left rounded-md px-2 py-1.5 hover:bg-surface-hover transition-colors duration-[var(--duration-fast)] group"
                                    >
                                        <span className="text-[13px] font-medium text-text-primary truncate">
                                            {pattern.name}
                                        </span>
                                        <Trash2
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeSavedPattern(
                                                    pattern.id
                                                );
                                            }}
                                            className="w-3.5 h-3.5 text-text-disabled opacity-0 group-hover:opacity-100 hover:text-danger-400 transition-opacity shrink-0"
                                        />
                                    </button>
                                </ContextMenu>
                            ))}
                        </div>
                    )}
                </SidebarSection>
            </div>

            <ResizeHandle
                direction="horizontal"
                edge="right"
                onResize={(delta) => setSidebarWidth(sidebarWidth + delta)}
            />
        </div>
    );
}
