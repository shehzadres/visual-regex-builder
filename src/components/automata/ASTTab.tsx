import { TreeDeciduous } from "lucide-react";
import { useRegexAutomaton } from "../../hooks/useRegexAutomaton";
import ASTViewer from "./ASTViewer";
import EmptyState from "../../design-system/EmptyState";
import Card from "../../design-system/Card";

export default function ASTTab() {
    const { pattern, isValid, error, ast } = useRegexAutomaton();

    if (pattern === "") {
        return (
            <EmptyState
                icon={<TreeDeciduous className="w-5 h-5" />}
                title="Nothing parsed yet"
                description="Add blocks in the Builder tab to see the parsed syntax tree here."
            />
        );
    }

    return (
        <Card className="h-full overflow-y-auto">
            <ASTViewer ast={ast} isValid={isValid} error={error} />
        </Card>
    );
}
