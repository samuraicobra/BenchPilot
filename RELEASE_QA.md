# BenchPilot public release QA

This file records checks actually performed for the public Build Week release candidate. Unperformed browser checks remain explicitly marked **Not performed**.

| Test                             | Environment                    | Result             | Evidence                                                                                      | Limitation                                       |
| -------------------------------- | ------------------------------ | ------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Fixture schema validation        | Vitest / Node 22               | Pass               | `demoDatasetSchema` validates all three runs; clone safety test passes                        | Automated boundary test only                     |
| Latest measurements              | Vitest                         | Pass               | 1.692 V at start and ~1.100 V with unknown elapsed time asserted                              | Source values are user-reported                  |
| Earlier collapse series          | Vitest                         | Pass               | 1.562 V, 0.732 V at 10 s, 0.482 V at 60 s asserted                                            | Fan current unknown                              |
| Earlier recovery series          | Vitest                         | Pass               | 0.912, 1.130, 1.253, 1.298, 1.308 V with exact times asserted                                 | Load equivalence unknown                         |
| Chart provenance                 | Vitest                         | Pass               | Derived chart tuple set equals every time-qualified fixture measurement; no interpolation     | Visual rendering still needs browser capture     |
| Unknown-time exclusion           | Vitest                         | Pass               | ~1.100 V is absent from time chart and remains in the timeline                                | None                                             |
| Matrix derivation                | Vitest                         | Pass               | Matrix validates hypothesis/observation references and simulated update effects               | Simulation is not observed evidence              |
| Public replay without API key    | React integration test         | Pass               | Replay completes with `fetch` stubbed and never called                                        | Browser network panel not available here         |
| Direct analysis route            | Route test                     | Pass               | GET and POST return 403 `PUBLIC_DEMO_ONLY`; route imports neither OpenAI SDK nor live service | Production endpoint to be rechecked after deploy |
| Report values and print action   | React integration test         | Pass               | Dialog contains 1.692 V and 1.1 V; print handler invoked                                      | OS print preview not automated here              |
| Keyboard workflow navigation     | React integration test         | Pass               | ArrowRight moves Capture → Structure and transfers focus                                      | Full manual keyboard pass not available here     |
| Uncertainty boundary             | Vitest + React integration     | Pass               | Ten named uncontrolled variables, transient limitation, and no-calculation boundary asserted  | Scientific controls remain future work           |
| Formatter                        | Local release workspace        | Pending final gate | Run after documentation freeze                                                                | —                                                |
| Linter                           | Local release workspace        | Pending final gate | Must finish with zero warnings                                                                | —                                                |
| Type check                       | Local release workspace        | Pending final gate | Strict TypeScript                                                                             | —                                                |
| Production build                 | Vinext/Vite                    | Pending final gate | Cloudflare-compatible output                                                                  | —                                                |
| Dependency audit                 | npm                            | Pending final gate | `npm audit --omit=dev`                                                                        | Advisory availability depends on registry access |
| Signed-out public access         | Production                     | Pending deployment | Must open without ChatGPT sign-in                                                             | —                                                |
| Desktop visual QA                | Browser                        | Not performed      | Browser automation/capture tool is unavailable in this environment                            | Follow screenshot/recording state list           |
| Tablet visual QA                 | Browser                        | Not performed      | Same                                                                                          | Check 768 × 1024                                 |
| Mobile visual QA                 | Browser                        | Not performed      | Same                                                                                          | Check 390 × 844                                  |
| Browser back/forward and refresh | Browser                        | Not performed      | Same                                                                                          | Workflow is local state rather than URL-routed   |
| Missing-image behavior           | Automated component inspection | Pass               | Replay does not require an image and upload remains optional                                  | Manual drag/drop still recommended               |
| Long-note behavior               | React integration test         | Pass               | 20,000-character input can initiate replay without network access                             | Manual wrapping/scroll visual check remains      |

## Numerical audit rule

Only fixture measurements with recorded elapsed time enter the chart. The approximately 1.100 V latest loaded reading remains visible in the record and timeline but is excluded from the time chart. The simulated 1.100 V-at-60-second matched-replicate scenario appears only in the Hypothesis Matrix and never in observed runs or chart data.

## Final automated totals

- Unit tests: 20 passed.
- API/UI integration tests: 21 passed.
- Rendered production HTML tests: 2 passed.
- Total: 43 passed, 0 failed.
- Local production HTTP: root 200; analysis GET 403; analysis POST 403.
- Signed-out production HTTPS: root 200 with no sign-in gate; analysis GET 403; analysis POST 403.
- Public URL: `https://benchpilot-build-week.samuraicobra.chatgpt.site`.
- Secret/build scan: 0 tracked secret-value matches, 0 built OpenAI/secret markers, 0 production source maps.
