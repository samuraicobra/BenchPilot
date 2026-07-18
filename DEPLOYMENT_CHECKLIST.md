# BenchPilot deployment checklist

## 1. Release candidate

- [ ] Work from the intended release commit/branch; record its SHA below.
- [ ] Confirm the page title, metadata, favicon, social image, and public product name all say **BenchPilot**.
- [ ] Confirm the prominent **Load zinc-air demo** action works in a clean browser profile with no API key.
- [ ] Remove starter copy, placeholder controls, debug panels, console logging of evidence, and unused assets.
- [ ] Confirm no D1 or R2 binding is required; `.openai/hosting.json` should remain valid for browser-only persistence.

Release SHA: `d5721a02725051368c7ecf08f2bffe2bf7c51b3d`

## 2. Secrets and configuration

- [ ] Copy `.env.example` to `.env.local` for local live-analysis testing.
- [ ] Set `OPENAI_API_KEY` only in the server/deployment secret store—never in a `NEXT_PUBLIC_*` variable.
- [ ] Confirm the intended GPT-5.6 model identifier/default is documented and supported by the deployed API account.
- [ ] Search tracked files for API keys, bearer tokens, private URLs, raw uploads, and local environment files.
- [ ] Verify logs contain request metadata and typed error codes only, not image data, notes, keys, or complete model responses.
- [ ] Confirm `.env.local`, Wrangler state, build output, and local browser fixtures are ignored.

## 3. Local quality gate

Run from the repository root:

```bash
npm ci
npx prettier --check .
npm run lint
npx tsc --noEmit
npm test
npm run build
```

- [ ] Formatting passes.
- [ ] Lint passes with zero warnings/errors that affect submission quality.
- [ ] Strict type checking passes.
- [ ] Unit/integration tests pass.
- [ ] Production build completes.
- [ ] Record the command output summary in `CODEX_BUILD_LOG.md`.

## 4. Functional release checks

- [ ] Clean profile, no key: load demo and traverse Capture → Structure → Challenge → Test → Compare.
- [ ] Refresh after loading the demo: supported local state restores cleanly.
- [ ] Clear local storage: the empty state and demo action return.
- [ ] Every plotted voltage matches the seeded structured record; no chart uses model-authored display coordinates.
- [ ] Add the prepared measurement: matrix cells and the change explanation update together.
- [ ] Print/export the report and verify provenance and uncertainty labels remain visible.
- [ ] Live key configured: submit valid notes and an accepted image type; confirm a schema-valid record.
- [ ] Invalid key: show a recoverable, non-secret error.
- [ ] Malformed/incomplete upstream output fixture: reject it before UI state.
- [ ] Unsupported file, oversized file/request, abort, timeout, and offline paths have clear recovery actions.

## 5. Accessibility and responsive QA

- [ ] Complete the primary flow using keyboard only; focus order follows the visual workflow.
- [ ] Controls have accessible names; tabs/steps expose current selection; matrix cells are understandable without color.
- [ ] Focus indicators remain visible against every surface.
- [ ] Check contrast for fact, observation, hypothesis, warning, unknown, and matrix states.
- [ ] Verify reduced-motion behavior and that skeletons do not create repetitive screen-reader announcements.
- [ ] Inspect at 390 × 844, 768 × 1024, 1440 × 900, and 1920 × 1080.
- [ ] At 200% zoom, no required action or scientific label is clipped.

## 6. Publish through OpenAI Sites

- [ ] Confirm the production build succeeds on the configured Vinext/Vite/Cloudflare Sites runtime.
- [ ] Publish the release candidate using the repository’s OpenAI Sites deployment workflow.
- [ ] Add `OPENAI_API_KEY` to the production server environment if live analysis will be demonstrated.
- [ ] Do not add database or object-storage bindings for the contest build.
- [ ] Record the public URL, deployment timestamp, release SHA, and deployment ID below.

- Private production URL: `https://benchpilot.samuraicobra.chatgpt.site`
- Deployment time: `2026-07-18 15:30 UTC`
- Deployment ID: `appgdep_6a5b9c0fec7081919f3ad3af997c80fb`

The deployed version is owner-only by default. Before sending the URL to judges, the owner must explicitly change Sites access to public and repeat the signed-out production smoke test.

## 7. Production smoke test

- [ ] Open the public URL in a signed-out/incognito browser.
- [ ] Time to a meaningful first screen is acceptable on a cold load.
- [ ] **Load zinc-air demo** completes without a network dependency.
- [ ] All five stages, the chart, Hypothesis Matrix update, and report work.
- [ ] Direct refresh and browser back/forward behavior are safe.
- [ ] No client console errors, failed static assets, mixed content, or source maps exposing secrets.
- [ ] If enabled, make one small live API request and verify server-side error/timeout behavior.
- [ ] Re-run the 105-second recording path on the public build.

## 8. Submission handoff

- [ ] Freeze the demo dataset after chart-value audit.
- [ ] Capture screenshots listed in `SCREENSHOTS.md`.
- [ ] Record the primary no-key video and optional live-analysis insert.
- [ ] Verify Devpost copy and judge brief match the released behavior.
- [ ] Keep the last known-good deployment URL and a local screen recording as fallback.
- [ ] Do not redeploy during judging unless fixing a release-blocking issue.
