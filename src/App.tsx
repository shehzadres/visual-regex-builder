import TopBar from "./components/shell/TopBar";
import Sidebar from "./components/shell/Sidebar";
import Workspace from "./components/shell/Workspace";
import Inspector from "./components/shell/Inspector";
import BottomDock from "./components/shell/BottomDock";
import CommandPalette from "./components/shell/CommandPalette";
import ToastViewport from "./design-system/Toast";
import ThemeSync from "./design-system/ThemeSync";
import { useConsoleLogging } from "./hooks/useConsoleLogging";

function App() {
    useConsoleLogging();

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-canvas text-text-primary">
            <ThemeSync />
            <TopBar />

            <div className="flex-1 flex min-h-0">
                <Sidebar />
                <Workspace />
                <Inspector />
            </div>

            <BottomDock />

            <CommandPalette />
            <ToastViewport />
        </div>
    );
}

export default App;
