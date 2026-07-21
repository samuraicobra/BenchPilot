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

### 2026-07-18 — Integrated validation and private release

- Release SHA: `d5721a02725051368c7ecf08f2bffe2bf7c51b3d`
- Private production URL: `https://benchpilot.samuraicobra.chatgpt.site`
- Formatting: `npm run format` completed; the final `npm run format:check` passed.
- Static quality: `npm run lint` and `npm run typecheck` both passed with exit code 0.
- Unit tests: `npm run test:unit` passed 17/17 tests across the domain and seeded-demo suites.
- Integration tests: `npm run test:integration` passed 13/13 API and UI tests, completed the production Vinext build, and then passed 2/2 rendered-HTML checks. Total automated assertions: 32.
- Production dependencies: `npm audit --omit=dev` reported zero vulnerabilities.
- Tests added/fixed: schema completeness, measurement parsing, deterministic ordering, chart-source fidelity, matrix construction and simulated updates, no-key demo loading, request/file limits, prompt-injection framing, upstream/malformed output, API error mapping, abort behavior, workflow rendering, and production metadata.
- Bugs found during QA: a removed skeleton dependency remained in Vite's development optimizer cache. The stale preview failed hydration even though server HTML rendered. Restarting the development server rebuilt the dependency graph; a clean browser tab then completed the full workflow without console errors. Accessible tab names also intentionally shorten at the mobile breakpoint, so selectors and the visual design were verified against the responsive DOM.
- No-key demo outcome: passed locally at 1440×900 and 390×844. Capture, Structure, Challenge, Test, Compare, the matrix update, validated-data chart, and printable report all worked. At 390 px, document width stayed within the viewport; the matrix remains available through its own intentional responsive scroll surface.
- Keyboard/accessibility outcome: stages expose tab/tablist/tabpanel semantics, matrix meaning is present in text rather than color alone, buttons and evidence controls have accessible names, reduced-motion CSS is present, and the report closes with Escape. A full assistive-technology certification was outside this release pass.
- Live API outcome: no `OPENAI_API_KEY` was present, so no billable model call is claimed. The live boundary was verified through injected SDK/API integration tests covering successful structured data, invalid/incomplete output, unsupported and oversized files, missing key, upstream failures, aborts, and instruction-like note content.
- Numerical traceability: the seeded chart audit asserts the exact eight source readings; the illustrative 1.08 V matrix update is schema-labeled simulated and tested to remain outside both run measurement arrays and all chart series.
- Secret audit: the repository scan found no API key, bearer token, or private credential pattern. `.env.local` is ignored and only the empty `.env.example` is tracked.
- Deployment: Sites version 1 reached `succeeded` at 2026-07-18 15:30 UTC. Access remains owner-only/private as required by the default safe deployment path. The production authorization page rendered without console warnings; application-body smoke testing requires the owner to sign in.
- Remaining known limitation: the strongest pre-submission improvement is to add a real prototype photograph and record one live GPT-5.6 run, then explicitly make the site public before judging if the owner approves that access change.

### 2026-07-18 — Latest real zinc-air run integration

- Replaced the default delayed-recovery comparison with the newest user-reported result: 1.692 V fresh OCV and approximately 1.10 V under the same or a similar load, measured with an Analog Devices Scopy voltmeter in an improvised Tic Tac-container cell.
- Preserved the 1.562 V → 0.732 V → 0.482 V collapse as the validated baseline. The older long-recovery record remains exported as historical evidence but is no longer the default judge comparison.
- Made measurement elapsed time nullable. The latest loaded reading has no supplied timestamp, sorts after timed readings, appears in the timeline/report, and is excluded from the voltage-versus-time chart rather than receiving an invented x-coordinate.
- Added a prominent causal-attribution warning covering load current, hydration/electrolyte dose, cathode thickness/loading, exposed air area, contact resistance/fixture pressure, and elapsed time.
- Re-ranked the next experiments: matched latest-build replication first, one-factor construction rollback second, and air-aperture crossover third.
- Updated the Hypothesis Matrix and its simulated update to ask what changes if three matched latest builds sustain approximately 1.10 V at 60 seconds. The simulated outcome remains outside observed records and chart series.
- Updated Devpost, judge, screenshot, recording-script, and recording-checklist copy to use the newest real evidence and to avoid carrying the old build's separator detail into the latest build without confirmation.
- Final validation: formatting, ESLint, and strict TypeScript passed; `npm test` passed 17 domain/demo tests, 14 API/UI tests, and 2 rendered-build tests (33 total); the production build completed; production dependency audit reported zero vulnerabilities; the secret-pattern scan returned no matches.
- Release commit `1baa395b2e6ebf6fb325aa8565f9944079f98d43` was pushed to the existing Sites source repository and saved as Sites version 2. The owner-only production deployment started but the hosting provider returned `Unauthorized`; access remained correctly configured as custom/owner-only. No access policy was changed and the previous production version remains live.

### 2026-07-20 — Public Build Week release-candidate sprint

