import { useEffect, useRef } from "react";
import { useRegexMatcher } from "./useRegexMatcher";
import { useRegexAutomaton } from "./useRegexAutomaton";
import { useConsoleLogStore } from "../store/consoleLogStore";

/**
 * Watches the live matcher and automaton pipeline results and appends
 * console log entries whenever something console-worthy actually changes
 * — pattern became invalid/valid, automaton construction completed, etc.
 * — rather than logging on every keystroke. Mounted once near the app
 * root so the Console dock reflects genuine pipeline activity.
 */
export function useConsoleLogging(): void {
    const { pattern, isValid, error } = useRegexMatcher();
    const { comparison, isValid: automatonValid } = useRegexAutomaton();
    const log = useConsoleLogStore((s) => s.log);

    const lastValidityRef = useRef<boolean | null>(null);
    const lastPatternRef = useRef<string>("");

    useEffect(() => {
        if (pattern === "") {
            lastValidityRef.current = null;
            lastPatternRef.current = "";
            return;
        }

        if (lastPatternRef.current === pattern) return;
        lastPatternRef.current = pattern;

        if (!isValid) {
            log("error", `Invalid pattern: /${pattern}/`, error ?? undefined);
        } else if (lastValidityRef.current === false || lastValidityRef.current === null) {
            log("success", `Pattern compiled: /${pattern}/`);
        }

        lastValidityRef.current = isValid;
    }, [pattern, isValid, error, log]);

    const lastComparisonPatternRef = useRef<string>("");
    useEffect(() => {
        if (!comparison || !automatonValid) return;
        if (lastComparisonPatternRef.current === pattern) return;
        lastComparisonPatternRef.current = pattern;

        log(
            "info",
            `Automaton built: NFA ${comparison.nfa.stateCount} states → DFA ${comparison.dfa.stateCount} → minimized ${comparison.minimizedDfa.stateCount}`,
            `Total pipeline time: ${comparison.timing.totalMs.toFixed(2)}ms`
        );
    }, [comparison, automatonValid, pattern, log]);
}
