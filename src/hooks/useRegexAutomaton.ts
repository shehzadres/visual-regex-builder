import { useMemo } from "react";
import { generateRegex } from "../engine/parser/regexGenerator";
import { parseRegex } from "../engine/ast/parser";
import { buildNFA } from "../engine/automata/thompsonConstruction";
import { nfaToGraph } from "../engine/automata/nfaGraph";
import { buildDFA } from "../engine/automata/subsetConstruction";
import { dfaToGraph } from "../engine/automata/dfaGraph";
import { minimizeDFA } from "../engine/automata/dfaMinimization";
import { compareAutomata } from "../engine/automata/automatonStats";
import { useRegexStore } from "../store/regexStore";
import type { AutomatonResult } from "../types/automata";

/**
 * Synchronization point for the full compiler pipeline: whenever the
 * builder's blocks change, the generated pattern is re-derived (reusing
 * the same generateRegex as the Week 2 matcher, so both stay identical),
 * then re-tokenized, re-parsed into an AST, re-compiled into an NFA via
 * Thompson's construction, re-determinized into a DFA via subset
 * construction, and re-minimized via Hopcroft's algorithm — with every
 * stage shaped into a D3-renderable graph and timed with performance.now().
 *
 * Every stage is wrapped so a malformed pattern never throws past this
 * hook — isValid/error describe the first stage that failed, and every
 * downstream field (ast/nfa/dfa/minimizedDfa/graphs/comparison) is null
 * beyond that point.
 */
export function useRegexAutomaton(): AutomatonResult {
    const blocks = useRegexStore((s) => s.blocks);

    const pattern = useMemo(() => generateRegex(blocks), [blocks]);

    return useMemo<AutomatonResult>(() => {
        const parseResult = parseRegex(pattern);

        if (!parseResult.isValid || !parseResult.ast) {
            return {
                pattern,
                isValid: false,
                error: parseResult.error,
                errorPosition: parseResult.errorPosition,
                ast: null,
                nfa: null,
                graph: null,
                dfa: null,
                dfaGraph: null,
                minimizedDfa: null,
                minimizedDfaGraph: null,
                comparison: null,
            };
        }

        try {
            const totalStart = performance.now();

            const nfaStart = performance.now();
            const nfa = buildNFA(parseResult.ast);
            const nfaConstructionMs = performance.now() - nfaStart;

            const graph = nfaToGraph(nfa);

            const dfaStart = performance.now();
            const dfa = buildDFA(nfa);
            const dfaConstructionMs = performance.now() - dfaStart;

            const dfaGraph = dfaToGraph(dfa);

            const minimizationStart = performance.now();
            const minimizedDfa = minimizeDFA(dfa);
            const minimizationMs = performance.now() - minimizationStart;

            const minimizedDfaGraph = dfaToGraph(minimizedDfa);

            const totalMs = performance.now() - totalStart;

            const comparison = compareAutomata(nfa, dfa, minimizedDfa, {
                nfaConstructionMs,
                dfaConstructionMs,
                minimizationMs,
                totalMs,
            });

            return {
                pattern,
                isValid: true,
                error: null,
                errorPosition: null,
                ast: parseResult.ast,
                nfa,
                graph,
                dfa,
                dfaGraph,
                minimizedDfa,
                minimizedDfaGraph,
                comparison,
            };
        } catch (err) {
            return {
                pattern,
                isValid: false,
                error:
                    err instanceof Error
                        ? err.message
                        : "Failed to build automaton",
                errorPosition: null,
                ast: parseResult.ast,
                nfa: null,
                graph: null,
                dfa: null,
                dfaGraph: null,
                minimizedDfa: null,
                minimizedDfaGraph: null,
                comparison: null,
            };
        }
    }, [pattern]);
}
