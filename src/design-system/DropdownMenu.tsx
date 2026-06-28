import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export interface MenuItem {
    id: string;
    label: string;
    icon?: ReactNode;
    shortcut?: string;
    danger?: boolean;
    disabled?: boolean;
    onSelect: () => void;
}

export interface MenuSeparator {
    id: string;
    type: "separator";
}

export type MenuEntry = MenuItem | MenuSeparator;

function isSeparator(entry: MenuEntry): entry is MenuSeparator {
    return "type" in entry && entry.type === "separator";
}

interface DropdownMenuProps {
    trigger: ReactNode;
    items: MenuEntry[];
    align?: "left" | "right";
}

export default function DropdownMenu({
    trigger,
    items,
    align = "left",
}: DropdownMenuProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        function handleClick(e: MouseEvent) {
            if (!containerRef.current?.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }

        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKey);
        };
    }, [open]);

    return (
        <div className="relative inline-block" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-1"
                aria-haspopup="menu"
                aria-expanded={open}
            >
                {trigger}
            </button>

            {open && (
                <div
                    role="menu"
                    className={[
                        "absolute z-50 mt-1.5 min-w-[180px] py-1 rounded-lg",
                        "bg-surface-overlay border border-border-default shadow-lg",
                        "animate-[panel-fade-in_var(--duration-fast)_var(--ease-out)]",
                        align === "right" ? "right-0" : "left-0",
                    ].join(" ")}
                >
                    {items.map((entry) => {
                        if (isSeparator(entry)) {
                            return (
                                <div
                                    key={entry.id}
                                    className="my-1 h-px bg-border-subtle"
                                />
                            );
                        }
                        return (
                            <button
                                key={entry.id}
                                type="button"
                                role="menuitem"
                                disabled={entry.disabled}
                                onClick={() => {
                                    entry.onSelect();
                                    setOpen(false);
                                }}
                                className={[
                                    "w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-sm",
                                    "transition-colors duration-[var(--duration-fast)]",
                                    "disabled:opacity-40 disabled:pointer-events-none",
                                    entry.danger
                                        ? "text-danger-300 hover:bg-danger-bg"
                                        : "text-text-primary hover:bg-surface-hover",
                                ].join(" ")}
                            >
                                {entry.icon}
                                <span className="flex-1">{entry.label}</span>
                                {entry.shortcut && (
                                    <span className="kbd">{entry.shortcut}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function DropdownChevron({ open }: { open: boolean }) {
    return (
        <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-[var(--duration-fast)] ${
                open ? "rotate-180" : ""
            }`}
        />
    );
}
