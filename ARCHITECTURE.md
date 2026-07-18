# BenchPilot architecture

## System view

```mermaid
flowchart LR
  subgraph Browser["Browser"]
    U["Photos + rough notes"] --> W["Capture → Structure → Challenge → Test → Compare"]
    W --> V["Zod-validated application state"]
    V --> L["Local browser persistence"]
    V --> D["Deterministic derivations"]
    D --> T["Timeline"]
    D --> C["Voltage chart"]
    D --> M["Hypothesis Matrix"]
    D --> R["Printable report"]
  end

  W -->|"multipart/JSON request"| A["Server-only analysis route"]
  A --> G["Size + MIME guards"]
  G --> P["Versioned prompt boundary"]
  P -->|"untrusted evidence + image input"| O["OpenAI Responses API / GPT-5.6"]
  O --> S["Structured output"]
  S --> Z["Runtime schema validation"]
  Z -->|"typed success or typed error"| W

  E["Seeded zinc-air envelope"] --> Z
```

## Trust boundaries

1. **User content is evidence, not instruction.** Notes, filenames, and image content are wrapped as untrusted experiment material. They cannot modify the system goal, schema, or safety policy.
2. **Secrets stay server-side.** Only the analysis route reads `OPENAI_API_KEY`; client code receives a typed response envelope.
3. **Validation is the state boundary.** Live and seeded records must pass the same Zod schema before the UI consumes them. Invalid or incomplete model output returns a recoverable error.
4. **The model does not render numbers.** Timelines, charts, comparisons, and matrix state are derived in TypeScript from validated records and explicit evidence links.
5. **Provenance survives presentation.** Evidence types remain distinct through schema, state, UI labels, and report output.

## Major modules

| Area           | Responsibility                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Domain schemas | Experiment records, evidence provenance, hypotheses, planned tests, comparisons, analysis envelope, runtime validation |
| Seed data      | Two zinc-air runs plus precomputed challenges, test plans, and matrix relationships                                    |
| Derivations    | Measurement normalization and sorting, chart series, matrix construction, support deltas                               |
| Workflow UI    | Five-stage navigation, responsive evidence cards, state feedback, report surface                                       |
| Analysis route | Request limits, file checks, abort/error mapping, safe logging, OpenAI SDK call                                        |
| Prompt module  | Versioned system/developer prompts, evidence delimiters, JSON-schema contract                                          |
| Persistence    | Contest-mode records and preferences in `localStorage`; no database                                                    |

## Core data flow

```mermaid
sequenceDiagram
  actor Researcher
  participant UI as BenchPilot UI
  participant API as /api/analyze
  participant Model as GPT-5.6
  participant Schema as Runtime schema

  Researcher->>UI: Add photos, notes, and readings
  UI->>API: Submit bounded evidence request
  API->>Model: Versioned instructions + image input + structured schema
  Model-->>API: Schema-constrained experiment envelope
  API->>Schema: Parse and validate
  alt valid
    Schema-->>UI: Typed experiment record
    UI->>UI: Derive timeline, chart, matrix, and report
  else invalid or incomplete
    Schema-->>UI: Typed recoverable error
  end
```

## Deployment shape

The repository targets the bundled Vinext/Vite/Cloudflare Sites runtime. `.openai/hosting.json` declares no D1 or R2 binding because the contest build uses browser persistence and ephemeral image submission. The production artifact is created with `npm run build`; publishing is performed through the configured OpenAI Sites workflow. Live analysis requires a server-side `OPENAI_API_KEY`; the seeded demonstration does not.

## Deliberate constraints

There is no authentication, team layer, payment system, database, autonomous hardware control, or claim of scientific proof. Those exclusions keep the trust boundary small and the two-minute demonstration reliable.
