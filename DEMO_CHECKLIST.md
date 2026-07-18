# BenchPilot demo checklist

## Canonical zinc-air sample

Use this exact evidence in the seeded demonstration and any live-analysis rehearsal. Preserve the precision shown; do not add interpolated readings.

### Experiment question

> Why did voltage rise during one run but collapse during another?

### Shared reported configuration

| Field       | Exact value                               |
| ----------- | ----------------------------------------- |
| Anode       | Zinc                                      |
| Air cathode | Carbon and manganese dioxide              |
| Binder      | Acrylic binder                            |
| Electrolyte | Approximately 30% KOH                     |
| Separator   | No conventional separator in this version |
| Load        | Fan                                       |

### Run A — `Zinc-air prototype — rapid load collapse`

| Elapsed time | Condition    | Voltage |
| -----------: | ------------ | ------: |
|          0 s | Open circuit | 1.562 V |
|         10 s | Fan load     | 0.732 V |
|         60 s | Fan load     | 0.482 V |

### Run B — `Zinc-air prototype — delayed voltage recovery`

The source note does not provide an open-circuit value for this run. Keep it unknown.

| Elapsed time | Condition  | Voltage |
| -----------: | ---------- | ------: |
|         60 s | Under load | 0.912 V |
|        300 s | Under load | 1.130 V |
|        600 s | Under load | 1.253 V |
|      1,380 s | Under load | 1.298 V |
|      1,800 s | Under load | 1.308 V |

### Data-integrity rules

- Treat every value and material above as **user-reported**, not image-derived.
- Do not infer a zero-time value for Run B.
- Preserve `approximately` on the KOH concentration.
- Do not imply that both runs had identical geometry, temperature, cathode wetting, electrolyte volume, air exposure, contact pressure, or rest time; those are missing controls unless separately documented.
- Show KOH handling, eye/skin exposure, electrical shorting, and safe stop conditions as safety considerations—not proof of a failure mechanism.
- Any image observation must name the image and carry uncertainty. Do not claim scale, hidden construction, chemical composition, or causality from pixels alone.
- Any hypothesis title or confidence shown in the recording must be labeled as AI-generated interpretation.

### Seeded challenge and matrix update

Use these exact seeded hypothesis titles:

1. **Electrolyte redistribution / wetting**
2. **Air-cathode transport state**
3. **Intermittent electrical contact**

The prepared matrix-only measurement is **Voltage after controlled electrolyte rewet: 1.08 V at 60 s**. It is explicitly **simulated** for testing how evidence would update. Keep the simulated label and disclaimer visible. It must never appear in the observed-data timeline or voltage chart.

## Prepared browser state

- [ ] Use the deployed release candidate in a clean Chromium profile at 1440 × 900 and 100% zoom.
- [ ] Hide bookmarks, unrelated tabs, notifications, password prompts, and extensions.
- [ ] Use the light/dark theme selected for final screenshots consistently.
- [ ] Clear BenchPilot local storage, reload, and confirm the polished empty state.
- [ ] Confirm no API key is needed for **Load zinc-air demo**.
- [ ] Preload fonts and static assets once, then reopen the clean start screen.
- [ ] Keep DevTools closed for the main take; prepare a second tab only if an implementation detail is shown.
- [ ] Confirm the exact button/step labels in this checklist match the release UI.
- [ ] Rehearse at normal cursor speed with a visible cursor and no horizontal scroll.

## Primary 105-second recording path

1. **Opening (0:00):** Start on the first viewport with the tagline and **Load zinc-air demo** visible. Wait one beat.
2. **Capture (0:10):** Activate **Load zinc-air demo**. Show the shared configuration, raw question, evidence/image area, and Run A readings.
3. **Structure (0:23):** Open **Structure**. Point to at least three distinct provenance labels—reported fact, image observation or unknown, and safety consideration—without reading every card.
4. **Challenge (0:37):** Open **Challenge**. Show no more than three explanation cards. Pause on one “evidence against” item and one falsifier.
5. **Hypothesis Matrix (0:53):** Fit hypothesis labels and observation columns on screen. Add **Voltage after controlled electrolyte rewet: 1.08 V at 60 s** and keep its **simulated** label visible. Hold long enough to see the changed cell and explanatory text. Never let this simulated value appear on the observed-data chart.
6. **Test (1:10):** Open **Test**. Show the top-ranked plan’s changed variable, required controls, exact readings, hypothesis-specific predictions, stop condition, effort, information value, and safety note.
7. **Compare (1:25):** Open **Compare**. Hover or keyboard-focus the chart points for 0.482 V at 60 s in Run A and 1.308 V at 1,800 s in Run B. Show configuration/unknown differences and the support-shift summary.
8. **Close (1:40):** End on the workflow summary, report action, or BenchPilot mark while delivering the final line.

## Screens to capture

- [ ] Empty/landing state with the one-click demo action.
- [ ] Capture with the zinc-air evidence and clear provenance.
- [ ] Structured record with variables, measurements, unknowns, and safety.
- [ ] Challenge cards with evidence for/against and falsifiers.
- [ ] Hypothesis Matrix before the prepared measurement.
- [ ] Hypothesis Matrix after it, including the change explanation.
- [ ] Ranked next-experiment plan.
- [ ] Comparison chart with both validated runs and configuration differences.
- [ ] Printable/shareable report.
- [ ] Mobile view showing the same workflow hierarchy.

Use the shot order and captions in `SCREENSHOTS.md`.

## Live API insert (optional)

- [ ] Configure `OPENAI_API_KEY` server-side before opening the recording browser.
- [ ] Use a small, accepted image and the canonical notes above.
- [ ] Record the upload, loading state, and validated result as a separate clip.
- [ ] Do not include the key, request headers, console output, raw response, local paths, or personal information.
- [ ] If the response differs from the seed, keep provenance/uncertainty visible and do not use it to replace the stable comparison story.
- [ ] Stop after one good take; the live clip is evidence of capability, not the primary narrative.

## No-key fallback path

If live analysis is slow, rate-limited, unavailable, or produces a result that weakens the two-minute story:

1. Remove/disable the server key and reload in the clean profile.
2. Activate **Load zinc-air demo**; confirm the UI explicitly identifies demo/precomputed analysis.
3. Follow the primary path without mentioning a failed request.
4. If the deployed site itself is unavailable, record the production build locally using the same release SHA.
5. If screen recording must be completed offline, use the previously captured no-key take plus exported screenshots; do not simulate a live API call.

## Final evidence audit

- [ ] The chart shows only the eight readings listed above.
- [ ] Time units are consistent and sorted numerically.
- [ ] Run B has no invented open-circuit point.
- [ ] No model statement is voiced as a proven explanation.
- [ ] The matrix update corresponds to the measurement actually shown.
- [ ] The 1.08 V controlled-rewet value is visibly labeled simulated and is absent from the observed-data chart.
- [ ] Every safety statement is advisory and proportionate.
- [ ] The final video is 90–120 seconds, legible at 1080p, and understandable without audio captions being enabled.
- [ ] Add burned-in captions and verify technical terms: zinc-air, manganese dioxide, KOH, hypothesis, and falsifiable.
