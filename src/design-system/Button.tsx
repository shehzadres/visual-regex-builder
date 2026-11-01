import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type ButtonSize = "xs" | "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children?: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    active?: boolean;
    icon?: ReactNode;
    iconOnly?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    primary:
        "bg-accent-600 text-white hover:bg-accent-500 active:bg-accent-700 border border-accent-600 shadow-xs",
    secondary:
        "bg-surface text-text-primary border border-border-default hover:border-border-strong hover:bg-surface-overlay",
    ghost: "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-transparent",
    subtle:
        "bg-canvas text-text-secondary border border-border-subtle hover:text-text-primary hover:border-border-default",
    danger:
        "bg-transparent text-danger-500 border border-danger-500/30 hover:bg-danger-bg hover:border-danger-500/50",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
    xs: "h-7 px-2.5 text-[11px] gap-1.5 rounded-md",
    sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
    md: "h-9 px-3.5 text-[13px] gap-2 rounded-lg",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
        children,
        variant = "secondary",
        size = "sm",
        active = false,
        icon,
        iconOnly = false,
        className = "",
        ...rest
    },
    ref
) {
    return (
        <button
            ref={ref}
            type="button"
            className={[
                "inline-flex items-center justify-center font-medium whitespace-nowrap select-none",
                "transition-[background-color,border-color,color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out)]",
                "disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]",
                VARIANT_CLASSES[variant],
                SIZE_CLASSES[size],
                active ? "ring-1 ring-inset ring-accent-500 text-accent-700 bg-accent-50" : "",
                iconOnly ? "px-0 w-8" : "",
                className,
            ].join(" ")}
            {...rest}
        >
            {icon}
            {!iconOnly && children}
        </button>
    );
});

export default Button;
