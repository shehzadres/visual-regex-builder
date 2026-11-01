import { useState } from "react";
import { AlertTriangle, ScanSearch } from "lucide-react";
import { useRegexMatcher } from "../../hooks/useRegexMatcher";
import HighlightedText from "./HighlightedText";
import MatchControls from "./MatchControls";
import MatchLegend from "./MatchLegend";
import CaptureGroups from "./CaptureGroups";
import EmptyState from "../../design-system/EmptyState";

export default function MatchVisualizer() {
  const { segments, matches, stats, isValid, error, pattern } = useRegexMatcher();
  const [activeMatchIndex, setActiveMatchIndex] = useState<number | null>(null);
  const maxGroupCount = matches.reduce((max, match) => Math.max(max, match.groups.length), 0);
  if (!isValid) return <div className="tool-empty-wrap"><EmptyState icon={<AlertTriangle className="w-5 h-5" />} title="Invalid expression" description={error ?? "The current pattern could not be compiled."} /></div>;
  if (!pattern) return <div className="tool-empty-wrap"><EmptyState icon={<ScanSearch className="w-5 h-5" />} title="Ready when you are" description="Build an expression, then enter sample text to inspect matches and capture groups." /></div>;
  return <section className="tool-view test-view">
    <header className="tool-view-head"><div><span className="tool-eyebrow">01 / MATCH ENGINE</span><h1>Regex test bench</h1><p>Inspect every match, offset and capture group in your sample.</p></div><div className="tool-expression"><span>ACTIVE EXPRESSION</span><code>/{pattern}/</code></div></header>
    <MatchControls totalMatches={matches.length} activeMatchIndex={activeMatchIndex} onSelectMatch={setActiveMatchIndex} stats={stats}/>
    <div className="tool-panel match-output"><div className="tool-panel-head"><div><span className="tool-panel-index">A</span><strong>Matched text</strong></div><span>{matches.length} {matches.length === 1 ? "MATCH" : "MATCHES"} FOUND</span></div><div className="highlighted-text-stage"><HighlightedText segments={segments} activeMatchIndex={activeMatchIndex}/></div>{maxGroupCount > 0 && <div className="match-legend-wrap"><MatchLegend groupCount={maxGroupCount}/></div>}</div>
    <div className="tool-panel capture-panel"><div className="tool-panel-head"><div><span className="tool-panel-index">B</span><strong>Capture groups</strong></div><span>{maxGroupCount} GROUPS DEFINED</span></div><CaptureGroups matches={matches} activeMatchIndex={activeMatchIndex}/></div>
  </section>;
}
