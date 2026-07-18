# BenchPilot

**Turn messy physical experiments into reproducible evidence.**

## Inspiration

Important experiments rarely begin in a clean database. They begin on a workbench: a phone photo, a voltage scribbled in a notebook, an altered material that was not documented, and a theory formed while the result is still fresh. That is normal for independent inventors, student teams, makers, and small labs—but it makes results hard to reproduce and surprisingly easy to over-interpret.

BenchPilot began with a real zinc-air battery question. One run fell from 1.562 V open circuit to 0.482 V after a minute under fan load. An earlier run moved in the opposite direction, rising from 0.912 V at one minute to 1.308 V at 30 minutes. Was the difference wetting, oxygen transport, contact resistance, electrolyte distribution, or something else? The useful answer was not a confident guess. It was a disciplined way to preserve the evidence, expose uncertainty, and choose the next measurement.

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

The AI boundary is server-side. A guarded analysis route sends untrusted notes and images to the OpenAI Responses API and requests schema-constrained output from GPT-5.6. Versioned prompts explicitly treat uploaded content as experimental evidence, never as instructions. Model output is parsed again with the same runtime schema before it can enter application state. Malformed responses become typed errors, not half-rendered records.

Charts, timelines, and the Hypothesis Matrix are deterministic. They consume validated measurements and stable evidence IDs rather than asking the model to draw or invent relationships at render time. A precomputed zinc-air dataset passes through the same validation and derivation path as live analysis, so the complete demonstration remains available without an API key or network connection. Contest records persist locally in the browser; no account or database is required.

## Thoughtful use of GPT-5.6

GPT-5.6 is valuable here because the input is heterogeneous and incomplete: a photograph may show a lead position, residue, wetting pattern, or geometry that the notes omit, while the notes contain numerical readings and intent that the image cannot reveal. The model reconciles these sources into a typed record while preserving provenance.

Its more important role comes after extraction. BenchPilot asks the model to disagree constructively: produce competing mechanisms, state negative evidence, identify unknowns, define falsifiers, and predict what each hypothesis would imply in the next experiment. This uses reasoning to improve the experiment—not to manufacture certainty. The UI and schema limit the answer to a small, inspectable set.

## Thoughtful use of Codex

Codex served as an engineering collaborator across planning, domain modeling, implementation, design, QA, and submission preparation. We used it to inspect the starter environment, turn the product brief into a definition of done, split work into non-overlapping streams, check current official API guidance, build typed schemas and deterministic derivations, integrate UI and server boundaries, write adversarial validation tests, and prepare the recording plan.

The most useful part was iteration across layers. A scientific-labeling concern became a schema rule, a visual provenance treatment, and a test. A demo-risk concern became a no-key seeded path using the same runtime validation as live data. Codex also helped keep the build log honest: implementation choices and validation results are recorded separately from aspirations.

## Challenges

The central challenge was epistemic, not cosmetic: how do we make AI assistance rigorous without implying that fluent reasoning is experimental proof? We solved this by separating evidence categories in both the data model and interface, linking matrix judgments to stable observation IDs, requiring falsifiers, and retaining unknowns beside every hypothesis.

The second challenge was reliability. A short judging session cannot depend on a secret, a model response, or network latency. The seeded zinc-air case therefore exercises the full product with prevalidated, realistic results. Live analysis is an enhancement, not a prerequisite for understanding the idea.

The third challenge was density. Experiments contain many fields, but the main journey had to be legible in under two minutes. The five-stage workflow, progressive disclosure, concise evidence cards, and matrix-centered story keep attention on the scientific decision.

## Accomplishments we are proud of

- A memorable, end-to-end scientific workflow rather than a generic chat interface.
- A typed provenance model that keeps user facts, visual observations, calculations, uncertainty, and hypotheses distinct.
- A Hypothesis Matrix that turns abstract model reasoning into an inspectable, updateable evidence map.
- Deterministic charts and timelines whose displayed numbers trace to validated structured data.
- A complete no-key demo based on a real zinc-air prototype anomaly.
- Falsifiable next-experiment plans ranked for learning efficiency rather than novelty.

## What we learned

The best AI scientist is not the one that sounds most certain. It is the one that helps a human notice what would change their mind. Structured outputs are most powerful when the schema encodes scientific discipline—not just convenient JSON. We also learned that a resilient demo architecture can improve the product itself: seeded evidence, deterministic derivations, and typed error states make BenchPilot easier to trust and test.

## What comes next

The next step is richer evidence capture: importing sensor logs and attaching calibration metadata while retaining the same provenance rules. Longer term, BenchPilot could support experiment templates, replicated-run statistics, versioned protocols, and export to lab repositories. We would also evaluate hypothesis-quality and calibration against expert-reviewed cases before treating live recommendations as more than decision support.

BenchPilot does not replace scientific judgment. It makes the path from a messy result to a better next experiment visible, reproducible, and shareable.
