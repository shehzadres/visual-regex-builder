# Contributing to Visual Regex Builder & Debugger

Thanks for considering a contribution. This is primarily an educational
project — a from-scratch implementation of regex compiler theory wrapped
in a real, usable tool — so contributions that improve correctness,
clarity, or pedagogical value are especially welcome.

## Before you start

1. Read the [README](./README.md) in full, especially **Project
   architecture** and **The compiler pipeline, stage by stage**. The
   codebase is small enough that understanding the data flow before
   editing will save you time.
2. Open an issue describing what you want to change *before* writing a
   large amount of code, so we can agree on the approach. Small fixes
   (typos, obvious bugs) can skip this step.

## Development setup

```bash
git clone https://github.com/shehzadres/visual-regex-builder.git
cd visual-regex-builder
npm install
npm run dev
```

See the README's **Getting started** section for prerequisites.

## The golden rule for engine changes

If you're adding or modifying regex syntax support, **it must flow
through the entire pipeline consistently**:

```
tokenizer → parser/AST → Thompson's construction → subset construction →
Hopcroft minimization → graph rendering → simulator
```

Adding support at only one stage (e.g. teaching the tokenizer about a new
escape sequence but not the AST builder or Thompson's construction) will
make the Builder, Regex, AST, NFA, and DFA tabs disagree with each other
about what the pattern means. Every engine change should be traceable
through `src/engine/lexer/` → `src/engine/ast/` →
`src/engine/automata/thompsonConstruction.ts` →
`src/engine/automata/subsetConstruction.ts` →
`src/engine/automata/dfaMinimization.ts`.

## Verifying correctness

This project does not ship a permanent automated test suite (see
**Design notes and known limitations** in the README for why), but every
non-trivial engine change should be verified before you open a PR:

1. **Cross-validate against native `RegExp`.** Write a throwaway script
   that runs your changed pattern through both your engine code and
   JavaScript's built-in `RegExp` across a range of test strings, and
   confirm they agree. This is how every stage of the engine was
   originally verified.
2. **Check minimization never grows the DFA.** If you touch
   `dfaMinimization.ts`, confirm the minimized DFA's state count is
   always less than or equal to the unminimized DFA's, and that it still
   accepts exactly the same language (simulate both and compare).
3. **If you touch anything with `useEffect`, `useMemo`, or a Zustand
   selector**, actually render the component and interact with it — don't
   rely on `tsc`/lint alone. This project has twice shipped infinite
   render loops that passed type-checking and linting cleanly but hung
   the browser tab in practice (a `useMemo`-less simulation recompute,
   and a Zustand selector returning a freshly-filtered array on every
   render). A quick `@testing-library/react` render-and-click smoke test
   (install temporarily, delete before committing) catches this class of
   bug; a type-checker cannot.
4. **Run the standard checks**:
   ```bash
   npm run lint
   npx tsc -b
   npm run build
   ```

## Code style

- Match the existing formatting (4-space indentation, no semicolon
  omission debates — just follow what's already there).
- Prefer small, focused files. The codebase is organized as
  tokenizer → parser → automata → benchmark on the engine side, and
  shell → design-system → feature tabs on the UI side; new files should
  fit one of these categories rather than introducing a new top-level
  pattern.
- UI components should use the shared primitives in
  `src/design-system/` (`Button`, `Input`, `Badge`, `Card`,
  `EmptyState`, etc.) rather than ad hoc markup, so the whole app keeps
  one consistent visual language.
- Don't add a new state management library, CSS framework, or icon set —
  Zustand, Tailwind v4, and `lucide-react` are the established choices.

## Scope boundaries

This project intentionally does not support lookaheads, lookbehinds,
backreferences, or Unicode property escapes (see **Design notes and known
limitations** in the README). Adding these is welcome if you're willing
to thread them through the full pipeline above — they are non-trivial for
Thompson's construction and subset construction in particular (especially
backreferences, which are not regular and cannot be represented by a
finite automaton at all — that would require a different, explicitly
backtracking execution model alongside the existing automaton-based one,
not a small patch to it).

## Submitting a pull request

1. Fork the repo and create a branch from `main`.
2. Make your change, verify it per the steps above.
3. Update the README if you've changed behavior, added a feature, or
   changed the project structure.
4. Open a PR with a clear description of what changed and why, and how
   you verified it.

## Reporting bugs

Open an issue with:
- The exact regex pattern (built via blocks or otherwise) that triggers
  the problem.
- Which tab/feature it happened in (Builder, Regex, AST, NFA, DFA,
  Benchmark).
- What you expected vs. what happened.
- Browser/OS if it looks rendering-related.

## License

By contributing, you agree your contributions will be licensed under the
project's [MIT License](./LICENSE).
