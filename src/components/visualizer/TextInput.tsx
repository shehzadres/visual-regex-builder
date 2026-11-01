import { useRegexStore } from "../../store/regexStore";
import { Textarea } from "../../design-system/Input";

export default function TextInput() {
  const testText = useRegexStore(s => s.testText);
  const setTestText = useRegexStore(s => s.setTestText);
  return <section className="test-input-panel">
    <div className="test-input-head"><div><span className="tool-eyebrow">SAMPLE DATA</span><h2>Test string</h2></div><span>{testText.length.toLocaleString()} CHARS</span></div>
    <Textarea id="test-text-input" mono value={testText} onChange={e => setTestText(e.target.value)} className="test-string-area" placeholder="Paste or type sample text to inspect against the expression…" spellCheck={false}/>
    <div className="test-input-foot"><span>LIVE MATCHING</span><span>INPUT UPDATES AS YOU TYPE</span></div>
  </section>;
}
