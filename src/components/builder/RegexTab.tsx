import RegexOutput from "./RegexOutput";
import TextInput from "../visualizer/TextInput";
import MatchVisualizer from "../visualizer/MatchVisualizer";

export default function RegexTab() {
  return <div className="regex-lab-layout">
    <aside className="regex-lab-input-column"><RegexOutput/><TextInput/></aside>
    <div className="regex-lab-results-column"><MatchVisualizer/></div>
  </div>;
}
