# BenchPilot Codex build log

This is a factual engineering log, not release marketing. Completed implementation and observed repository facts are separated from validation still to be recorded. Final test results, deployment identifiers, screenshots, and live-API evidence must be appended after they actually run.

## 2026-07-18 — Initial inspection and product framing

- Inspected the supplied repository before changing product code. It was a Vinext starter using React 19, Next.js-compatible App Router conventions, Vite, Cloudflare tooling, strict TypeScript configuration, and an OpenAI Sites hosting manifest.
- Confirmed that `.openai/hosting.json` declared neither D1 nor R2. Retained browser persistence as the contest architecture instead of introducing an unnecessary database.
- Read the existing scripts and starter test surface. The initial app and README were starter material, so replacing starter messaging and behavior became an explicit deliverable.
- Converted the product brief into `BUILD_WEEK_PLAN.md`: product thesis, primary judge journey, architecture, core data model, risks, milestones, definition of done, and deliberately excluded features.
- Chose a single demonstration spine—**Capture → Structure → Challenge → Test → Compare**—and the Hypothesis Matrix as the memorable interaction.

## 2026-07-18 — Architecture decisions

- Selected Zod schemas as the runtime trust boundary and TypeScript inference source for experiment records, evidence, hypotheses, planned tests, comparisons, and analysis envelopes.
- Required seeded demo records and live model output to use the same parse/validation path.
- Kept timelines, chart series, comparison values, and matrix construction deterministic. The model supplies structured scientific interpretation; it does not supply pixels, chart coordinates, or unsourced display values.
- Separated reported facts, image-derived observations, calculations, hypotheses, unknowns, safety considerations, and recommended tests at the data-model level so the UI cannot casually flatten provenance.
- Designed the contest build around local browser persistence, a server-only API boundary, and a reliable no-key path.
- Excluded authentication, payments, teams, messaging, a production database, autonomous lab control, and any claim that an AI hypothesis is scientific proof.

## 2026-07-18 — Official OpenAI documentation check

- Checked current official OpenAI model documentation and the installed official SDK types before finalizing the live-analysis boundary.
- Verified the intended Responses API pattern for `responses.parse`, multimodal data-URL image input, Zod-backed `zodTextFormat` structured output, abort signals, and `store: false`.
- Used that review to guide versioned, prompt-injection-resistant server instructions and a guarded analysis service. Uploaded notes and images are treated as untrusted experimental evidence, never as instructions.
- At the time this entry was written, the route and its tests were still being finalized; no successful live GPT-5.6 request is claimed here.

## 2026-07-18 — Parallel implementation streams

Codex divided the build into shared-workspace, non-overlapping streams and kept integration on the main worktree:

| Stream               | Scope                                                                                                 | Status when logged |
| -------------------- | ----------------------------------------------------------------------------------------------------- | ------------------ |
| Domain and demo data | Strong schemas, seeded zinc-air runs, parsing/timeline/matrix utilities, unit tests                   | In progress        |
| OpenAI integration   | Official-docs check, server prompts, Responses API service, request guards, error mapping, API tests  | In progress        |
| Product interface    | Five-stage workflow, chart, matrix interaction, responsive/accessibility states, persistence/report   | In progress        |
| Submission readiness | Devpost copy, timed demo, judge brief, architecture, deployment/recording checklists, screenshot plan | Drafted            |

Agents edited the same working tree by assigned file ownership; disconnected prototype branches or worktrees were not used.

## 2026-07-18 — Submission and demo strategy

- Wrote a 105-second script that opens with the evidence-capture problem, centers the matrix update, and closes on a falsifiable next test and validated run comparison.
- Defined the canonical zinc-air dataset with eight source readings. Explicitly prohibited inventing a Run B open-circuit value or interpolating chart points.
- Made the precomputed no-key demo the primary recording path. Live analysis is an optional separately recorded insert, protecting the submission from latency, quota, key, or model-variance failures.
- Created a one-page judge brief aligned to technical implementation, design/UX, impact, quality, and originality.
- Added an architecture document with system and request-flow Mermaid diagrams, a production deployment checklist, and a screenshot plan with submission-ready captions.
- Kept validation language provisional: these documents describe intended/released behavior, but pass/fail claims belong in the ledger below only after commands and manual checks complete.

## Bugs and risks identified

| Finding                                                               | Engineering response                                                       | Verification                   |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------ |
| A model can return syntactically valid but incomplete science records | Structured output plus an independent runtime parse; typed error response  | Pending integrated tests       |
| A chart can imply invented precision                                  | Chart accepts validated numeric measurements only; audit seed values       | Pending chart-data audit       |
| Run B has no reported open-circuit value                              | Keep it unknown; prohibit a synthetic time-zero point                      | Pending seed/test audit        |
| Hypotheses can sound like conclusions                                 | Provenance categories, confidence, contrary evidence, unknowns, falsifiers | Pending UI/a11y review         |
| Images/notes can contain instruction-like text                        | Versioned server prompt boundary and schema-only acceptance                | Pending adversarial route test |
| A contest demo can fail without network/key                           | Complete seeded workflow using the same typed path                         | Pending clean-profile test     |
| Dense matrix/chart layouts can fail on mobile                         | Responsive presentation plus labels that do not rely on color              | Pending viewport review        |

## Validation ledger

Do not mark a row passed without recording the command or manual evidence.

| Gate                   | Command/evidence                                                       | Result           | Date |
| ---------------------- | ---------------------------------------------------------------------- | ---------------- | ---- |
| Dependency install     | `npm ci`                                                               | Not yet recorded | —    |
| Formatting             | `npx prettier --check .`                                               | Not yet recorded | —    |
| Lint                   | `npm run lint`                                                         | Not yet recorded | —    |
| Strict type check      | `npx tsc --noEmit`                                                     | Not yet recorded | —    |
| Unit/integration tests | `npm test`                                                             | Not yet recorded | —    |
| Production build       | `npm run build`                                                        | Not yet recorded | —    |
| No-key demo            | Clean profile, no `OPENAI_API_KEY`                                     | Not yet recorded | —    |
| Live API               | Valid image + canonical notes, server key                              | Not yet recorded | —    |
| API error handling     | Invalid key, invalid file, oversized request, abort, malformed fixture | Not yet recorded | —    |
| Chart traceability     | Compare rendered points to structured seed                             | Not yet recorded | —    |
| Matrix update          | Prepared measurement changes cells and explanation together            | Not yet recorded | —    |
| Keyboard/accessibility | Keyboard-only path, labels, focus, contrast, reduced motion            | Not yet recorded | —    |
| Responsive layout      | 390×844, 768×1024, 1440×900, 1920×1080                                 | Not yet recorded | —    |
| Secret audit           | Tracked-file/environment/log review                                    | Not yet recorded | —    |
| Production smoke test  | Public URL in signed-out/incognito browser                             | Not yet recorded | —    |

## Finalization template

Append one entry after integration rather than rewriting earlier facts:

### YYYY-MM-DD — Integrated validation and release

- Release SHA:
- Public URL:
- Commands run and exact results:
- Tests added/fixed:
- Bugs found during QA and their resolution:
- No-key demo outcome:
- Live API outcome (or precise reason not exercised):
- Mobile/desktop and keyboard/accessibility outcome:
- Secret and numerical traceability audit outcome:
- Remaining known limitation:
