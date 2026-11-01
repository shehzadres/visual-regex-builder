import type { ReactNode, KeyboardEvent } from "react";

export interface TabItem<T extends string> {
    value: T;
    label: string;
    icon?: ReactNode;
    badge?: ReactNode;
}

interface TabsProps<T extends string> {
    items: TabItem<T>[];
    value: T;
    onChange: (value: T) => void;
    size?: "sm" | "md";
    className?: string;
    idPrefix?: string;
    ariaLabel?: string;
}

export default function Tabs<T extends string>({
    items,
    value,
    onChange,
    size = "md",
    className = "",
    idPrefix = "tabs",
    ariaLabel = "Sections",
}: TabsProps<T>) {
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const currentIndex = items.findIndex((item) => item.value === value);
        let nextIndex = currentIndex;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            nextIndex = (currentIndex + 1) % items.length;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            nextIndex = (currentIndex - 1 + items.length) % items.length;
        } else if (event.key === "Home") {
            nextIndex = 0;
        } else if (event.key === "End") {
            nextIndex = items.length - 1;
        } else {
            return;
        }
        event.preventDefault();
        const next = items[nextIndex];
        onChange(next.value);
        requestAnimationFrame(() => {
            document.getElementById(`${idPrefix}-${next.value}`)?.focus();
        });
    };

    return (
        <div
            role="tablist"
            aria-label={ariaLabel}
            onKeyDown={handleKeyDown}
            className={["flex items-center gap-1 h-full", className].join(" ")}
        >
            {items.map((item) => {
                const isActive = item.value === value;
                return (
                    <button
                        key={item.value}
                        id={`${idPrefix}-${item.value}`}
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`${idPrefix}-panel`}
                        tabIndex={isActive ? 0 : -1}
                        type="button"
                        onClick={() => onChange(item.value)}
                        className={[
                            "relative inline-flex h-full items-center gap-2 font-medium transition-colors duration-[var(--duration-fast)]",
                            "whitespace-nowrap px-3",
                            size === "sm" ? "text-[11px]" : "text-[13px]",
                            isActive
                                ? "text-accent-600"
                                : "text-text-tertiary hover:text-text-primary",
                        ].join(" ")}
                    >
                        {item.icon}
                        {item.label}
                        {item.badge}
                        {isActive && (
                            <span className="absolute left-3 right-3 bottom-0 h-[2px] rounded-full bg-accent-500" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
