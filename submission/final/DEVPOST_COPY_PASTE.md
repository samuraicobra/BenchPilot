# BenchPilot — Devpost copy/paste

## Project name

BenchPilot

## Tagline

Turn messy physical experiments into reproducible evidence.

## Short description

BenchPilot is a multimodal AI lab partner that converts photos, rough notes, and measurements into a validated experimental record, challenges the first interpretation with falsifiable alternatives, ranks the next tests by information gained per unit effort, and compares runs using only structured evidence.

## Public demo

https://benchpilot-build-week.samuraicobra.chatgpt.site

## Repository

https://github.com/samuraicobra/BenchPilot — release branch `master`, tagged `build-week-submission-final`.

## Demo video

`submission/video/BenchPilot-Build-Week-Demo.webm` — 105 seconds, 1920 × 1080, VP8, silent with burned-in captions.

## Technologies used

TypeScript, React, Next.js-compatible App Router, Vinext, Vite, Cloudflare Workers/OpenAI Sites, Tailwind CSS, Zod, Recharts, OpenAI JavaScript SDK, OpenAI Responses API, GPT-5.6, Vitest, Testing Library, Playwright, and FFmpeg.

## Inspiration

Important experiments rarely begin in a clean database. They begin on a workbench: a phone photo, a voltage scribbled in a notebook, an altered material that was not documented, and a theory formed while the result is still fresh. That is normal for independent inventors, student teams, makers, and small labs—but it makes results hard to reproduce and surprisingly easy to over-interpret.

BenchPilot began with a real zinc-air battery question. An older prototype fell from 1.562 V open circuit to 0.482 V after a minute under fan load. A newer improvised Tic Tac-container build measured 1.692 V fresh and approximately 1.10 V under the same or a similar load. Which construction change produced the improvement—and would another build repeat it? The useful answer was not a confident guess. It was a disciplined way to preserve the evidence, expose uncontrolled variables, and choose the next measurement.

## What it does

BenchPilot is a multimodal AI lab partner organized around a five-step workflow: **Capture → Structure → Challenge → Test → Compare**.

- **Capture:** Add experiment photos, rough notes, measurements, materials, and observations in natural language.
- **Structure:** Convert that evidence into a validated experimental record containing apparatus, materials, variables, timestamped measurements, reported observations, image-derived observations, uncertainties, safety considerations, hypotheses, and missing information.
- **Challenge:** Ask for no more than three competing explanations. Each must state its mechanism, evidence for and against, unknowns, confidence, and a falsifying observation.
- **Test:** Rank a small set of follow-up experiments by information value per unit effort. Plans specify the changed variable, controls, exact measurements, hypothesis-specific expected results, stop conditions, safety, and effort.
- **Compare:** Place validated runs on a common voltage-versus-time chart, inspect configuration changes, and see which hypotheses gained or lost support.

The signature interaction is the **Hypothesis Matrix**. Hypotheses form rows; existing observations and planned measurements form columns. Every cell is an explicit supports, contradicts, or non-distinguishing relationship. Adding a new measurement updates the matrix and explains the evidence shift. It makes scientific reasoning visible in a form that is fast enough for a demo and useful enough for a real bench.

BenchPilot never presents a hypothesis as a proven conclusion. Reported facts, visual observations, calculated results, hypotheses, unknowns, safety notes, and recommendations have distinct provenance and visual treatment.

## How we built it

BenchPilot uses strict TypeScript, React, a Next.js-compatible App Router on the Vinext/Vite/Cloudflare runtime, Tailwind CSS, Zod, Recharts, and the official OpenAI JavaScript SDK.

The live AI boundary is server-side. In the preserved private deployment, a guarded route sends untrusted notes and images to the OpenAI Responses API and requests schema-constrained output from GPT-5.6. Versioned prompts treat uploads as evidence, never instructions, and a second parse rejects malformed output. The public Build Week deployment is intentionally different: it contains no API secret, imports no live service in its route, and returns a safe `PUBLIC_DEMO_ONLY` response to every direct analysis request.

