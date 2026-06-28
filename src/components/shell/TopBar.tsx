import { Moon, Sun, Settings, Search, Regex, CircleDot } from "lucide-react";
import { useUIStore } from "../../store/uiStore";
import { useRegexMatcher } from "../../hooks/useRegexMatcher";
import Tooltip from "../../design-system/Tooltip";
import Badge from "../../design-system/Badge";

export default function TopBar() {
    const theme = useUIStore((s) => s.theme);
    const toggleTheme = useUIStore((s) => s.toggleTheme);
    const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
    const { isValid, pattern } = useRegexMatcher();

    return (
        <header className="h-12 shrink-0 flex items-center justify-between gap-4 px-3 bg-surface border-b border-border-subtle select-none">
            <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-accent-500/15 text-accent-400 shrink-0">
                    <Regex className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-text-primary whitespace-nowrap">
                        Visual Regex Builder
                    </span>
                    <span className="text-text-tertiary text-xs hidden sm:inline">
                        /
                    </span>
                    <span className="text-xs text-text-secondary hidden sm:inline truncate max-w-[220px]">
                        untitled-pattern
                    </span>
                </div>
            </div>

            <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden md:flex items-center gap-2 h-7 px-2.5 rounded-md bg-surface-raised border border-border-default text-text-tertiary text-xs hover:border-border-strong hover:text-text-secondary transition-colors w-72"
            >
                <Search className="w-3.5 h-3.5" />
                <span className="flex-1 text-left">
                    Search patterns, actions…
                </span>
                <span className="kbd">⌘K</span>
            </button>

            <div className="flex items-center gap-2 shrink-0">
                {pattern !== "" && (
                    <Badge
                        variant={isValid ? "success" : "danger"}
                        dot
                        className="hidden sm:inline-flex"
                    >
                        {isValid ? "Valid pattern" : "Invalid pattern"}
                    </Badge>
                )}
                {pattern === "" && (
                    <Badge
                        variant="neutral"
                        dot
                        className="hidden sm:inline-flex"
                    >
                        <CircleDot className="w-3 h-3 -ml-0.5" />
                        No pattern yet
                    </Badge>
                )}

                <Tooltip
                    label={
                        theme === "dark"
                            ? "Switch to light theme"
                            : "Switch to dark theme"
                    }
                >
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="flex items-center justify-center w-7 h-7 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                    >
                        {theme === "dark" ? (
                            <Moon className="w-4 h-4" />
                        ) : (
                            <Sun className="w-4 h-4" />
                        )}
                    </button>
                </Tooltip>

                <Tooltip label="Settings">
                    <button
                        type="button"
                        aria-label="Settings"
                        className="flex items-center justify-center w-7 h-7 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </Tooltip>
            </div>
        </header>
    );
}
