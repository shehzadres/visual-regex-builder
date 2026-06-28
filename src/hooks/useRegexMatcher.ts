import { useMemo } from "react";
import { generateRegex } from "../engine/parser/regexGenerator";
import { runRegexMatch } from "../engine/matcher/regexMatcher";
import { useRegexStore } from "../store/regexStore";
import type { RegexEngineResult } from "../types/match";

/**
 * Central synchronization point for the app: whenever builder blocks,
 * the user-supplied flags, or the test text change, this hook regenerates
 * the pattern string and re-runs it through the matching engine, producing
 * a single up-to-date RegexEngineResult for all downstream UI to consume.
 *
 * Because it relies on useMemo over store state, every consumer that
 * calls this hook re-renders with fresh results automatically — there is
 * no manual "run" step and no possibility of stale output.
 */
export function useRegexMatcher(): RegexEngineResult & { pattern: string } {
    const blocks = useRegexStore((s) => s.blocks);
    const testText = useRegexStore((s) => s.testText);
    const flags = useRegexStore((s) => s.flags);

    const pattern = useMemo(() => generateRegex(blocks), [blocks]);

    const result = useMemo(
        () => runRegexMatch(pattern, testText, { flags }),
        [pattern, testText, flags]
    );

    return result;
}
