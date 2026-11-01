import { useState } from "react";
import { Play, Gauge, ShieldAlert } from "lucide-react";
import { createDefaultBenchmarkConfig, runBenchmarkSuite } from "../../engine/benchmark/benchmarkRunner";
import type { BenchmarkSummary } from "../../engine/benchmark/benchmarkTypes";
import { useRegexAutomaton } from "../../hooks/useRegexAutomaton";
import BenchmarkTable from "./BenchmarkTable";
import BenchmarkChart from "./BenchmarkChart";
import BacktrackWarningBanner from "./BacktrackWarning";
import Button from "../../design-system/Button";
import { formatDuration } from "../../utils/textHelpers";

export default function BenchmarkPanel() {
  const { pattern, isValid } = useRegexAutomaton();
  const [summaries, setSummaries] = useState<BenchmarkSummary[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [includeCurrentPattern, setIncludeCurrentPattern] = useState(true);
  const handleRun = () => {
    setIsRunning(true);
    const extraPatterns = includeCurrentPattern && isValid && pattern !== "" ? [{ id: "current-pattern", label: "Current builder pattern", pattern }] : [];
    window.setTimeout(() => {
      const results = runBenchmarkSuite(createDefaultBenchmarkConfig(extraPatterns));
      setSummaries(results);
      setIsRunning(false);
    }, 0);
  };
  const riskyCount = summaries?.filter(s => s.warning.riskLevel === "high").length ?? 0;
  const completedRuns = summaries?.flatMap(s => s.runs.filter(r => !r.timedOut && !r.error)) ?? [];
  const slowestRun = completedRuns.length ? completedRuns.reduce((a,b) => a.executionTimeMs > b.executionTimeMs ? a : b) : null;

  return <section className="tool-view benchmark-view">
    <header className="tool-view-head"><div><span className="tool-eyebrow">05 / PERFORMANCE LAB</span><h1>Benchmark laboratory</h1><p>Measure execution cost as input grows. Spot unsafe patterns before they ship.</p></div><div className="benchmark-run-control"><label><input type="checkbox" checked={includeCurrentPattern} onChange={e => setIncludeCurrentPattern(e.target.checked)}/> Include current expression</label><Button variant="primary" size="md" onClick={handleRun} disabled={isRunning} icon={<Play className="w-3.5 h-3.5"/>}>{isRunning ? "Running…" : "Run benchmark"}</Button></div></header>
    <div className="benchmark-method-note"><ShieldAlert size={15}/><p>Fixed pattern suite across increasing dataset sizes. Structurally risky expressions are isolated and tested against short adversarial inputs to avoid runaway execution.</p><code>performance.now()</code></div>
    {summaries === null ? <div className="tool-panel benchmark-empty"><div className="benchmark-empty-mark"><Gauge size={28}/><span>LAB / 01</span></div><div><span className="tool-eyebrow">AWAITING MEASUREMENT</span><h2>Performance is a property, not a guess.</h2><p>Run the suite to compare common expressions, inspect execution growth and flag catastrophic backtracking risks.</p></div><div className="benchmark-empty-foot"><span>01 · EXECUTION TIME</span><span>02 · INPUT GROWTH</span><span>03 · BACKTRACK RISK</span></div></div> : <div className="benchmark-results">
      <div className="benchmark-stat-row"><div><span>PATTERNS TESTED</span><strong>{summaries.length}</strong></div><div><span>HIGH RISK</span><strong className={riskyCount ? "risk-value" : ""}>{riskyCount}</strong></div><div><span>SLOWEST RUN</span><strong>{slowestRun ? formatDuration(slowestRun.executionTimeMs) : "—"}</strong><small>{slowestRun?.patternLabel ?? "No completed runs"}</small></div><div><span>COMPLETED RUNS</span><strong>{completedRuns.length}</strong></div></div>
      {summaries.filter(s => s.warning.riskLevel !== "none").map(s => <BacktrackWarningBanner key={s.patternId} warning={s.warning}/>)}
      <div className="tool-panel benchmark-chart-panel"><div className="tool-panel-head"><div><span className="tool-panel-index">A</span><strong>Execution time by input size</strong></div><span><Gauge size={13}/> PERFORMANCE PROFILE</span></div><BenchmarkChart summaries={summaries}/></div>
      <div className="tool-panel benchmark-table-panel"><div className="tool-panel-head"><div><span className="tool-panel-index">B</span><strong>Run detail</strong></div><span>{completedRuns.length} COMPLETED MEASUREMENTS</span></div><BenchmarkTable summaries={summaries}/></div>
    </div>}
  </section>;
}