- Preserved the existing owner-only live Sites deployment and created a separate public Sites project with no environment variables or hosted secrets.
- Converted the public analysis route into a hard server boundary: GET and POST return `403 PUBLIC_DEMO_ONLY`, do not read request evidence, and import neither the OpenAI SDK nor `server/analyze`.
- Replaced live-only public controls with an honest **Replay demo analysis** path. The interface now identifies itself as a previously generated, validated GPT-5.6 replay and never invokes `fetch` during replay.
- Expanded the typed demo dataset to three real run histories: the latest 1.692 V / ~1.100 V result, the 1.562 → 0.732 → 0.482 V collapse, and the 0.912 → 1.308 V delayed recovery.
- Added stainless-steel mesh, no-separator configuration, the uncertain -0.460 V Scopy transient, and an explicit refusal to calculate current, internal resistance, or power without sufficient data.
- Expanded the causal warning to electrical load/fan current, contact resistance, cathode thickness, wetting/flooding, electrolyte quantity, oxygen access, clamping pressure, zinc surface condition, temperature, and time since assembly.
- Exported chart-data construction as a deterministic helper and tested exact equality between chart tuples and time-qualified fixture measurements. The unknown-time loaded reading and simulated matrix outcome remain excluded.
- Added arrow-key workflow navigation, visible image-observation limitations, a public replay disclosure, and three-run comparison/timeline support.
- Added public-route, no-fetch replay, fixture, chart, uncertainty, keyboard, report, and recovery-series coverage. Final automated total before deployment: 43 passing tests (20 unit, 21 API/UI integration, 2 rendered HTML).
- Local production HTTP smoke returned 200 for the product and 403 `PUBLIC_DEMO_ONLY` for direct GET/POST analysis requests. Built-output scans found zero secret/OpenAI endpoint markers and zero production source maps. `npm audit --omit=dev` found zero vulnerabilities.
- Created the final 105-second script, storyboard, recording checklist, SRT captions, voiceover, shot list, truthful release QA ledger, and exact screenshot capture states. No screenshot or video file is claimed because browser capture/export was unavailable.
- Public Sites version 1 deployed successfully at `https://benchpilot-build-week.samuraicobra.chatgpt.site`. A signed-out HTTPS request returned 200 with no sign-in gate. Production GET and POST requests to `/api/analyze` both returned 403 `PUBLIC_DEMO_ONLY` with `Cache-Control: no-store`.
- The public project was rechecked with zero environment variables. The private live Site remained active, custom/owner-only with one allowed user, zero groups, and its hidden `OPENAI_API_KEY` secret unchanged.

### 2026-07-20 — Final browser QA, artifacts, and submission package

- Synchronized the reviewed release commit to the separate public Sites source and deployed successive verified public versions without adding any environment variable or modifying the private live Site.
- Added Playwright only as a development dependency and wrote `scripts/submission-qa.mjs` for fresh signed-out production checks at desktop, laptop, tablet, mobile, and an approximate 200% layout/scale profile.
- The real keyboard pass reached the demo CTA, activated it, traversed all five ARIA tabs with arrow keys, opened report controls, and closed the dialog with Escape. Back/forward, direct navigation, reload persistence, 20,000-character notes, overflow, browser errors, and the public API lockout were also exercised.
- Browser QA found two release issues that source review had missed: the report omitted an explicit uncertainty section, and modal overflow rules clipped printed pages. Added the already validated uncertainty/missing-control data to the report and changed only print CSS so the report paginates cleanly.
- Rendered the deployed report to a three-page A4 PDF, extracted text, rendered each page to PNG, and inspected all pages. The final PDF contains the correct readings and evidence boundary with no invented current or power.
- Captured and opened all eight planned screenshots. A second capture pass removed transient notification overlays while preserving the persistent matrix-update explanation.
- Produced two automated video takes. Frame review rejected the first take because the Test shot scrolled past rank 1. The second take keeps the rank-1 title and 9.7 information/effort score visible. Native FFmpeg verification reports WebM/VP8, 1920 × 1080, 25 fps, exactly 105.00 seconds; eight representative frames were decoded and inspected. The video is silent with burned-in captions; the original SRT and human voiceover remain available.
- Reconciled the browser console ledger and found that Chrome requested `/favicon.ico` because the shipped SVG favicon was not linked. Added explicit favicon metadata plus rendered-HTML coverage so the final deployment has no avoidable static-asset 404.
- Assembled `submission/screenshots`, `submission/video`, `submission/artifacts`, and `submission/final`, including clean Devpost copy and a human-only submission/legal checklist.
- Preserved the original `build-week-submission-v1` tag. The final package uses the separate `build-week-submission-final` tag.

### 2026-07-20 — Final automated gate

- `npm run format:check`, `npm run lint`, and `npm run typecheck` passed; ESLint reported zero warnings/errors and strict TypeScript reported no errors.
- `npm test` passed 20 unit tests, 21 API/UI integration tests, and 2 rendered production HTML tests: 43 total, 0 failed. The rendered metadata test now asserts the deployed SVG favicon link.
- A fresh explicit `npm run build` completed after the integrated test build.
- The current advisory registry identified vulnerable transitive `ws` and Next-bundled `postcss` versions. Rejected npm's suggested breaking Next.js downgrade; compatible same-major overrides resolve `ws` 8.21.1 and `postcss` 8.5.20. The full suite and production build pass after the change.
- `npm audit --omit=dev` reports zero vulnerabilities. The unfiltered development-tool audit reports 12 advisories (1 low, 4 moderate, 7 high), which do not enter the production dependency set.
- npm reports an engine warning because this desktop environment provides Node 22.12.0 while the repository requires Node 22.13.0 or newer. The release gates pass here; deployment uses the Sites build runtime.
- Final secret scan: zero secret-value patterns, zero sensitive markers in public built output, zero production source maps, and no tracked non-example environment file.
