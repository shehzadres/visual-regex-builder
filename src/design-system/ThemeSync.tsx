import { useEffect } from "react";
import { useUIStore } from "../store/uiStore";

export default function ThemeSync() {
    const theme = useUIStore((s) => s.theme);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    return null;
}
