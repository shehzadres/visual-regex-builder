# Visual Regex Builder & Debugger — Complete Project Guide

This document is the full story of this project: what it is, why it
exists, how it was built milestone by milestone, every algorithm it
implements and how, every significant design decision and the reasoning
behind it, every bug that was caught during development and how it was
found and fixed, and how all the pieces fit together today. It assumes
no prior context — if you've never seen this codebase before, start here.

For a shorter, scannable reference (install instructions, feature list,
file tree), see [README.md](./README.md). This guide is the long-form
companion to it.

---

## Table of contents

1. [What this project is](#1-what-this-project-is)
2. [Who this is for](#2-who-this-is-for)
3. [High-level architecture](#3-high-level-architecture)
4. [Development history, milestone by milestone](#4-development-history-milestone-by-milestone)
   - [Milestone 1 — Visual builder](#milestone-1--visual-builder)
   - [Milestone 2 — Live regex debugger](#milestone-2--live-regex-debugger)
   - [Milestone 3 — Compiler pipeline & NFA visualization](#milestone-3--compiler-pipeline--nfa-visualization)
   - [Milestone 4 — DFA, minimization & performance benchmarking](#milestone-4--dfa-minimization--performance-benchmarking)
   - [Milestone 5 — Full IDE redesign](#milestone-5--full-ide-redesign)
   - [Milestone 6 — GitHub readiness](#milestone-6--github-readiness)
5. [The compiler pipeline in depth](#5-the-compiler-pipeline-in-depth)
6. [The state management layer](#6-the-state-management-layer)
7. [The design system](#7-the-design-system)
8. [The IDE shell](#8-the-ide-shell)
9. [Every bug caught during development, and how](#9-every-bug-caught-during-development-and-how)
10. [Design decisions and the reasoning behind them](#10-design-decisions-and-the-reasoning-behind-them)
11. [Known limitations and explicitly out-of-scope features](#11-known-limitations-and-explicitly-out-of-scope-features)
12. [Project statistics](#12-project-statistics)
13. [Glossary](#13-glossary)
14. [Where to go next](#14-where-to-go-next)

---

## 1. What this project is

**Visual Regex Builder & Debugger** is a browser-based application that
does two things at once:

1. **A practical tool.** You build a regular expression visually by
   dragging blocks (literal text, digit/word/whitespace classes, groups,
   quantifiers) instead of hand-writing regex syntax, then test it live
   against your own input text with match highlighting, capture-group
   color-coding, and statistics.

2. **A from-scratch implementation of regex compiler theory.** Every
   pattern you build is *also* run through a real compiler pipeline,
   implemented without any parsing or automata libraries:
   - a **tokenizer** (lexer) that turns the pattern string into tokens,
   - a **recursive descent parser** that turns tokens into an **Abstract
     Syntax Tree (AST)**,
   - **Thompson's construction**, the classical algorithm that turns the
     AST into a **Nondeterministic Finite Automaton (NFA)**,
   - **subset construction**, which determinizes the NFA into a
     **Deterministic Finite Automaton (DFA)**,
   - **Hopcroft's algorithm**, which minimizes the DFA to the smallest
     equivalent automaton,
   - and a **benchmarking module** that measures real execution
     performance and detects patterns prone to catastrophic
     backtracking (ReDoS) — both statically (by inspecting the AST) and
     dynamically (by measuring actual growth in execution time).

Every one of these stages is visualized: you can watch the AST as a
tree, the NFA and DFA as interactive, pannable/zoomable diagrams with a
step-by-step execution simulator, and the benchmark results as charts
and tables.

The whole thing is wrapped in a dark-first, IDE-style interface (think
VS Code, Linear, Raycast) with a resizable sidebar, a tabbed workspace,
a context-aware inspector panel, a bottom console/log dock, and a
command palette.

## 2. Who this is for

- **Students and self-learners of automata theory / compiler theory**
  who want to see Thompson's construction, subset construction, and
  Hopcroft's algorithm actually running on real input, instead of only
  reading about them.
- **Anyone who wants to build or debug a regex visually** without
  memorizing syntax, and see exactly why a pattern matches or doesn't.
- **Developers curious how regex engines work under the hood** —
  the entire engine is readable, commented TypeScript with no
  "magic" library doing the hard parts.
- **Contributors** who want to extend the regex feature set or the UI —
  see [CONTRIBUTING.md](./CONTRIBUTING.md).

## 3. High-level architecture

The application is a single-page React app with no backend — everything
(parsing, automata construction, benchmarking) runs client-side in the
browser. There is exactly **one source of truth for "what is the current
pattern"**: a Zustand store (`src/store/regexStore.ts`) holding an
ordered list of builder *blocks*. Every other piece of the app —
generated regex text, live matches, AST, NFA, DFA, benchmark results —
is *derived* from that block list, never duplicated or stored
separately. This is the single most important architectural fact about
the codebase: if you understand this, you understand why the app never
gets into an inconsistent state where (say) the AST tab disagrees with
the Regex tab about what the pattern means.

```
                         ┌─────────────────────┐
                         │   regexStore.ts      │   ← blocks: RegexBlock[]
                         │   (Zustand)          │      (the ONE source of truth)
                         └──────────┬───────────┘
                                    │
                    generateRegex(blocks) — same function,
                    called by both hooks below, so the pattern
                    string is provably identical everywhere
                                    │
                ┌───────────────────┴───────────────────┐
                ▼                                       ▼
     useRegexMatcher()                         useRegexAutomaton()
     (src/hooks/)                              (src/hooks/)
                │                                       │
                ▼                                       ▼
     runRegexMatch()                          tokenize() → parseRegex()
     - native RegExp, timed                            │
     - capture groups extracted                        ▼
     - segments for highlighting              buildNFA() — Thompson's construction
                │                                       │
                ▼                              ┌────────┴────────┐
     Regex tab: match highlighting,            ▼                 ▼
     capture group colors, stats        nfaToGraph()       buildDFA() — subset construction
                                               │                   │
                                               ▼            ┌──────┴──────┐
                                         NFA tab: D3 graph   ▼             ▼
                                         + simulator   dfaToGraph()  minimizeDFA() — Hopcroft's
                                                              │             │
                                                              ▼             ▼
                                                        DFA tab:      DFA tab: minimized
                                                        D3 graph      view + simulator
                                                        + simulator
```

The benchmarking module (`src/engine/benchmark/`) is independent of this
diagram — it runs a *fixed suite* of example patterns (plus, optionally,
your current builder pattern) against generated test data, not the live
matcher pipeline, since benchmarking needs to safely handle patterns that
might never even be valid or might be deliberately pathological.

## 4. Development history, milestone by milestone

This project was built incrementally over five major milestones, each
one verified working before moving to the next. This section describes
each milestone's scope, what was actually built, and what state the
project was in afterward.

### Milestone 1 — Visual builder

**Goal:** a drag-and-drop canvas for constructing a regex pattern out of
blocks, with no regex syntax knowledge required.

**What was built:**
- `RegexBlock` type: a block has a `type` (`literal | digit | word |
  whitespace | group | quantifier`), an optional `value`, and (for
  groups) a name and capturing flag.
- A Zustand store (`regexStore.ts`) holding the ordered block list, plus
  actions to add/remove/reorder/update blocks.
- A `Toolbox` of clickable buttons, one per block type, that append a
  new block to the canvas.
- A `Canvas` rendering the block list with `@dnd-kit` drag-and-drop
  reordering.
- `generateRegex(blocks)`: a pure function walking the block list and
  concatenating each block's regex fragment, with quantifier blocks
  modifying the fragment immediately before them rather than producing
  their own fragment (since `*`, `+`, `?` etc. are postfix operators in
  regex syntax, not standalone tokens).

**State at the end of this milestone:** you could visually assemble a
pattern and see the generated regex text update live, but there was no
way to test it against actual input yet.

### Milestone 2 — Live regex debugger

**Goal:** turn the builder into a real-time regex *debugger* — type test
text, see matches highlighted instantly, with capture groups and
statistics.

**What was built:**
- `runRegexMatch(pattern, text, options)`: compiles the pattern with
  native `RegExp`, defensively catching both compile errors (invalid
  syntax) and runtime errors, so a malformed pattern degrades to a clean
  "invalid" state instead of throwing and crashing the app.
- Execution timing via `performance.now()`, captured on every run.
- Capture group extraction, including **named** capture groups
  (`(?<name>...)`), using the regex `d` (`hasIndices`) flag so every
  group's exact start/end offset in the matched string is known — not
  just its text — which is what later allows precise color-coded
  highlighting.
- `generateSegments` / `HighlightedText`: slices the test text into
  "matched" and "unmatched" spans for rendering, while preserving 100%
  of the original text including whitespace and line breaks (a common
  bug in naive implementations is to accidentally trim or collapse
  whitespace when re-rendering highlighted text — this was deliberately
  avoided).
- A color palette (`utils/colors.ts`) assigning a stable, visually
  distinct color to each capture group index, reused consistently
  everywhere groups are displayed.
- Toggleable regex flags (`i` case-insensitive, `m` multiline, `s` dot-
  matches-newline).
- `useRegexMatcher()`: the hook that ties all of this together — re-runs
  `generateRegex` + `runRegexMatch` automatically via `useMemo` whenever
  blocks, test text, or flags change. No manual "run" button anywhere.

**State at the end of this milestone:** a fully working visual regex
builder + live debugger, comparable to (a simplified version of) tools
like regex101, but block-based instead of text-based.

### Milestone 3 — Compiler pipeline & NFA visualization

**Goal:** make the *theory* behind regex matching visible — tokenize the
pattern, parse it into an AST, compile that AST into an NFA via
Thompson's construction, and render the NFA as an interactive graph with
a step-by-step simulator.

**What was built:**
- `tokenizer.ts`: converts a pattern string into a token stream
  (literals, escaped classes `\d \w \s` and their negations, escaped
  literal characters, bracket character classes `[...]`, groups —
  capturing `(...)`, non-capturing `(?:...)`, named `(?<name>...)` —
  quantifiers `* + ? {n} {n,} {n,m}`, and alternation `|`). Malformed
  input (e.g. an unterminated character class) raises a typed
  `TokenizerError` with a position, rather than throwing an opaque
  exception.
- `parser.ts`: a **recursive descent parser** implementing the grammar
  `Alternation → Concat → Quantified → Atom` (see
  [section 5](#5-the-compiler-pipeline-in-depth) for the full grammar),
  producing a typed AST with node types `Literal`, `Concat`,
  `Alternation`, `Group`, `Quantifier`, `CharClass`, `EscapedClass`,
  `AnyChar`, and `Empty`.
- `ASTViewer`: a collapsible tree view rendering the AST for inspection.
- `thompsonConstruction.ts`: implements **Thompson's construction** —
  the classical algorithm (originally described by Ken Thompson in
  1968) for converting a regular expression's AST into an equivalent
  NFA. Each AST node type becomes a small NFA *fragment* with exactly
  one dangling start state and one dangling accept state; fragments are
  combined according to the node type (concatenation chains two
  fragments together; alternation creates a new branch/rejoin point;
  quantifiers add loop-back or skip ε-transitions).
- `nfaSimulator.ts`: a **true subset (powerset) simulator** — at each
  input character, it tracks the *entire set* of NFA states that could
  currently be active, exactly as a real NFA does, rather than greedily
  committing to one guess and potentially getting the wrong answer on
  ambiguous patterns.
- `NFAGraphView.tsx`: a D3.js force-directed graph renderer — pan, zoom,
  drag nodes, automatic layout (seeded from a BFS-layer position hint so
  it starts looking roughly like a left-to-right flow instead of random
  scatter), a start-state arrow, double-circle accepting states, and
  labeled transitions (epsilon transitions rendered dashed).
- `SimulatorControls.tsx`: play/pause/step/reset controls that animate
  the simulator's active-state-set over a typed input string, with the
  currently-active states and just-fired transitions highlighted live
  on the graph.

**State at the end of this milestone:** every pattern you build is now
also a real, animatable NFA you can watch process your input character
by character.

### Milestone 4 — DFA, minimization & performance benchmarking

**Goal:** determinize the NFA into a DFA via subset construction,
minimize it via Hopcroft's algorithm, visualize and compare all three
automata (NFA / DFA / minimized DFA), and add a benchmarking module that
measures real performance and detects catastrophic backtracking risk.

**What was built:**
- `epsilonClosure.ts`: exported, reusable `epsilonClosure()` (the
  "ECLOSE" operation from automata theory: every state reachable via
  zero or more ε-transitions) and `move()` (every state reachable by
  consuming one input symbol) functions — the two primitive operations
  subset construction is built from.
- `subsetConstruction.ts`: implements the **subset construction**
  algorithm to convert the NFA into a DFA. This needed real care beyond
  the textbook version of the algorithm — see
  [section 9](#9-every-bug-caught-during-development-and-how) for the
  overlapping-guard problem this surfaced and how it was solved.
- `dfaMinimization.ts`: implements **Hopcroft's algorithm** for DFA
  minimization via partition refinement — starts with two blocks
  (accepting / non-accepting states) and repeatedly splits any block
  whose members disagree about which block they transition into on some
  input symbol, using a worklist of (block, symbol) pairs, until the
  partition stabilizes. Two states end up in the same final block
  exactly when they are *Myhill–Nerode equivalent* (indistinguishable by
  any input string).
- `dfaSimulator.ts`: a DFA simulator — much simpler than the NFA one,
  since a DFA has at most one active state and at most one matching
  transition per character, by construction.
- `AutomatonGraphSwitcher.tsx`: lets you switch between NFA / DFA /
  minimized DFA views, or view any two side by side.
- `ComparisonPanel.tsx`: a table comparing state counts, transition
  counts, accepting-state counts, and per-stage construction timing
  (all measured with `performance.now()`) across NFA, DFA, and minimized
  DFA, plus the minimization reduction percentage and the NFA→DFA state
  expansion ratio.
- `engine/benchmark/`: a benchmarking module —
  `datasetGenerator.ts` produces synthetic test strings of increasing
  size (both "realistic" log-line-like text and "adversarial" repeated-
  character text for stress-testing); `catastrophicBacktrackDetector.ts`
  performs **static analysis** of the AST looking for the canonical
  ReDoS shapes (nested quantifiers, alternation branches with
  overlapping prefixes inside a repeated group) and **dynamic
  confirmation** by checking whether measured execution time actually
  grew super-linearly with input size; `benchmarkRunner.ts` runs a fixed
  suite of patterns (including two deliberately risky ones) across the
  generated datasets, timing every run.
- `BenchmarkPanel.tsx` / `BenchmarkTable.tsx` / `BenchmarkChart.tsx`:
  summary stat cards, a results table, and an SVG line chart of
  execution time vs. dataset size.

**State at the end of this milestone:** the full compiler pipeline —
tokenizer → parser → NFA → DFA → minimized DFA — is implemented,
visualized, and cross-compared, and a benchmarking module can measure
real performance and flag dangerous patterns before they're ever run
against meaningful amounts of data.

### Milestone 5 — Full IDE redesign

**Goal:** redesign the entire UI/UX into a polished, professional,
dark-first developer tool comparable to VS Code, Figma, Linear, Raycast,
or Postman — without touching any of the underlying engine logic from
Milestones 1–4.

**What was built:**
- A complete **design token system** (`src/index.css`, using Tailwind
  v4's `@theme` directive): a dark-first color palette (canvas/surface/
  border/text scales, a single accent color, semantic success/warning/
  danger/info colors, a dedicated automata-state color language, and an
  8-color accessible capture-group palette), self-hosted Inter (UI) and
  JetBrains Mono (code/regex/console) fonts via `@fontsource`, plus
  consistent radii, shadows, and motion-duration tokens. A light theme
  exists too, toggleable, though dark is the default per the brief.
- A **design system** of roughly 13 reusable primitives in
  `src/design-system/`: `Button`, `Input`/`Textarea`, `Badge`,
  `Tooltip`, `Tabs`, `Card`/`StatCard`, `EmptyState`, `Skeleton`,
  `Toast`, `DropdownMenu`, `ContextMenu`, `Modal`, `ResizeHandle`. Every
  feature component was rewritten to use these instead of one-off
  markup, so the whole app shares one visual language.
- An **IDE shell** (`src/components/shell/`): a `TopBar` (logo, live
  pattern-validity badge, command palette trigger, theme toggle), a
  resizable/collapsible `Sidebar` (block toolbox plus a new pattern
  library of common presets plus saved patterns, persisted to
  `localStorage`), a `Workspace` of six top-level tabs (**Builder ·
  Regex · AST · NFA · DFA · Benchmark**, each occupying the full
  workspace instead of every panel being visible at once), a
  context-aware `Inspector` (shows different real data depending on the
  active tab — regex properties and match stats on Regex, automata
  metrics on NFA/DFA, etc.), a resizable/collapsible `BottomDock`
  (Console/Logs/Errors/Performance tabs reflecting actual pipeline
  activity via a new `consoleLogStore.ts` plus `useConsoleLogging.ts`
  hook, not placeholder content), and a `⌘K` `CommandPalette` for
  fuzzy-searchable navigation.
- Every feature tab's content was restyled into the new visual language:
  the Canvas gained drag ghost previews (via dnd-kit's `DragOverlay`),
  right-click context menus, and duplicate/delete actions; the D3
  NFA/DFA graph gained hover tooltips showing each state's role, on-
  canvas zoom controls with a live percentage readout, and smoother
  dark-themed rendering; the benchmark tab gained summary stat cards
  above the existing chart and table.
- Layout state — sidebar/inspector width, collapsed state, dock height,
  active workspace tab, theme — persists to `localStorage` via Zustand's
  `persist` middleware, so your layout survives a page reload.

**Critically:** none of the engine code (tokenizer, parser, Thompson's
construction, subset construction, Hopcroft's algorithm, the matcher,
the benchmark runner) was modified in this milestone. This was a
presentation-layer rewrite on top of an already-correct engine — the
two hooks `useRegexMatcher` and `useRegexAutomaton` remained the
unchanged synchronization points feeding every tab.

**State at the end of this milestone:** the application looks and
behaves like a polished, professional developer tool rather than a
collection of separate panels, with no loss of any prior functionality.

### Milestone 6 — GitHub readiness

**Goal:** make sure the repository is complete and presentable for a
public GitHub upload, with documentation that captures everything above.

**What was built:**
- `.gitignore`, `.editorconfig`, `LICENSE` (MIT), and a fleshed-out
  `package.json` (description, keywords, author, repository/homepage/
  bugs URLs, an `engines` field pinning Node 20+).
- `.nvmrc` for Node version managers.
- `CONTRIBUTING.md` — setup instructions, the "engine changes must flow
  through the whole pipeline" rule, a correctness-verification checklist
  (including the lesson from the infinite-render-loop bugs described in
  [section 9](#9-every-bug-caught-during-development-and-how)), code
  style notes, and PR/issue guidelines.
- This document, `PROJECT_GUIDE.md` — the complete history and context
  you're reading now.
- A README rewrite covering the full current feature set, interface,
  tech stack, setup, architecture, the compiler pipeline stage by stage,
  the project file structure, and known limitations — kept as the
  short, scannable entry point, with this guide linked as the long-form
  companion.

## 5. The compiler pipeline in depth

This section explains each stage of the engine in more technical depth
than the README, for readers who want to actually understand the
algorithms, not just know they exist.

### 5.1 Tokenizer (`src/engine/lexer/tokenizer.ts`)

Converts a raw pattern string into a flat array of tokens. This is a
hand-written lexer implemented as straightforward character-by-character
scanning. Recognized token types: `CHAR` (a literal character),
`ESCAPED_CLASS` (`\d \D \w \W \s \S`), `ESCAPED_CHAR` (any other
backslash-escaped character, treated as a literal), `CHAR_CLASS` (a
`[...]` bracket expression, including negation `[^...]` and ranges
`a-z`), `DOT` (`.`), `PIPE` (`|`), `LPAREN`/`RPAREN`/
`GROUP_NONCAPTURING_START`/`GROUP_NAMED_START` (the four group-opening
forms), `STAR`/`PLUS`/`QUESTION`/`QUANTIFIER_RANGE` (the quantifier
forms, with `{n}`/`{n,}`/`{n,m}` parsed eagerly into a structured
`{min, max}` pair), and `EOF`.

### 5.2 Parser (`src/engine/ast/parser.ts`)

A **recursive descent parser** — each grammar rule becomes one method,
calling into the next-tighter-binding rule. The grammar:

```
Alternation → Concat ('|' Concat)*
Concat      → Quantified*
Quantified  → Atom Quantifier?
Quantifier  → '*' | '+' | '?' | '{n}' | '{n,}' | '{n,m}'
Atom        → CHAR | ESCAPED_CHAR | ESCAPED_CLASS | '.' | CharClass | Group
Group       → '(' Alternation ')'
            | '(?:' Alternation ')'
            | '(?<name>' Alternation ')'
```

This precedence (alternation binds loosest, then concatenation, then
postfix quantifiers, then atoms) matches standard regex semantics —
`ab|cd` means `(ab)|(cd)`, not `a(b|c)d`. Capture groups are numbered
left-to-right as they're encountered during parsing (`nextGroupIndex`),
matching how `RegExp` numbers capture groups.

### 5.3 Thompson's construction (`src/engine/automata/thompsonConstruction.ts`)

Converts the AST into an NFA. The core idea (from Ken Thompson's 1968
paper) is that every AST node becomes a small NFA fragment with exactly
one unconnected start state and one unconnected accept state, and
fragments combine according to simple, local rules:

- **Literal / character class / `.` / escaped class** — two states with
  a single labeled transition between them.
- **Concatenation `AB`** — build A's fragment and B's fragment, then add
  an ε-transition from A's accept state to B's start state.
- **Alternation `A|B`** — a new start state ε-branches to both A's and
  B's start states; both A's and B's accept states ε-join a new shared
  accept state.
- **`A*` (zero or more)** — a new start state can either skip straight
  to a new accept state, or enter A; A's accept state can loop back to
  A's start, or proceed to the new accept state.
- **`A+` (one or more)** — like `A*` but without the "skip entirely"
  option — you must go through A at least once.
- **`A?` (zero or one)** — like `A*` but without the loop-back — you can
  skip A, or go through it exactly once.
- **`A{n,m}`** — built from `n` mandatory copies of A's fragment chained
  together, followed by `m - n` optional copies (each individually
  skippable via an ε-transition straight to the end), or — if `m` is
  unbounded (`{n,}`) — `n` mandatory copies followed by an `A*`-style
  loop.

Every state and transition produced is tagged with enough information
(which group it belongs to, whether it's an ε-transition, etc.) to
render a readable diagram, not just a correct automaton.

### 5.4 Subset construction (`src/engine/automata/subsetConstruction.ts`)

Converts the NFA into an equivalent DFA. The classical algorithm:

1. Start with `S0 = ECLOSE({nfa.start})` as the DFA's start state.
2. For each unprocessed DFA state `S` and each symbol `a` in the
   alphabet, compute `T = ECLOSE(MOVE(S, a))`. If `T` is a new subset,
   add it as a new DFA state; add a DFA transition `S --a--> T`.
3. Repeat until no new subsets are discovered.
4. A DFA state is accepting if and only if its underlying NFA-state
   subset contains the NFA's accepting state.

The complication beyond the textbook version: this engine's NFA
transitions are guarded by **predicates** (`\d`, `\w`, character classes,
`.`) rather than single discrete characters, so "for each symbol in the
alphabet" can't literally mean "for each possible character" — see
[section 9.1](#91-the-overlapping-guard-problem-in-subset-construction)
for exactly how this was solved.

### 5.5 Hopcroft's algorithm (`src/engine/automata/dfaMinimization.ts`)

Minimizes the DFA to the smallest equivalent automaton via **partition
refinement**:

1. Start with two blocks: accepting states, and non-accepting states.
2. Maintain a worklist of `(block, symbol)` pairs to process.
3. For each `(block, symbol)` pair: find every state that transitions
   into that block on that symbol. If any existing block contains both
   states that are in this "predecessor" set and states that aren't,
   split that block into two.
4. Re-seed the worklist after any split (this implementation re-seeds
   broadly rather than using Hopcroft's finer-grained incremental
   worklist management — see
   [section 10](#10-design-decisions-and-the-reasoning-behind-them) for
   why that's a deliberate, documented tradeoff) and repeat until no
   block splits.
5. Two states that end up in the same final block are **Myhill–Nerode
   equivalent** — no input string can distinguish them — so they can be
   safely merged into one DFA state.

### 5.6 Simulation

- **NFA simulation** (`nfaSimulator.ts`) tracks the entire set of
  currently-reachable NFA states at every step (subset/powerset
  simulation), which is what correctly handles NFA nondeterminism.
- **DFA simulation** (`dfaSimulator.ts`) is much simpler: a DFA has at
  most one active state and at most one matching transition per
  character by construction, so each step is a direct table lookup with
  no closure computation needed.

### 5.7 Benchmarking and catastrophic backtracking detection

`engine/benchmark/catastrophicBacktrackDetector.ts` looks for two
classical ReDoS-triggering AST shapes:

1. **Nested repetition** — a quantifier inside another repeated group
   (e.g. `(a+)+`), where the same input span can be partitioned among
   the repetitions in exponentially many ways.
2. **Overlapping alternation inside repetition** — alternation branches
   that share a common prefix, repeated (e.g. `(a|ab)*`), which forces a
   backtracking engine to retry every branch at every repetition
   boundary on failure.

This static signal is then confirmed or escalated by dynamic evidence:
`benchmarkRunner.ts` actually measures execution time across increasing
input sizes and checks whether it grew much faster than the input size
did (more precisely: whether the time ratio between the smallest and
largest completed run exceeds the square of the corresponding length
ratio — a simple, deliberately conservative super-linearity check). A
pattern is flagged "high risk" if either signal fires.

## 6. The state management layer

All shared application state lives in Zustand stores under `src/store/`:

| Store | Holds | Persisted? |
|---|---|---|
| `regexStore.ts` | Builder blocks, test text, regex flags, selected block id | No |
| `uiStore.ts` | Sidebar/inspector width and collapsed state, dock height/open state, active dock tab, active workspace tab, theme, command palette open state | Yes (`localStorage`) |
| `savedPatternsStore.ts` | Named snapshots of block configurations | Yes (`localStorage`) |
| `consoleLogStore.ts` | Append-only log of real pipeline events (pattern compiled, pattern invalid, automaton built) | No |
| `design-system/toastStore.ts` | Transient toast notifications | No |

Everything else — the generated pattern, match results, AST, NFA, DFA,
minimized DFA, comparison stats — is **derived state**, computed by the
two hooks below via `useMemo`, never stored redundantly:

- **`useRegexMatcher()`** (`src/hooks/useRegexMatcher.ts`) — derives the
  generated pattern, runs it against the test text, and returns matches,
  capture groups, highlighting segments, and stats.
- **`useRegexAutomaton()`** (`src/hooks/useRegexAutomaton.ts`) — derives
  the generated pattern (using the same `generateRegex` function as the
  matcher hook, so the two can never disagree), tokenizes and parses it,
  builds the NFA, DFA, and minimized DFA, converts each to a renderable
  graph, and computes comparison statistics with per-stage timing.

Both hooks degrade gracefully on an invalid pattern: `isValid` becomes
`false`, `error` is populated, and every downstream field (ast, nfa,
dfa, etc.) becomes `null` — nothing throws, nothing crashes.

## 7. The design system

`src/index.css` defines the complete visual token system using Tailwind
v4's `@theme` directive: surface colors (canvas/surface/raised/overlay/
hover), border colors (subtle/default/strong), text colors (primary/
secondary/tertiary/disabled), a single accent color scale, semantic
success/warning/danger/info scales, a dedicated automata-state color
language (default/start/accepting/active/selected/hover — used
identically across the NFA and DFA graphs so the same color always means
the same thing), an 8-color accessible capture-group palette (mirrored
in `src/utils/colors.ts` for use outside CSS, e.g. inline SVG fills),
font stacks (Inter for UI, JetBrains Mono for anything code-like), and
consistent radii/shadow/motion-duration scales. A `[data-theme="light"]`
override block provides the secondary light theme.

`src/design-system/` contains the reusable primitives built on these
tokens — `Button` (5 variants by 3 sizes), `Input`/`Textarea`, `Badge`
(6 semantic variants, optional status dot), `Tooltip` (CSS-only, 4
sides), `Tabs` (animated active-indicator), `Card`/`StatCard`,
`EmptyState`, `Skeleton`/`SkeletonText`, `Toast`/`ToastViewport` (backed
by `toastStore.ts`), `DropdownMenu`, `ContextMenu` (right-click),
`Modal`, and `ResizeHandle` (drag-to-resize, used by the sidebar,
inspector, and dock).

## 8. The IDE shell

`src/components/shell/` assembles the application frame:

- **`TopBar.tsx`** — logo, project name, a live pattern-validity badge
  (reads `useRegexMatcher()` directly), a command palette trigger, theme
  toggle, settings button.
- **`Sidebar.tsx`** — three collapsible sections: the block toolbox
  (click to add a block to the canvas), a pattern library of common
  presets (`patternLibraryData.ts`), and saved patterns (persisted,
  with save/load/delete via right-click context menu).
- **`Workspace.tsx`** — the six top-level tabs (Builder, Regex, AST,
  NFA, DFA, Benchmark), each rendering its own tab component
  (`BuilderTab`, `RegexTab`, `ASTTab`, `NFATab`, `DFATab`,
  `BenchmarkTab`) full-width, one at a time.
- **`Inspector.tsx`** — the right-hand context-aware panel; which
  sections it shows depends on `uiStore`'s `activeWorkspaceTab`.
- **`BottomDock.tsx`** — Console/Logs/Errors/Performance tabs. Console
  and Logs render the same underlying `consoleLogStore` entries (kept as
  two tabs because the original brief specified both, even though they
  currently share a data source); Errors filters to error-level entries
  only; Performance renders a live bar-chart-style breakdown of the most
  recent NFA/DFA construction and minimization timings.
- **`CommandPalette.tsx`** — a `⌘K`/`Ctrl+K`-triggered fuzzy-searchable
  list of navigation and action commands (jump to any tab, toggle
  theme/sidebar/inspector, clear the canvas), with arrow-key navigation
  and Enter-to-run.

`App.tsx` composes all of the above into the final layout, plus
`ThemeSync` (a side-effect-only component that writes the current theme
to `<html data-theme>`) and `ToastViewport`.

## 9. Every bug caught during development, and how

This project was built with a discipline of actually rendering and
interacting with components after writing them, not just running
`tsc`/`oxlint` and assuming correctness — because both real bugs
described below passed type-checking and linting cleanly and would have
shipped to a real user as a frozen browser tab.

### 9.1 The overlapping-guard problem in subset construction

**The problem:** the first version of `subsetConstruction.ts` treated
each NFA guard (a literal character, or a class like `\d`) as its own
independent "alphabet symbol" when computing `move()`. This is wrong
when guards overlap — for example, a pattern like `(5|\d)` has one
transition guarded by the literal `5` and another guarded by `\d`, and
the character `5` satisfies both. Treating them as two independent
symbols means the resulting automaton would try to take two separate
transitions on the same input character, which is not deterministic —
defeating the entire point of subset construction.

**How it was found:** by reasoning through the construction carefully
before testing (not after) — recognizing that literal-vs-class overlap
is a classical pitfall when adapting subset construction's "for each
symbol in the alphabet" step to a non-enumerable alphabet.

**The fix:** rather than treating each guard as its own symbol, the
final implementation computes a **signature** for representative
characters (which set of guards matches each one) and groups characters
that produce the same signature into one disjoint "alphabet partition."
A literal `5` and a class `\d` that both match `5` end up correctly
merged into a region that represents "exactly the character 5," distinct
from "any other digit." This was verified with over 700 cross-checks
against JavaScript's native `RegExp` across a wide range of patterns,
explicitly including the `(5|\d)` overlap case, confirming the DFA's
simulated behavior matches `RegExp`'s real behavior on every tested
input.

### 9.2 The benchmark safety net: three iterations to get it right

**The problem:** the benchmarking module needs to test deliberately
risky patterns (e.g. `(a+)+b`, the canonical ReDoS example) without
actually freezing the browser tab. JavaScript's `RegExp.exec` runs
synchronously and cannot be preempted mid-call from the same thread —
there is no real timeout mechanism available without moving execution
to a Web Worker, which this module intentionally doesn't do (to keep
results directly comparable to the rest of the app's same-thread
matching).

This took three attempts to get genuinely safe, each one caught by
actually running the code under a hard wall-clock timeout wrapper rather
than assuming the design was correct:

1. **First attempt: fixed dataset-size caps for "risky" patterns.** This
   silently failed because the risk-classification logic itself had a
   bug (see below) — the default risky example patterns were being
   scored as "low" risk, not "high," so they never hit the capped code
   path at all and ran against the full-size realistic dataset. It
   happened to not hang only because the realistic dataset's text didn't
   happen to contain a long unbroken run of the triggering character.
   This was a near-miss, not a working solution.

2. **Second attempt, after fixing the classification bug: an adaptive
   probe that doubled the test input length each step** (4, 8, 16, 32
   characters...) until a probe got slow, then used the largest length
   that was still fast. This caused a real 20-second hang when tested:
   `(a+)+b` took 0.3ms at length 16 but over 20,000ms at length 32 —
   because the act of attempting the length-32 probe is itself the
   catastrophic call; doubling the length can also double (or worse) the
   exponent, so the very next doubling step can be many orders of
   magnitude slower than the budget check can react to.

3. **Final, verified-safe version: single-character-at-a-time
   stepping.** Instead of doubling, the probe increases the test input
   length by exactly one character per step, with a tight per-step time
   budget. This bounds the worst-case overshoot of any single step to
   roughly a small constant multiple of the previous (already-proven-
   safe) step's cost, rather than letting it compound multiplicatively.
   This was stress-tested against nested quantifiers up to 8 levels deep
   (`((((((((a+)+)+)+)+)+)+)+b`) and several other classical ReDoS
   shapes, all completing safely in well under a second, under a hard
   external `timeout` wrapper that would have visibly killed the process
   if it had actually hung.

**Lesson generalized in `CONTRIBUTING.md`:** when safety against
unbounded computation matters, the step size of any adaptive probing
strategy matters as much as the time budget itself — a budget check that
only runs after an attempt completes provides no protection against an
attempt that was always going to be too slow.

### 9.3 Two infinite render loops, both invisible to the type checker

Both of the following bugs passed `tsc -b` and `oxlint` with zero errors
or warnings, and both would have caused a real user's browser tab to
freeze solid during completely ordinary use. Both were only caught by
writing throwaway `@testing-library/react` smoke tests that actually
rendered the component tree and interacted with it (clicking tabs,
typing into inputs, toggling panels) — then deleting the test files
before the final commit, since this project doesn't keep a permanent
test suite (see
[section 11](#11-known-limitations-and-explicitly-out-of-scope-features)
for why).

**Bug A — missing `useMemo` around simulation.** In the NFA/DFA
simulator controls, `simulateNFA(nfa, input)` (respectively
`simulateDFA`) was being called fresh on every render, producing a
brand-new `steps` array each time even when neither `nfa` nor `input`
had actually changed. A `useEffect` watching that array (to notify the
parent component of the current step) had `steps` in its dependency
list — so every render produced a "changed" dependency, triggering the
effect, which called the parent's state setter, which triggered a
re-render, which called `simulateNFA` again, producing yet another new
array, forever. **Fix:** wrap the simulation call in
`useMemo(() => simulateNFA(nfa, input), [nfa, input])` so the result is
only recomputed when the actual inputs change, giving the array a
stable identity across renders that don't change anything meaningful.

**Bug B — a Zustand selector returning a freshly-filtered array.** In
the redesigned `BottomDock` component, two places selected from the
console log store like this:

```ts
const entries = useConsoleLogStore((s) =>
    s.entries.filter((e) => e.level === "error")
);
```

`.filter()` allocates a brand-new array every single call, so Zustand's
`useSyncExternalStore`-based subscription correctly detected "the
selected value changed" on every render and re-rendered again,
indefinitely — surfacing as the exact React error "Maximum update depth
exceeded" the moment a user opened the dock, toggled the theme, or even
just rendered the page in a way that touched that selector. **Fix:**
select the raw, stable `entries` array from the store, then compute the
filtered result with `useMemo(() => entries.filter(...), [entries])` in
the component itself, so the store's selector always returns the same
reference unless the underlying data actually changed.

**The general lesson** (now codified in `CONTRIBUTING.md`): any Zustand
selector or `useMemo`-less computation that returns a new array, object,
or function on every call is a latent infinite-loop risk if anything
downstream (an effect, another memo, a child render) depends on its
referential identity. Type-checking and linting cannot catch this class
of bug — only actually rendering and interacting with the component can.

## 10. Design decisions and the reasoning behind them

**Why no automated test suite is committed to the repository.** Every
correctness claim in this project (the 700+ `RegExp` cross-validation
checks, the DFA minimization equivalence checks, the benchmark safety
stress tests, the render-level smoke tests that caught the two infinite
loops above) was real, was actually run, and did pass — but the test
scripts themselves were written as throwaway verification tools during
development and deleted afterward, rather than committed as a permanent
suite. This is a deliberate choice for this project's current stage
(you're encouraged to add a permanent suite as a contribution — see
`CONTRIBUTING.md`), not an oversight, and it's important to be upfront
about it precisely so nobody mistakes "this was verified" for "there is
a CI suite re-verifying this on every future change."

**Why dark-first, not just dark-only.** The brief for the IDE redesign
explicitly asked for "dark mode first," which was interpreted as: dark
is the default and the primary design target (every color decision was
made for the dark palette first), but a real, complete light theme
exists and is reachable via the theme toggle, rather than treating light
mode as an afterthought or omitting it.

**Why Zustand over Redux/Context.** The state shape here is simple
(flat stores, no complex normalized relational data), and Zustand's
selector-based subscription model is what made the derived-state
architecture in [section 6](#6-the-state-management-layer) clean to
express — components subscribe to exactly the slice of state they need
via a selector function, without provider nesting or action-type
boilerplate.

**Why the benchmark module doesn't share code with the live matcher.**
`useRegexMatcher` is built for correctness and immediacy — every
keystroke re-runs it, so it must be fast and must never hang. The
benchmark module deliberately runs a separate, fixed suite of patterns
(plus, optionally, your current pattern) against synthetic datasets,
specifically because it needs different safety guarantees (the
single-character-stepping probe described in
[section 9.2](#92-the-benchmark-safety-net-three-iterations-to-get-it-right))
that would be wasteful and unnecessary overhead for ordinary live
typing.

**Why Hopcroft's algorithm here isn't the textbook-optimal
implementation.** The classical Hopcroft's algorithm formulation uses a
carefully incremental worklist that only re-examines exactly the
`(block, symbol)` pairs that could newly be splittable after each split,
achieving the famous O(n log n) bound. This implementation instead
re-seeds the entire worklist after every split. This is still correct
(every distinguishable pair is eventually found and split — verified by
the equivalence cross-checks described above) and still fast enough in
practice for the pattern sizes this tool deals with, but it is not
asymptotically optimal. This tradeoff (simplicity and auditability over
peak algorithmic performance) was made deliberately and is documented in
the code's own comments, not hidden.

**Why `lucide-react` for icons.** A consistent, professional icon set
was needed to match the VS Code/Linear/Raycast visual target from the
redesign brief; hand-rolling inconsistent SVGs per component would have
worked against the brief's explicit goal of "consistent visual
hierarchy."

## 11. Known limitations and explicitly out-of-scope features

- **No lookaheads, lookbehinds, backreferences, or Unicode property
  escapes.** This is a from-scratch educational implementation covering
  the regular subset of regex syntax (the part that's actually
  representable by a finite automaton). Backreferences in particular are
  not regular — no finite automaton can represent them — so supporting
  them would require an entirely separate, explicitly backtracking
  execution model running alongside the automaton-based one described in
  this guide, not an incremental extension of it.
- **Subset construction state explosion is real and visible, not
  hidden.** Like any genuine implementation of the algorithm,
  sufficiently complex patterns can produce a DFA with exponentially
  more states than the source NFA in the worst case. The comparison
  panel surfaces the NFA→DFA expansion ratio directly rather than hiding
  this behind the scenes.
- **No true execution timeout for catastrophic patterns**, only the
  adaptive single-character-stepping safety probe described in
  [section 9.2](#92-the-benchmark-safety-net-three-iterations-to-get-it-right).
  This is a fundamental JavaScript same-thread limitation, not a gap
  specific to this codebase — a genuine hard timeout would require
  moving regex execution to a Web Worker, which was deliberately not
  done (see [section 10](#10-design-decisions-and-the-reasoning-behind-them)).
- **No backend, no persistence beyond `localStorage`.** Saved patterns
  and layout preferences live only in your browser's local storage —
  there is no account system or server-side sync.

## 12. Project statistics

As of the current state of the repository:

- **88 TypeScript/TSX source files**, roughly **9,700 lines** of source
  (excluding `node_modules`, build output, and config files).
- **Engine** (`src/engine/`): 24 files across six subsystems — lexer
  (2), AST/parser (2), automata (11: NFA types, Thompson's construction,
  epsilon-closure, subset construction, DFA types, DFA minimization, NFA
  graph, DFA graph, NFA simulator, DFA simulator, automaton stats),
  matcher (3), parser/regex-generator (2), and benchmark (4).
- **Components** (`src/components/`): 33 files across shell, builder,
  visualizer, automata, and benchmark feature areas.
- **Design system** (`src/design-system/`): 15 files (the primitives
  plus the toast store and theme sync component).
- **Zero external regex or automata libraries** — every algorithm in
  [section 5](#5-the-compiler-pipeline-in-depth) is implemented from
  scratch.

## 13. Glossary

| Term | Meaning in this project |
|---|---|
| **AST** | Abstract Syntax Tree — the parsed, structured representation of a regex pattern, before it's compiled into an automaton. |
| **NFA** | Nondeterministic Finite Automaton — a state machine that may have multiple possible transitions for the same input, or none. Can require tracking a set of "currently possible" states. |
| **DFA** | Deterministic Finite Automaton — a state machine with at most one transition per state per input symbol, so its current state is always a single, unambiguous value. |
| **Thompson's construction** | The classical algorithm (Ken Thompson, 1968) for converting a regex AST into an equivalent NFA, fragment by fragment. |
| **Subset construction** (the "powerset construction") | The classical algorithm for converting an NFA into an equivalent DFA, by treating sets of NFA states as single DFA states. |
| **Hopcroft's algorithm** | An efficient algorithm for DFA minimization via partition refinement, producing the smallest possible equivalent DFA. |
| **Epsilon-transition (ε-transition)** | A transition in an NFA that consumes no input character — used to wire together fragments in Thompson's construction without changing what's actually matched. |
| **ECLOSE / epsilon-closure** | The set of every state reachable from a given state (or set of states) via zero or more ε-transitions. |
| **MOVE** | The operation of finding every state reachable from a given set of states by consuming exactly one input character. |
| **Myhill–Nerode equivalence** | Two DFA states are equivalent if no possible input string could ever distinguish between them (i.e., starting from either state, the same suffix is accepted or rejected identically). This is exactly the condition Hopcroft's algorithm uses to decide which states to merge. |
| **Catastrophic backtracking / ReDoS** | A pathological case where a backtracking regex engine's execution time grows exponentially (or worse) with input size, typically caused by nested or overlapping repetition. |
| **Capture group** | A parenthesized sub-pattern `(...)` whose matched text is extracted separately from the overall match; can be named (`(?<name>...)`) or non-capturing (`(?:...)`). |
| **Recursive descent parser** | A parser implementation style where each grammar rule is directly translated into one function/method that may call other rule-functions, mirroring the grammar's structure in code. |

## 14. Where to go next

- **To run the project:** see [README.md → Getting started](./README.md#getting-started).
- **To understand the file layout:** see [README.md → Project structure](./README.md#project-structure).
- **To contribute:** see [CONTRIBUTING.md](./CONTRIBUTING.md).
  [getting started documentation](https://docs.github.com/en/get-started).
