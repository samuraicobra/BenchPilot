# BenchPilot Build Week deployment checklist

## Release candidate

- [x] Product title, metadata, favicon, and social image identify BenchPilot.
- [x] Public source labels the experience as a validated GPT-5.6 demo replay.
- [x] Demo fixture contains the latest, collapse, and recovery runs.
- [x] No D1 or R2 binding is required.
- [x] Separate public Sites project created; existing private live project was not modified.

Public URL: `https://benchpilot-build-week.samuraicobra.chatgpt.site`

Public Sites project: `benchpilot-build-week`

Private live URL: `https://benchpilot.samuraicobra.chatgpt.site` (owner-only, preserved)

## Public API security

- [x] Public project has zero environment variables and no hosted secret.
- [x] `/api/analyze` imports neither the OpenAI SDK nor the live analysis service.
- [x] Direct GET and POST return `403 PUBLIC_DEMO_ONLY` without reading evidence.
- [x] Production source maps are disabled.
- [x] Repository and built-output scans found no secret-value pattern.
- [x] Built output contains no `OPENAI_API_KEY` or `api.openai.com` marker.
- [x] `.env.example` contains empty variable names and safe documentation only.

## Automated release gate

- [x] Formatter check passes.
- [x] ESLint passes with zero warnings and zero errors.
- [x] Strict TypeScript check passes.
- [x] Unit tests pass.
- [x] Integration/API/UI tests pass.
- [x] Rendered production HTML tests pass.
- [x] Production Vinext/Vite build succeeds.
- [x] `npm audit --omit=dev` reports zero vulnerabilities.
- [x] Local production HTTP smoke: `/` returns 200; analysis GET/POST return 403.

See `RELEASE_QA.md` and `CODEX_BUILD_LOG.md` for exact evidence and counts.

## Data integrity

- [x] Latest run: 1.692 V fresh OCV and approximately 1.100 V loaded with unknown elapsed time.
- [x] Collapse run: 1.562 V OCV, 0.732 V at 10 s, 0.482 V at 60 s.
- [x] Recovery run: 0.912 V at 1 m, 1.130 V at 5 m, 1.253 V at 10 m, 1.298 V at 23 m, 1.308 V at 30 m.
- [x] Chart tuples exactly equal time-qualified fixture measurements.
- [x] Unknown-time 1.100 V reading is absent from the chart.
- [x] Simulated matched-replicate reading is absent from observed runs and charts.
- [x] No current, internal resistance, or output power is calculated without sufficient input data.
- [x] -0.460 V screenshot minimum is labeled an uncertain transient, not proven reversal.
- [x] Ten uncontrolled variables are listed before causal attribution.

## Production verification

- [x] Public deployment reaches `succeeded`.
- [x] Open public URL signed out and confirm no ChatGPT sign-in gate.
- [ ] Load demo and traverse Capture → Structure → Challenge → Test → Compare.
- [ ] Apply the simulated matrix update and confirm its explanation.
- [ ] Verify report Print / save PDF in the target browser.
- [x] Recheck direct `/api/analyze` GET and POST on production.
- [ ] Confirm no client-console or static-asset failures.

## Manual visual and recording checks

- [ ] Desktop 1440 × 900 visual pass.
- [ ] Tablet 768 × 1024 visual pass.
- [ ] Mobile 390 × 844 visual pass.
- [ ] Keyboard-only complete flow and 200% zoom pass.
- [ ] Capture the eight states in `submission/screenshots/README.md`.
- [ ] Record and verify the 105-second video using `DEMO_SHOT_LIST.md`.
- [ ] Add and verify `DEMO_CAPTIONS.srt`.
- [ ] Submit the Devpost entry and accept contest terms personally.

Manual items remain unchecked because no browser automation, screen-capture, or legal-submission authority is available in this environment.
