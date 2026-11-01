import { Moon, Sun, Search, Regex, CheckCircle2, AlertCircle } from "lucide-react";
import { useUIStore } from "../../store/uiStore";
import { useRegexMatcher } from "../../hooks/useRegexMatcher";
import Tooltip from "../../design-system/Tooltip";

export default function TopBar() {
    const theme = useUIStore((s) => s.theme);
    const toggleTheme = useUIStore((s) => s.toggleTheme);
    const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
    const { isValid, pattern } = useRegexMatcher();

    return (
        <header className="h-14 shrink-0 flex items-center justify-between gap-5 px-5 bg-surface border-b border-border-subtle select-none">
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-[9px] bg-accent-50 text-accent-600 shrink-0">
                    <Regex className="w-[17px] h-[17px]" strokeWidth={2.1} />
                </div>
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[14px] font-semibold tracking-[-0.025em] text-text-primary whitespace-nowrap">
                        Regex Studio
                    </span>
                    <span className="text-border-strong">/</span>
                    <span className="text-[12px] text-text-tertiary hidden sm:inline truncate max-w-[180px]">
                        New pattern
                    </span>
                </div>
            </div>

            <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Search patterns and actions"
                className="hidden md:flex items-center gap-2.5 h-9 px-3 rounded-lg bg-canvas border border-border-subtle text-text-tertiary text-xs hover:border-border-default hover:text-text-secondary transition-colors w-[min(340px,32vw)]"
            >
                <Search className="w-3.5 h-3.5" />
                <span className="flex-1 text-left">Search patterns and actions</span>
                <span className="kbd">Ctrl K</span>
            </button>

            <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2 text-[11px] text-text-secondary">
                    {pattern === "" ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-text-disabled" />
                    ) : isValid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />
                    ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-danger-500" />
                    )}
                    <span>{pattern === "" ? "Waiting for a pattern" : isValid ? "Expression is valid" : "Check expression"}</span>
                </div>
                <div className="h-5 w-px bg-border-subtle" />
                <Tooltip label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                    >
                        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </Tooltip>
            </div>
        </header>
    );
}
