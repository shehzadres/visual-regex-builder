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
        "bg-accent-500 text-[#0a0c10] hover:bg-accent-400 active:bg-accent-600 shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset]",
    secondary:
        "bg-surface-raised text-text-primary border border-border-default hover:border-border-strong hover:bg-surface-overlay",
    ghost: "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-transparent",
    subtle:
        "bg-surface text-text-secondary border border-border-subtle hover:text-text-primary hover:border-border-default",
    danger:
        "bg-transparent text-danger-300 border border-danger-600/40 hover:bg-danger-bg hover:border-danger-500",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
    xs: "h-6 px-2 text-[11px] gap-1 rounded-sm",
    sm: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
    md: "h-8 px-3.5 text-sm gap-2 rounded-md",
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
                "disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97]",
                VARIANT_CLASSES[variant],
                SIZE_CLASSES[size],
                active
                    ? "ring-1 ring-inset ring-accent-500 text-text-primary bg-surface-overlay"
                    : "",
                iconOnly ? "px-0 w-7" : "",
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
