import { useMemo } from "react";
import { X } from "lucide-react";
import { useRegexStore } from "../../store/regexStore";
import type { QuantifierConfig } from "../../types/regex";
import Button from "../../design-system/Button";
import { Input } from "../../design-system/Input";
import EmptyState from "../../design-system/EmptyState";
import { SlidersHorizontal } from "lucide-react";

const QUANTIFIER_PRESETS: Array<{ label: string; config: QuantifierConfig }> = [
    { label: "* (0 or more)", config: { kind: "*" } },
    { label: "+ (1 or more)", config: { kind: "+" } },
    { label: "? (0 or 1)", config: { kind: "?" } },
];

export default function BlockEditor() {
    const blocks = useRegexStore((s) => s.blocks);
    const selectedBlockId = useRegexStore((s) => s.selectedBlockId);
    const updateBlock = useRegexStore((s) => s.updateBlock);
    const updateBlockFull = useRegexStore((s) => s.updateBlockFull);
    const selectBlock = useRegexStore((s) => s.selectBlock);

    const block = useMemo(
        () => blocks.find((b) => b.id === selectedBlockId) ?? null,
        [blocks, selectedBlockId]
    );

    if (!block) {
        return (
            <EmptyState
                icon={<SlidersHorizontal className="w-5 h-5" />}
                title="No block selected"
                description="Select a block on the canvas to edit its details here."
                compact
            />
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Editing: {block.type}
                </h3>
                <button
                    type="button"
                    aria-label="Close editor"
                    className="text-text-tertiary hover:text-text-primary transition-colors"
                    onClick={() => selectBlock(null)}
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {block.type === "literal" && (
                <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
                    Text to match literally
                    <Input
                        mono
                        value={block.value ?? ""}
                        onChange={(e) => updateBlock(block.id, e.target.value)}
                        placeholder="e.g. hello"
                        autoFocus
                    />
                </label>
            )}

            {block.type === "group" && (
                <div className="flex flex-col gap-3">
                    <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
                        Inner pattern
                        <Input
                            mono
                            value={block.value ?? ""}
                            onChange={(e) =>
                                updateBlock(block.id, e.target.value)
                            }
                            placeholder="e.g. \d{3}-\d{4}"
                        />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
                        Group name (optional, named capture)
                        <Input
                            mono
                            value={block.groupName ?? ""}
                            onChange={(e) =>
                                updateBlockFull(block.id, {
                                    groupName: e.target.value || undefined,
                                })
                            }
                            placeholder="e.g. year"
                        />
                    </label>
                    <label className="flex items-center gap-2 text-xs text-text-secondary">
                        <input
                            type="checkbox"
                            checked={block.capturing !== false}
                            onChange={(e) =>
                                updateBlockFull(block.id, {
                                    capturing: e.target.checked,
                                })
                            }
                            className="rounded border-border-strong bg-surface-raised accent-accent-500"
                        />
                        Capturing group
                    </label>
                </div>
            )}

            {block.type === "quantifier" && (
                <div className="flex flex-col gap-3">
                    <p className="text-xs text-text-tertiary">
                        Applies to the block immediately before this one.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {QUANTIFIER_PRESETS.map((preset) => (
                            <Button
                                key={preset.label}
                                variant="secondary"
                                size="sm"
                                active={
                                    block.value ===
                                    JSON.stringify(preset.config)
                                }
                                onClick={() =>
                                    updateBlock(
                                        block.id,
                                        JSON.stringify(preset.config)
                                    )
                                }
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                    <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
                        Exact count {"{n}"}
                        <Input
                            mono
                            type="number"
                            min={0}
                            className="w-24"
                            onChange={(e) => {
                                const n = Number(e.target.value);
                                if (Number.isNaN(n)) return;
                                updateBlock(
                                    block.id,
                                    JSON.stringify({
                                        kind: "exact",
                                        min: n,
                                    } satisfies QuantifierConfig)
                                );
                            }}
                        />
                    </label>
                </div>
            )}

            {(block.type === "digit" ||
                block.type === "word" ||
                block.type === "whitespace") && (
                <p className="text-xs text-text-tertiary">
                    This block has no configurable options.
                </p>
            )}
        </div>
    );
}