Charts, timelines, and the Hypothesis Matrix are deterministic. They consume validated measurements and stable evidence IDs rather than asking the model to draw or invent relationships at render time. A precomputed zinc-air dataset—with the latest run, the rapid-collapse run, and the delayed-recovery run—passes through the same validation and derivation path as live analysis, so the complete public demonstration needs no API key, paid request, or model latency. Contest records persist locally in the browser; no account or database is required.

## Thoughtful use of GPT-5.6

GPT-5.6 is valuable here because the input is heterogeneous and incomplete: a photograph may show a lead position, residue, wetting pattern, or geometry that the notes omit, while the notes contain numerical readings and intent that the image cannot reveal. The model reconciles these sources into a typed record while preserving provenance.

Its more important role comes after extraction. BenchPilot asks the model to disagree constructively: produce competing mechanisms, state negative evidence, identify unknowns, define falsifiers, and predict what each hypothesis would imply in the next experiment. This uses reasoning to improve the experiment—not to manufacture certainty. The UI and schema limit the answer to a small, inspectable set.

## Thoughtful use of Codex

Codex served as an engineering collaborator across planning, domain modeling, implementation, design, QA, and submission preparation. We used it to inspect the starter environment, turn the product brief into a definition of done, split work into non-overlapping streams, check current official API guidance, build typed schemas and deterministic derivations, integrate UI and server boundaries, write adversarial validation tests, and prepare the recording plan.

The most useful part was iteration across layers. A scientific-labeling concern became a schema rule, a visual provenance treatment, and a test. A demo-risk concern became a no-key seeded path using the same runtime validation as live data. Codex also helped keep the build log honest: implementation choices and validation results are recorded separately from aspirations.

## Challenges

The central challenge was epistemic, not cosmetic: how do we make AI assistance rigorous without implying that fluent reasoning is experimental proof? We solved this by separating evidence categories in both the data model and interface, linking matrix judgments to stable observation IDs, requiring falsifiers, and retaining unknowns beside every hypothesis.

The second challenge was reliability. A short judging session cannot depend on a secret, a model response, or network latency. The public zinc-air replay therefore exercises the full product with prevalidated results while hard-disabling paid inference. Genuine live analysis remains available only in the separate owner-restricted deployment.

The third challenge was density. Experiments contain many fields, but the main journey had to be legible in under two minutes. The five-stage workflow, progressive disclosure, concise evidence cards, and matrix-centered story keep attention on the scientific decision.

## Accomplishments we are proud of

- A memorable, end-to-end scientific workflow rather than a generic chat interface.
- A typed provenance model that keeps user facts, visual observations, calculations, uncertainty, and hypotheses distinct.
- A Hypothesis Matrix that turns abstract model reasoning into an inspectable, updateable evidence map.
- Deterministic charts and timelines whose displayed numbers trace to validated structured data.
- A signed-out-safe, no-key replay based on a real zinc-air prototype anomaly, with the paid route disabled at the server boundary.
- Falsifiable next-experiment plans ranked for learning efficiency rather than novelty.

## What we learned

The best AI scientist is not the one that sounds most certain. It is the one that helps a human notice what would change their mind. Structured outputs are most powerful when the schema encodes scientific discipline—not just convenient JSON. We also learned that a resilient demo architecture can improve the product itself: seeded evidence, deterministic derivations, and typed error states make BenchPilot easier to trust and test.

## What comes next

Current limitations are explicit: the three runs lack matched current, elapsed-time, hydration, construction, and environmental controls; the public release does not analyze new visitor uploads; and BenchPilot has not scientifically proven why the newest cell improved. The next step is richer evidence capture: importing sensor logs and attaching calibration metadata while retaining the same provenance rules. Longer term, BenchPilot could support experiment templates, replicated-run statistics, versioned protocols, and export to lab repositories. We would also evaluate hypothesis-quality and calibration against expert-reviewed cases before treating live recommendations as more than decision support.

BenchPilot does not replace scientific judgment. It makes the path from a messy result to a better next experiment visible, reproducible, and shareable.
