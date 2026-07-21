# BenchPilot public release QA

This ledger records checks actually performed against the signed-out public Build Week deployment. Machine-readable browser evidence is in `submission/artifacts/browser-qa-results.json`.

## Browser and interaction results

| Check                     | Exact environment                       | Result | Evidence / limitation                                                                                                                      |
| ------------------------- | --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Desktop                   | Chrome, 1440 × 1000                     | Pass   | Zero page overflow; all stages, chart, matrix, and report reachable                                                                        |
| Laptop                    | Chrome, 1280 × 800                      | Pass   | Same checks; long evidence text wraps                                                                                                      |
| Tablet                    | Chrome, 768 × 1024                      | Pass   | Same checks; matrix remains usable in its intentional scroll surface                                                                       |
| Mobile                    | Chrome, 390 × 844                       | Pass   | Zero page overflow; navigation and controls reachable; `08-mobile.png`                                                                     |
| Approx. 200% desktop zoom | 720 × 500 CSS pixels at 2× device scale | Pass   | Equivalent high-scale layout pass; zero page overflow                                                                                      |
| Keyboard-only workflow    | 1440 × 1000                             | Pass   | Tab to replay CTA; Enter activation; arrow keys traverse Capture → Compare; visible focus; report controls reachable; Escape closes dialog |
| Back / forward            | Fresh browser history                   | Pass   | Back returns to `about:blank`; forward restores the public URL with HTTP 200 and visible CTA                                               |
| Reload persistence        | Every viewport profile                  | Pass   | Validated replay restores from browser storage without changing URL                                                                        |
| Direct navigation         | Fresh signed-out contexts               | Pass   | Canonical public URL returns HTTP 200 with no sign-in gate                                                                                 |
| Long notes                | Every viewport profile                  | Pass   | 20,000 characters accepted without clipping/truncation before replay reset                                                                 |
| Browser runtime           | All release contexts                    | Pass   | No application console errors or page exceptions; deployed favicon is explicitly linked                                                    |

## Numerical and scientific-value audit

- Latest fresh open-circuit voltage: **1.692 V**.
- Latest loaded voltage: **approximately 1.100 V**, elapsed time not recorded; it remains visible in the record/report and is not inserted into the time chart.
- Earlier rapid-collapse run: **1.562 V open circuit**, **0.732 V at 10 s**, **0.482 V at 60 s**.
- Earlier delayed-recovery run: **0.912 V at 1 min**, **1.130 V at 5 min**, **1.253 V at 10 min**, **1.298 V at 23 min**, **1.308 V at 30 min**.
- The chart contains exactly the nine validated time-qualified points across three runs. No interpolation or model-authored point is displayed.
- The **−0.460 V** Scopy minimum remains labeled an uncertain screenshot transient, not proven polarity reversal.
- No measured current, internal resistance, output power, or energy is displayed or calculated without sufficient inputs.
- Load/current, hydration, cathode thickness, air exposure, contact resistance, clamping pressure, zinc surface, temperature, timing, and assembly age remain explicit causal controls. No construction change is presented as proven.
- The matrix update is visibly labeled **simulated/planned** and never enters observed runs or the chart.

## Export and artifact verification

- Eight PNG screenshots exist and decode successfully at their documented dimensions; visual inspection confirmed readable text and clean capture states.
- `submission/artifacts/BenchPilot-Zinc-Air-Report.pdf` is an unencrypted, three-page A4 PDF. Chromium generated it from the deployed report; Poppler rendered every page for visual inspection.
- The PDF includes 1.692 V, 1.1 V, the dedicated uncertainty/missing-controls section, competing hypotheses, the ranked next test, and the evidence boundary. It contains no fabricated numerical current or power.
- Native OS print preview was not automated. Chromium PDF output is the precise fallback exercised.
- `submission/video/BenchPilot-Build-Week-Demo.webm` verifies as WebM/VP8, 1920 × 1080, 25 fps, exactly 105.00 seconds, silent with burned-in captions. Eight decoded frames were visually inspected.

## Automated quality totals

- Unit tests: 20 passed.
- API/UI integration tests: 21 passed.
- Rendered production HTML tests: 2 passed.
- Total: **43 passed, 0 failed**.
- Production dependency audit: zero production vulnerabilities (`npm audit --omit=dev`).
- Public route: GET and POST `/api/analyze` return HTTP 403 with `PUBLIC_DEMO_ONLY`.
- Public project: active, public, zero environment variables.
- Private project: active, custom owner-only access (one user, zero groups); `OPENAI_API_KEY` remains a hidden server secret and was not returned.

## Scope limits

This is not assistive-technology certification or scientific validation of the zinc-air mechanism. The public replay does not perform new paid inference. The separate private live deployment was preserved and not modified during the public release.
