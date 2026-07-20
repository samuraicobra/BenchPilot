# BenchPilot judge brief

**Turn messy physical experiments into reproducible evidence.**

BenchPilot is a multimodal AI lab partner for independent inventors, makers, students, and small research teams. It takes the way experiments actually appear—photos, partial notes, readings, and a working theory—and turns them into a structured record, competing explanations, falsifiable next tests, and a visual comparison of runs. The flagship zinc-air case compares an older 0.482 V collapse, a separate rise to 1.308 V, and a latest Tic Tac-container build sustaining approximately 1.10 V, then asks which construction change mattered and whether the gain is reproducible.

## Technical implementation

BenchPilot is built with strict TypeScript, React, a Next.js-compatible App Router on Vinext/Vite/Cloudflare, Zod, Recharts, and the official OpenAI JavaScript SDK. The preserved private build accesses GPT-5.6 only through a server-side Responses API route; the API key is never sent to the browser. The separate public judge build has no secret and hard-rejects direct analysis requests before reading evidence or importing the live service. Notes and images are delimited as untrusted experimental evidence, and versioned prompts request schema-constrained output. A second runtime validation gate prevents malformed or incomplete model data from entering UI state.

The scientific visualizations are deterministic. Timelines sort validated timestamps; the voltage chart reads validated measurement values; matrix cells reference stable hypothesis and evidence IDs. The three-run public replay passes through the same schemas and derivation utilities as live output. Local browser persistence keeps the contest build deployable without accounts or a database.

## Design and user experience

The product is organized around one legible journey: **Capture → Structure → Challenge → Test → Compare**. A prominent **Load zinc-air demo** action makes the full story available immediately. Calm scientific typography, generous space, progressive disclosure, responsive layouts, visible focus states, and consistent semantic colors reduce the cognitive load of a dense experimental record.

Most importantly, provenance is part of the interface—not a disclaimer hidden at the bottom. User-reported facts, image-derived observations, calculations, hypotheses, unknowns, safety considerations, and recommendations remain visibly distinct. Loading, empty, error, success, demo, and live-analysis states are intentional parts of the workflow.

## Potential impact

Small teams often lack a lab information system, a statistician, or time to turn each result into a clean protocol. BenchPilot can lower the cost of disciplined experimental practice: preserving setup details, surfacing uncontrolled variables, resisting premature conclusions, and selecting a high-information next measurement. The immediate audience is makers and students, but the interaction model applies to hardware iteration, materials testing, classroom labs, field research, and early-stage R&D.

BenchPilot is decision support, not an autonomous scientist or safety authority. That boundary is a strength: it helps users reason from evidence without pretending a model response proves a mechanism.

## Quality and originality

The memorable element is the **Hypothesis Matrix**. Competing explanations are rows; observed or planned measurements are columns; every cell shows whether that evidence supports, contradicts, or does not distinguish a hypothesis. When a measurement is added, the matrix updates and explains the evidence shift. This transforms AI reasoning from an agreeable paragraph into an inspectable scientific instrument.

The complete zinc-air workflow is designed to be understood in ten seconds and demonstrated in under two minutes. Reliability is deliberate: no key is needed for the seeded case, charts never invent values, hypotheses include falsifiers and negative evidence, and follow-up experiments are ranked by information value per effort. The result is not a chat screen with scientific styling; it is a focused product for turning uncertainty into the next decisive test.
