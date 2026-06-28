import { useRegexStore } from "../../store/regexStore";
import { Textarea } from "../../design-system/Input";

export default function TextInput() {
    const testText = useRegexStore((s) => s.testText);
    const setTestText = useRegexStore((s) => s.setTestText);

    return (
        <div className="flex flex-col gap-1.5">
            <label
                htmlFor="test-text-input"
                className="text-xs font-semibold uppercase tracking-wider text-text-tertiary"
            >
                Test text
            </label>
            <Textarea
                id="test-text-input"
                mono
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="h-32"
                placeholder="Enter text to test your regex against..."
                spellCheck={false}
            />
        </div>
    );
}
