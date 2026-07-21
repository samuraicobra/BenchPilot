# BenchPilot submission checklist

## Submission identity

- **Project title:** BenchPilot
- **Tagline:** Turn messy physical experiments into reproducible evidence.
- **Public demo:** https://benchpilot-build-week.samuraicobra.chatgpt.site
- **Repository information:** local Git checkout on `master`; final release tag `build-week-submission-final`; no hosted repository remote is configured in this checkout.
- **Short description:** BenchPilot turns experiment photos, rough notes, and measurements into a validated record, competing falsifiable hypotheses, high-information next tests, and evidence-grounded run comparisons.
- **Full Devpost copy:** `submission/final/DEVPOST_COPY_PASTE.md`
- **Judge brief:** `submission/final/JUDGE_BRIEF.md`

## Upload assets

- **Demo video:** `submission/video/BenchPilot-Build-Week-Demo.webm`
- **Captions:** `submission/final/DEMO_CAPTIONS.srt` (also burned into the WebM)
- **Printable report:** `submission/artifacts/BenchPilot-Zinc-Air-Report.pdf`
- **Screenshot order:**
  1. `01-opening.png`
  2. `02-structured-record.png`
  3. `03-challenge.png`
  4. `04-hypothesis-matrix.png`
  5. `05-ranked-tests.png`
  6. `06-run-comparison.png`
  7. `07-report.png`
  8. `08-mobile.png`

## Technical summary

- **Technologies:** TypeScript, React, Next.js-compatible App Router, Vinext/Vite, Cloudflare Workers/OpenAI Sites, Tailwind CSS, Zod, Recharts, OpenAI JavaScript SDK, Responses API, GPT-5.6, Vitest, Testing Library, Playwright, and FFmpeg.
- **GPT-5.6:** Multimodal, schema-constrained evidence extraction plus competing mechanisms, falsifiers, and discriminating test plans; the public judge build replays a prevalidated result without paid inference.
- **Codex:** Led repository inspection, architecture, domain modeling, implementation, testing, browser QA, deployment, scientific-value audits, print repair, and final submission packaging. The truthful work log is in `submission/final/CODEX_BUILD_LOG.md`.
- **Testing:** 43 automated tests plus production build, five viewport/zoom browser profiles, keyboard-only workflow, history/reload persistence, screenshot/PDF/video decoding, numerical traceability, and public route smoke tests.
- **Security:** Public Site has no environment variables; GET and POST `/api/analyze` return `403 PUBLIC_DEMO_ONLY`; the private live Site remains owner-only with its API key stored as a hidden server secret.

## Known limitations

- The public judge Site cannot analyze new visitor uploads; it intentionally uses the validated GPT-5.6 zinc-air replay.
- The original prototype photograph is not bundled in the replay.
- Load current, exact load equivalence, timing, hydration, cathode construction, contact resistance, and environmental controls remain incomplete, so BenchPilot does not claim a causal mechanism.
- Browser persistence is device-local.
- The supplied video is silent/captioned; `DEMO_VOICEOVER.txt` is ready for an optional human voice track.
- Native OS print preview was not automated; Chromium A4 output was rendered and inspected page by page.

## Final upload actions

- [ ] Add the hosted repository URL to the contest form.
- [ ] Upload the 105-second WebM and verify platform playback/caption legibility.
- [ ] Upload screenshots in the numeric order above and paste captions from `submission/screenshots/README.md`.
- [ ] Paste the final description from `DEVPOST_COPY_PASTE.md`.
- [ ] Open the public URL once in a signed-out browser from the submission form.
- [ ] Optionally record/add the supplied human voiceover; do not imply synthesized narration is human.
- [ ] Review contest eligibility, intellectual-property, privacy, and legal terms personally.
- [ ] Accept legal terms and submit the form personally. Codex has not done either action.
