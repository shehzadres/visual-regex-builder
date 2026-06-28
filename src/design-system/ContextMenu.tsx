import { useEffect, useRef, useState, type ReactNode } from "react";
import type { MenuEntry } from "./DropdownMenu";

interface ContextMenuProps {
    children: ReactNode;
    items: MenuEntry[];
}

function isSeparator(
    entry: MenuEntry
): entry is { id: string; type: "separator" } {
    return "type" in entry && entry.type === "separator";
}

export default function ContextMenu({ children, items }: ContextMenuProps) {
    const [position, setPosition] = useState<{ x: number; y: number } | null>(
        null
    );
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!position) return;

        function handleClick(e: MouseEvent) {
            if (!menuRef.current?.contains(e.target as Node)) {
                setPosition(null);
            }
        }
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") setPosition(null);
        }

        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKey);
        document.addEventListener("scroll", () => setPosition(null), true);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKey);
        };
    }, [position]);

    return (
        <div
            onContextMenu={(e) => {
                e.preventDefault();
                setPosition({ x: e.clientX, y: e.clientY });
            }}
        >
            {children}
            {position && (
                <div
                    ref={menuRef}
                    role="menu"
                    style={{ top: position.y, left: position.x }}
                    className={[
                        "fixed z-[200] min-w-[180px] py-1 rounded-lg",
                        "bg-surface-overlay border border-border-default shadow-lg",
                        "animate-[panel-fade-in_var(--duration-fast)_var(--ease-out)]",
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
                                    setPosition(null);
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
