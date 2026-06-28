import type { ReactNode } from "react";

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
}

export default function Tabs<T extends string>({
    items,
    value,
    onChange,
    size = "md",
    className = "",
}: TabsProps<T>) {
    return (
        <div
            role="tablist"
            className={["flex items-center gap-1", className].join(" ")}
        >
            {items.map((item) => {
                const isActive = item.value === value;
                return (
                    <button
                        key={item.value}
                        role="tab"
                        aria-selected={isActive}
                        type="button"
                        onClick={() => onChange(item.value)}
                        className={[
                            "relative inline-flex items-center gap-1.5 font-medium transition-colors duration-[var(--duration-fast)]",
                            "rounded-md whitespace-nowrap",
                            size === "sm"
                                ? "h-7 px-2.5 text-xs"
                                : "h-8 px-3 text-sm",
                            isActive
                                ? "text-text-primary bg-surface-raised"
                                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover",
                        ].join(" ")}
                    >
                        {item.icon}
                        {item.label}
                        {item.badge}
                        {isActive && (
                            <span className="absolute left-2 right-2 -bottom-[5px] h-[2px] rounded-full bg-accent-500" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
