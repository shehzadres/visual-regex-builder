import { Boxes, Regex, TreeDeciduous, Settings2, GitBranch, BarChart3 } from "lucide-react";
import { useUIStore, type WorkspaceTab as WorkspaceTabValue } from "../../store/uiStore";
import Tabs from "../../design-system/Tabs";
import BuilderTab from "../builder/BuilderTab";
import RegexTab from "../builder/RegexTab";
import ASTTab from "../automata/ASTTab";
import NFATab from "../automata/NFATab";
import DFATab from "../automata/DFATab";
import BenchmarkTab from "../benchmark/BenchmarkTab";

const WORKSPACE_TABS: Array<{value:WorkspaceTabValue;label:string;icon:React.ReactNode;number:string;hint:string}> = [
 {value:"builder",label:"Builder",icon:<Boxes className="w-3.5 h-3.5"/>,number:"01",hint:"Compose"},
 {value:"regex",label:"Regex",icon:<Regex className="w-3.5 h-3.5"/>,number:"02",hint:"Test"},
 {value:"ast",label:"Syntax tree",icon:<TreeDeciduous className="w-3.5 h-3.5"/>,number:"03",hint:"Parse"},
 {value:"nfa",label:"NFA",icon:<Settings2 className="w-3.5 h-3.5"/>,number:"04",hint:"Thompson"},
 {value:"dfa",label:"DFA",icon:<GitBranch className="w-3.5 h-3.5"/>,number:"05",hint:"Minimize"},
 {value:"benchmark",label:"Benchmark",icon:<BarChart3 className="w-3.5 h-3.5"/>,number:"06",hint:"Measure"},
];
export default function Workspace() {
 const active=useUIStore(s=>s.activeWorkspaceTab);
 const setActive=useUIStore(s=>s.setActiveWorkspaceTab);
 return <main className="app-workspace">
   <nav className="app-workspace-nav" aria-label="Application workspaces">
    <div className="app-nav-caption">PIPELINE</div>
    <Tabs value={active} onChange={setActive} items={WORKSPACE_TABS.map(t=>({...t,label:<span className="app-tab-label"><span className="app-tab-number">{t.number}</span><span>{t.label}</span><small>{t.hint}</small></span>}))} idPrefix="workspace" ariaLabel="Workspace views"/>
    <div className="app-nav-foot"><span className="app-nav-foot-dot"/> ENGINE READY <span>v1.0</span></div>
   </nav>
   <div id="workspace-panel" role="tabpanel" aria-labelledby={`workspace-${active}`} tabIndex={0} className="app-workspace-content">
    {active==="builder"&&<BuilderTab/>}{active==="regex"&&<RegexTab/>}{active==="ast"&&<ASTTab/>}{active==="nfa"&&<NFATab/>}{active==="dfa"&&<DFATab/>}{active==="benchmark"&&<BenchmarkTab/>}
   </div>
 </main>;
}
