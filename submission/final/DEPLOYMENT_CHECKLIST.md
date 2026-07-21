# BenchPilot Build Week deployment checklist

## Release identity

- [x] Public judge Site: https://benchpilot-build-week.samuraicobra.chatgpt.site
- [x] Separate private live Site preserved: https://benchpilot.samuraicobra.chatgpt.site
- [x] Existing `build-week-submission-v1` tag preserved.
- [x] Final source is synchronized to the Sites source repository.
- [x] Public Sites project is active/public and the private Site is active/custom owner-only.

## Public security boundary

- [x] Public project has zero environment variables and no hosted secret.
- [x] Public `/api/analyze` imports neither the OpenAI SDK nor the live analysis service.
- [x] Direct GET and POST return `403 PUBLIC_DEMO_ONLY` without reading evidence.
- [x] Production source maps are disabled.
- [x] Repository and built-output scans contain no committed secret values.
- [x] Built output contains no `OPENAI_API_KEY` or `api.openai.com` marker.
- [x] `.env.example` contains empty, safe documentation only.
- [x] Private `OPENAI_API_KEY` remains a hidden server-only secret; its value was never read or printed.

## Data integrity

- [x] Latest run: 1.692 V fresh OCV and approximately 1.100 V loaded with unknown elapsed time.
- [x] Collapse run: 1.562 V OCV, 0.732 V at 10 s, 0.482 V at 60 s.
- [x] Recovery run: 0.912 V at 1 m, 1.130 V at 5 m, 1.253 V at 10 m, 1.298 V at 23 m, 1.308 V at 30 m.
- [x] Chart tuples exactly equal all time-qualified fixture measurements.
- [x] Unknown-time 1.100 V reading is absent from the chart.
- [x] Simulated matched-replicate reading is absent from observed runs and charts.
- [x] No unsupported numerical current, internal resistance, output power, or energy is shown.
- [x] −0.460 V screenshot minimum is labeled an uncertain transient, not proven reversal.
- [x] Uncontrolled variables remain explicit before any causal attribution.

## Production browser verification

- [x] Signed-out public URL returns HTTP 200 with no ChatGPT sign-in gate.
- [x] Capture → Structure → Challenge → Test → Compare traversed in real Chrome.
- [x] Matrix simulated update and persistent explanation verified.
- [x] Report dialog, keyboard controls, and Escape close verified.
- [x] Back, forward, reload, and direct navigation verified.
- [x] Chrome console/page-error pass completed with no application or static-asset failure.
- [x] Direct production analysis GET/POST rechecked at HTTP 403.
- [x] Private Site remains owner-only and was not redeployed.

## Viewports and artifacts

- [x] Desktop 1440 × 1000.
- [x] Laptop 1280 × 800.
- [x] Tablet 768 × 1024.
- [x] Mobile 390 × 844.
- [x] Approximate 200% zoom equivalent at 720 × 500 CSS pixels with 2× scale.
- [x] Keyboard-only primary workflow.
- [x] Eight production PNG screenshots captured and visually inspected.
- [x] Three-page A4 report PDF rendered and visually inspected.
- [x] 105-second 1920 × 1080 captioned WebM decoded and visually inspected.
- [x] Original `DEMO_CAPTIONS.srt` preserved.

## Final automated gate

- [x] Formatting check passes.
- [x] ESLint passes with zero warnings and errors.
- [x] Strict TypeScript check passes.
- [x] All 43 tests pass.
- [x] Production Vinext/Vite build succeeds.
- [x] `npm audit --omit=dev` reports zero vulnerabilities.
- [x] Secret scans pass.
- [x] Working tree is clean after the release commit.

## Human-only actions

- [ ] Add the hosted repository URL to the submission form.
- [ ] Upload the WebM, screenshots, and final copy.
- [ ] Optionally record/add the supplied human voiceover.
- [ ] Review and accept contest/legal terms personally.
- [ ] Submit the contest form personally.
