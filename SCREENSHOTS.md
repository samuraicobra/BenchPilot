# BenchPilot screenshot plan

Capture at 1440 × 900 unless noted. Use realistic zinc-air content, a clean browser chrome, consistent theme, visible provenance labels, and no cursor over important text. Export PNGs at 2× when the capture tool permits.

## Hero set

### 1. One click from messy notes to evidence

**Frame:** Landing/empty state with BenchPilot, the tagline, five-stage workflow, and **Load zinc-air demo** above the fold.

**Caption:** “BenchPilot turns photos and rough bench notes into reproducible evidence—no API key required for the complete zinc-air demo.”

**Why it matters:** Establishes the problem and judge path in one image.

### 2. A structured record with provenance

**Frame:** Structure view showing a compact measurement timeline beside at least four labeled categories: reported fact, image observation, unknown, and safety.

**Caption:** “GPT-5.6 structures multimodal evidence while keeping reported facts, visual observations, uncertainty, and safety visibly distinct.”

**Why it matters:** Demonstrates multimodality and scientific restraint.

### 3. Challenge My Interpretation

**Frame:** Two or three competing hypothesis cards with mechanism, evidence for/against, confidence, unknown, and falsifier visible across the frame.

**Caption:** “BenchPilot is designed to disagree constructively: every explanation includes negative evidence, unknowns, and a falsifying observation.”

**Why it matters:** Separates the product from an agreeable chatbot.

### 4. Hypothesis Matrix — before

**Frame:** Full matrix with hypothesis rows, observation/planned-measurement columns, legend, and accessible text labels.

**Caption:** “The Hypothesis Matrix makes competing explanations inspectable: each observation supports, contradicts, or fails to distinguish.”

**Why it matters:** Primary Devpost cover candidate.

### 5. Hypothesis Matrix — evidence update

**Frame:** Same crop after adding the prepared measurement, with changed cell(s) and change explanation highlighted.

**Caption:** “Add one measurement and BenchPilot shows exactly which hypothesis gained or lost support—and why.”

**Why it matters:** The signature before/after product moment.

### 6. Highest-information next test

**Frame:** First-ranked experiment with changed variable, controls, exact measurements, per-hypothesis expected outcomes, effort, information value, stop condition, and safety.

**Caption:** “Next experiments are ranked by information gained per unit effort, with controls, expected outcomes, stop conditions, and safety built in.”

**Why it matters:** Shows the product changes what happens at the bench.

### 7. Two runs, one validated comparison

**Frame:** Voltage-versus-time chart with both run names/legend, readable points, validated-data note, and configuration differences.

**Caption:** “Validated measurements reveal the anomaly at a glance: one loaded run collapses while another slowly recovers.”

**Why it matters:** Provides the clearest numerical proof of product utility.

### 8. Evidence becomes a shareable report

**Frame:** Report/print preview with objective, apparatus, measurements, provenance legend, hypotheses, unknowns, and recommended test.

**Caption:** “The same validated record becomes a clean report without flattening uncertainty into a false conclusion.”

**Why it matters:** Completes Capture → evidence → action → communication.

## Supporting set

### 9. Mobile scientific workflow

**Frame:** 390 × 844 Capture or Matrix view showing the current stage, readable cards, and sticky/obvious next action without horizontal page scroll.

**Caption:** “BenchPilot keeps dense experimental reasoning legible on the workbench, not only at a desktop.”

### 10. Live analysis state

**Frame:** Accepted image thumbnail, bounded upload summary, progress/skeleton state, and abort control. Capture only if implemented and stable.

**Caption:** “Live GPT-5.6 analysis combines image evidence and rough notes through a guarded, server-side structured-output pipeline.”

### 11. Recoverable error state

**Frame:** Safe invalid-response or unavailable-service state with no raw server text and a clear option to retry or load the demo.

**Caption:** “Malformed model output never reaches the record; BenchPilot fails safely and keeps the deterministic demo one click away.”

## Capture standards

- Show only values present in the seeded structured data.
- Keep AI-generated labels and confidence visible; never crop away provenance.
- Avoid decorative device mockups that make chart labels smaller.
- Use the same run colors in every frame and ensure labels work without color.
- Keep the matrix’s supports/contradicts/neutral legend inside the crop.
- Do not show API keys, personal browser data, raw model responses, local paths, or development overlays.
- Use concise alt text matching the frame, not the marketing caption.
- Re-capture after any UI or seed-data change; do not mix different release candidates.

## Suggested order for Devpost

1. Hypothesis Matrix evidence update
2. Landing/one-click demo
3. Structured record with provenance
4. Challenge My Interpretation
5. Highest-information next test
6. Validated run comparison
7. Shareable report
8. Mobile workflow
