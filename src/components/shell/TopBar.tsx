import { Moon, Sun, Search, Regex, CheckCircle2, AlertCircle, Command } from "lucide-react";
import { useUIStore } from "../../store/uiStore";
import { useRegexMatcher } from "../../hooks/useRegexMatcher";
import Tooltip from "../../design-system/Tooltip";

export default function TopBar() {
    const theme = useUIStore((s) => s.theme);
    const toggleTheme = useUIStore((s) => s.toggleTheme);
    const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
    const { isValid, pattern } = useRegexMatcher();

    return (
        <header className="app-topbar">
            <div className="app-brand">
                <div className="app-brand-mark"><Regex size={19} strokeWidth={1.8}/></div>
                <div className="app-brand-copy"><strong>Regex<span>Lab</span></strong><small>VISUAL AUTOMATA WORKBENCH</small></div>
                <span className="app-version">BETA</span>
            </div>
            <div className="app-topbar-center">
                <span className="app-breadcrumb">WORKSPACE</span><span className="app-breadcrumb-slash">/</span><strong>Untitled pattern</strong>
            </div>
            <div className="app-topbar-actions">
                <button type="button" onClick={() => setCommandPaletteOpen(true)} className="app-command-trigger" aria-label="Search patterns and actions">
                    <Search size={14}/><span>Quick find</span><kbd><Command size={10}/> K</kbd>
                </button>
                <div className="app-validity" aria-live="polite">
                    {pattern === "" ? <i className="idle"/> : isValid ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
                    <span>{pattern === "" ? "No expression" : isValid ? "Valid expression" : "Syntax error"}</span>
                </div>
                <Tooltip label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
                    <button type="button" onClick={toggleTheme} aria-label="Toggle theme" className="app-theme-toggle">
                        {theme === "dark" ? <Sun size={15}/> : <Moon size={15}/>}
                    </button>
                </Tooltip>
            </div>
        </header>
    );
}
