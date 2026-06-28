import {
    Boxes,
    Regex,
    TreeDeciduous,
    Settings2,
    GitBranch,
    BarChart3,
} from "lucide-react";
import { useUIStore, type WorkspaceTab as WorkspaceTabValue } from "../../store/uiStore";
import Tabs from "../../design-system/Tabs";
import BuilderTab from "../builder/BuilderTab";
import RegexTab from "../builder/RegexTab";
import ASTTab from "../automata/ASTTab";
import NFATab from "../automata/NFATab";
import DFATab from "../automata/DFATab";
import BenchmarkTab from "../benchmark/BenchmarkTab";

const WORKSPACE_TABS: Array<{
    value: WorkspaceTabValue;
    label: string;
    icon: React.ReactNode;
}> = [
    { value: "builder", label: "Builder", icon: <Boxes className="w-3.5 h-3.5" /> },
    { value: "regex", label: "Regex", icon: <Regex className="w-3.5 h-3.5" /> },
    { value: "ast", label: "AST", icon: <TreeDeciduous className="w-3.5 h-3.5" /> },
    { value: "nfa", label: "NFA", icon: <Settings2 className="w-3.5 h-3.5" /> },
    { value: "dfa", label: "DFA", icon: <GitBranch className="w-3.5 h-3.5" /> },
    { value: "benchmark", label: "Benchmark", icon: <BarChart3 className="w-3.5 h-3.5" /> },
];

export default function Workspace() {
    const activeWorkspaceTab = useUIStore((s) => s.activeWorkspaceTab);
    const setActiveWorkspaceTab = useUIStore((s) => s.setActiveWorkspaceTab);

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-canvas">
            <div className="flex items-center px-3 h-10 shrink-0 border-b border-border-subtle bg-surface">
                <Tabs
                    value={activeWorkspaceTab}
                    onChange={setActiveWorkspaceTab}
                    items={WORKSPACE_TABS}
                />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
                {activeWorkspaceTab === "builder" && <BuilderTab />}
                {activeWorkspaceTab === "regex" && <RegexTab />}
                {activeWorkspaceTab === "ast" && <ASTTab />}
                {activeWorkspaceTab === "nfa" && <NFATab />}
                {activeWorkspaceTab === "dfa" && <DFATab />}
                {activeWorkspaceTab === "benchmark" && <BenchmarkTab />}
            </div>
        </div>
    );
}
