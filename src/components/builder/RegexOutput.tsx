import { Copy, CheckCircle2, XCircle } from "lucide-react";
import { useRegexMatcher } from "../../hooks/useRegexMatcher";
import { useRegexStore } from "../../store/regexStore";
import Button from "../../design-system/Button";
import { toast } from "../../design-system/toastStore";

const FLAGS = [{ flag: "i", label: "Ignore case" }, { flag: "m", label: "Multiline" }, { flag: "s", label: "Dot all" }];

export default function RegexOutput() {
  const { pattern, isValid, error } = useRegexMatcher();
  const flags = useRegexStore(s => s.flags);
  const toggleFlag = useRegexStore(s => s.toggleFlag);
  const handleCopy = () => {
    navigator.clipboard?.writeText(`/${pattern}/${flags}`);
    toast({ title: "Copied to clipboard", description: `/${pattern}/${flags}`, variant: "success" });
  };
  return <section className="regex-output-panel">
    <div className="regex-output-head"><div><span className="tool-eyebrow">COMPILED PATTERN</span><h2>Expression</h2></div><Button variant="ghost" size="xs" icon={<Copy className="w-3 h-3"/>} onClick={handleCopy} disabled={!pattern}>Copy</Button></div>
    <div className="regex-code-display"><span className="regex-delimiter">/</span><code>{pattern || "Your expression will appear here"}</code><span className="regex-delimiter">/</span><span className="regex-flags">{flags}</span></div>
    <div className={`regex-validity ${isValid ? "is-valid" : "is-invalid"}`}>{isValid ? <CheckCircle2 size={13}/> : <XCircle size={13}/>}<span>{isValid ? "Expression compiles" : error ?? "Invalid expression"}</span></div>
    <div className="regex-flags-row"><span>FLAGS</span>{FLAGS.map(({flag,label}) => <label key={flag} className={flags.includes(flag) ? "is-active" : ""}><input type="checkbox" checked={flags.includes(flag)} onChange={() => toggleFlag(flag)}/><code>{flag}</code>{label}</label>)}</div>
  </section>;
}
