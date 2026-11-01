import TopBar from "./components/shell/TopBar";
import Sidebar from "./components/shell/Sidebar";
import Workspace from "./components/shell/Workspace";
import Inspector from "./components/shell/Inspector";
import BottomDock from "./components/shell/BottomDock";
import CommandPalette from "./components/shell/CommandPalette";
import ToastViewport from "./design-system/Toast";
import ThemeSync from "./design-system/ThemeSync";
import { useConsoleLogging } from "./hooks/useConsoleLogging";
import { useUIStore } from "./store/uiStore";

function App() {
 useConsoleLogging();
 const activeWorkspaceTab=useUIStore(s=>s.activeWorkspaceTab);
 return <div className="app-shell">
  <ThemeSync/>
  <TopBar/>
  <div className="app-body">
   <Sidebar/>
   <Workspace/>
   {activeWorkspaceTab!=="builder"&&<Inspector/>}
  </div>
  <BottomDock/>
  <CommandPalette/>
  <ToastViewport/>
 </div>;
}
export default App;
