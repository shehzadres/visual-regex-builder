import RegexOutput from "./RegexOutput";
import TextInput from "../visualizer/TextInput";
import MatchVisualizer from "../visualizer/MatchVisualizer";
import Card from "../../design-system/Card";

export default function RegexTab() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            <Card className="overflow-y-auto">
                <RegexOutput />
            </Card>
            <div className="flex flex-col gap-4 overflow-y-auto">
                <Card>
                    <TextInput />
                </Card>
                <MatchVisualizer />
            </div>
        </div>
    );
}
