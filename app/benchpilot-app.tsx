"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Beaker,
  Camera,
  Check,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Clock3,
  Copy,
  Eye,
  FileText,
  FlaskConical,
  Gauge,
  ImagePlus,
  Info,
  Lightbulb,
  LoaderCircle,
  Microscope,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Scale,
  ShieldAlert,
  Sparkles,
  TestTube2,
  Variable,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  addMatrixObservation,
  analysisSchema,
  buildHypothesisMatrix,
  experimentRunSchema,
  sortMeasurements,
  type DemoDataset,
  type EvidenceProvenance,
  type ExperimentRun,
  type HypothesisMatrix,
  type MatrixEffect,
  type RunComparison,
} from "@/lib/domain";
import { loadDemoDataset } from "@/lib/demo";

const VoltageChart = dynamic(
  () => import("./voltage-chart").then((module) => module.VoltageChart),
  {
    ssr: false,
    loading: () => (
      <div
        className="skeleton skeleton-block"
        aria-label="Loading validated chart"
      />
    ),
  },
);

type Stage = "capture" | "structure" | "challenge" | "test" | "compare";
type Notice = {
  tone: "success" | "error" | "info";
  title: string;
  message: string;
};
type UploadImage = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

const PERSISTENCE_KEY = "benchpilot:experiment-workspace:v1";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const stageDefinitions: Array<{
  id: Stage;
  label: string;
  description: string;
}> = [
  { id: "capture", label: "Capture", description: "Photos + rough notes" },
  {
    id: "structure",
    label: "Structure",
    description: "Evidence with provenance",
  },
  { id: "challenge", label: "Challenge", description: "Competing mechanisms" },
  { id: "test", label: "Test", description: "High-value next steps" },
  { id: "compare", label: "Compare", description: "Runs + support shifts" },
];

const zincAirNotes = `Latest run open-circuit voltage: 1.692 V
Latest loaded voltage: approximately 1.100 V; elapsed time and load current were not recorded
Instrument: Analog Devices Scopy voltmeter
Cell format: improvised Tic Tac container
Zinc-air chemistry; approximately 30% KOH; activated-carbon and manganese-dioxide cathode with acrylic binder
Earlier versions fell to approximately 0.46–0.48 V under the same or a similar load.
Question: Which construction change produced the improvement, and is the gain reproducible?`;

const provenanceLabels: Record<EvidenceProvenance, string> = {
  user_reported: "Reported fact",
  instrument_readout: "Instrument reading",
  image_derived: "Visual observation",
  calculated: "Calculated",
};

function Brand() {
  return (
    <div className="brand" aria-label="BenchPilot home">
      <span className="brand-mark" aria-hidden="true">
        <FlaskConical size={19} strokeWidth={2} />
      </span>
      <span>BenchPilot</span>
    </div>
  );
}

function GlobalHeader({
  hasRun,
  onReport,
  onFresh,
}: {
  hasRun: boolean;
  onReport: () => void;
  onFresh: () => void;
}) {
  return (
    <header className="global-header">
      <Brand />
      <div className="header-actions">
        <span className="mode-pill">
          <span className="mode-dot" /> Demo ready · live optional
        </span>
        {hasRun ? (
          <>
            <button
              className="button button-quiet button-small"
              onClick={onFresh}
            >
              <RotateCcw size={14} /> Start fresh
            </button>
            <button
              className="button button-secondary button-small"
              onClick={onReport}
            >
              <FileText size={14} /> Experiment report
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "Time not recorded";
  if (seconds === 0) return "Start";
  if (seconds < 60) return `${seconds}s`;
  if (seconds % 60 === 0) return `${seconds / 60}m`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function formatValue(value: number): string {
  return value
    .toFixed(Math.abs(value) < 10 ? 3 : 1)
    .replace(/\.0+$|(?<=\.[0-9]*?)0+$/g, "");
}

function EvidenceBadge({ provenance }: { provenance: EvidenceProvenance }) {
  return (
    <span className={`evidence-badge ${provenance}`}>
      {provenance === "image_derived" ? <Eye size={11} /> : null}
      {provenance === "calculated" ? <Gauge size={11} /> : null}
      {provenance === "user_reported" || provenance === "instrument_readout" ? (
        <ClipboardCheck size={11} />
      ) : null}
      {provenanceLabels[provenance]}
    </span>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function CapturePanel({
  notes,
  setNotes,
  uploads,
  setUploads,
  analysisState,
  onAnalyze,
  onCancel,
  onNotice,
  compact = false,
}: {
  notes: string;
  setNotes: (value: string) => void;
  uploads: UploadImage[];
  setUploads: (value: UploadImage[]) => void;
  analysisState: "idle" | "loading";
  onAnalyze: () => void;
  onCancel: () => void;
  onNotice: (notice: Notice) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function acceptFiles(files: File[]) {
    const next = files.slice(0, Math.max(0, 4 - uploads.length));
    const invalid = next.find(
      (file) => !ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_BYTES,
    );
    if (invalid) {
      onNotice({
        tone: "error",
        title: "Image not added",
        message: "Use JPG, PNG, or WebP images no larger than 5 MiB each.",
      });
      return;
    }
    const prepared = await Promise.all(
      next.map(async (file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: await readFileAsDataUrl(file),
      })),
    );
    setUploads([...uploads, ...prepared]);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void acceptFiles(Array.from(event.dataTransfer.files));
  }

  function onInput(event: ChangeEvent<HTMLInputElement>) {
    void acceptFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function onZoneKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  return (
    <section className={`capture-card ${compact ? "capture-compact" : ""}`}>
      <div className="card-title-row">
        <div>
          <h2>Capture the evidence</h2>
          <p>
            Photos and rough notes are treated as evidence, never instructions.
          </p>
        </div>
        <span className="mini-badge">
          <Sparkles size={12} /> GPT-5.6
        </span>
      </div>

      <div
        className={`upload-zone ${dragging ? "dragging" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Upload experiment images"
        onClick={() => inputRef.current?.click()}
        onKeyDown={onZoneKeyDown}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div>
          <ImagePlus size={26} color="var(--zinc)" aria-hidden="true" />
          <strong>Drop experiment images</strong>
          <span>JPG, PNG or WebP · up to 4 images · 5 MiB each</span>
        </div>
      </div>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={onInput}
      />

      {uploads.length ? (
        <div
          className="upload-previews"
          aria-label="Selected experiment images"
        >
          {uploads.map((upload, index) => (
            <div className="upload-preview" key={`${upload.name}-${index}`}>
              {/* A user-selected local data URL is intentionally rendered only in the browser. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={upload.dataUrl} alt={`Preview of ${upload.name}`} />
              <button
                className="preview-remove"
                aria-label={`Remove ${upload.name}`}
                onClick={() =>
                  setUploads(
                    uploads.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="field">
        <label className="field-label" htmlFor="experiment-notes">
          <span>Rough notes and readings</span>
          <button
            className="button button-quiet button-small"
            onClick={() => setNotes(zincAirNotes)}
          >
            Use sample notes
          </button>
        </label>
        <textarea
          id="experiment-notes"
          className="text-area"
          value={notes}
          maxLength={20_000}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Paste readings, materials, what changed, and what surprised you…"
        />
      </div>

      <div className="capture-footer">
        <small>
          Live analysis uses a server-only credential. The complete demo does
          not.
        </small>
        {analysisState === "loading" ? (
          <div className="inline-actions">
            <button className="button button-danger" onClick={onCancel}>
              <XCircle size={15} /> Cancel
            </button>
            <button className="button button-primary loading-button" disabled>
              <LoaderCircle size={16} /> Structuring evidence…
            </button>
          </div>
        ) : (
          <button className="button button-primary" onClick={onAnalyze}>
            Analyze evidence <ArrowRight size={16} />
          </button>
        )}
      </div>
    </section>
  );
}

function Landing({
  onLoadDemo,
  isLoadingDemo,
  notes,
  setNotes,
  uploads,
  setUploads,
  analysisState,
  onAnalyze,
  onCancel,
  onNotice,
}: {
  onLoadDemo: () => void;
  isLoadingDemo: boolean;
  notes: string;
  setNotes: (value: string) => void;
  uploads: UploadImage[];
  setUploads: (value: UploadImage[]) => void;
  analysisState: "idle" | "loading";
  onAnalyze: () => void;
  onCancel: () => void;
  onNotice: (notice: Notice) => void;
}) {
  if (isLoadingDemo) {
    return (
      <main
        className="landing"
        aria-busy="true"
        aria-label="Loading zinc-air demo"
      >
        <div className="demo-loading">
          <div>
            <div className="skeleton skeleton-line short" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </div>
          <div className="skeleton skeleton-block" />
        </div>
      </main>
    );
  }

  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <CircleDot size={14} /> Multimodal evidence workspace
          </p>
          <h1>Messy experiment. Clear next move.</h1>
          <p className="hero-lede">
            BenchPilot turns photos, readings, and rough notes into a
            reproducible record—then challenges your interpretation before it
            recommends the next test.
          </p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={onLoadDemo}>
              <Zap size={17} /> Load zinc-air demo
            </button>
            <button
              className="button button-secondary"
              onClick={() =>
                document.getElementById("experiment-notes")?.focus()
              }
            >
              Capture my experiment <ArrowRight size={16} />
            </button>
          </div>
          <div
            className="trust-row"
            aria-label="Evidence categories remain separate"
          >
            <span className="trust-chip">Confirmed facts</span>
            <span className="trust-chip">Visual observations</span>
            <span className="trust-chip">Uncertain hypotheses</span>
          </div>
          <div className="value-props">
            <div className="value-prop">
              <ClipboardCheck size={18} color="var(--evidence)" />
              <strong>Evidence stays attributable</strong>
              <p>
                Every claim retains its source: user, image, instrument, or
                calculation.
              </p>
            </div>
            <div className="value-prop">
              <Scale size={18} color="var(--amber)" />
              <strong>Agreement is not the goal</strong>
              <p>
                At most three competing mechanisms, each with counter-evidence
                and a falsifier.
              </p>
            </div>
            <div className="value-prop">
              <Activity size={18} color="var(--zinc)" />
              <strong>Charts cannot hallucinate</strong>
              <p>
                Every plotted value comes from the same validated measurement
                record.
              </p>
            </div>
          </div>
        </div>
        <CapturePanel
          notes={notes}
          setNotes={setNotes}
          uploads={uploads}
          setUploads={setUploads}
          analysisState={analysisState}
          onAnalyze={onAnalyze}
          onCancel={onCancel}
          onNotice={onNotice}
        />
      </section>
    </main>
  );
}

function WorkflowNav({
  stage,
  onStage,
}: {
  stage: Stage;
  onStage: (stage: Stage) => void;
}) {
  return (
    <nav className="workflow-nav" aria-label="Experiment workflow">
      <p className="workflow-nav-label">Investigation flow</p>
      <div className="stage-list" role="tablist" aria-label="BenchPilot stages">
        {stageDefinitions.map((definition, index) => (
          <button
            key={definition.id}
            id={`tab-${definition.id}`}
            className="stage-button"
            role="tab"
            aria-selected={stage === definition.id}
            aria-controls={`panel-${definition.id}`}
            onClick={() => onStage(definition.id)}
          >
            <span className="stage-number">0{index + 1}</span>
            <span className="stage-copy">
              <strong>{definition.label}</strong>
              <span>{definition.description}</span>
            </span>
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="nav-legend">
        <strong>Claim language</strong>
        <div className="legend-row">
          <span className="legend-dot" /> Confirmed evidence
        </div>
        <div className="legend-row">
          <span className="legend-dot image" /> AI visual observation
        </div>
        <div className="legend-row">
          <span className="legend-dot hypothesis" /> Hypothesis / unknown
        </div>
      </div>
    </nav>
  );
}

function WorkspaceHeader({
  stage,
  run,
  onReport,
}: {
  stage: Stage;
  run: ExperimentRun;
  onReport: () => void;
}) {
  const definition =
    stageDefinitions.find((item) => item.id === stage) ?? stageDefinitions[0];
  return (
    <div className="workspace-topline">
      <div>
        <p className="run-kicker">
          {run.sourceMode === "demo"
            ? "Zinc-air investigation · seeded evidence"
            : "Live analysis"}
        </p>
        <h1 className="page-title">{definition.label}</h1>
        <p className="workspace-description">
          {stage === "capture"
            ? "Review the raw inputs and preserve what was actually reported before interpretation begins."
            : null}
          {stage === "structure"
            ? "A validated record where every fact, observation, calculation, and unknown keeps its epistemic label."
            : null}
          {stage === "challenge"
            ? "Three or fewer competing mechanisms, evaluated by what supports, contradicts, and could falsify each one."
            : null}
          {stage === "test"
            ? "A short experiment queue ranked by information gained per unit of effort—not by novelty."
            : null}
          {stage === "compare"
            ? "Only validated measurements enter the timeline and voltage chart; interpretation remains a labeled analysis."
            : null}
        </p>
      </div>
      <div className="inline-actions">
        <span className="status-pill">
          <Check size={13} /> Validated · schema 1.0
        </span>
        <button
          className="button button-secondary button-small"
          onClick={onReport}
        >
          <FileText size={14} /> Report
        </button>
      </div>
    </div>
  );
}

function CaptureView(props: {
  run: ExperimentRun;
  notes: string;
  setNotes: (value: string) => void;
  uploads: UploadImage[];
  setUploads: (value: UploadImage[]) => void;
  analysisState: "idle" | "loading";
  onAnalyze: () => void;
  onCancel: () => void;
  onNotice: (notice: Notice) => void;
}) {
  const { run, ...captureProps } = props;
  return (
    <div className="panel-grid">
      <div className="col-7">
        <CapturePanel {...captureProps} compact />
      </div>
      <section className="surface col-5">
        <div className="section-heading">
          <div>
            <h2>Seed evidence</h2>
            <p>
              The demo does not include the original prototype photo; visual
              notes are clearly labeled.
            </p>
          </div>
          <Camera size={18} color="var(--zinc)" />
        </div>
        <div className="fact-list">
          {run.reportedObservations.slice(0, 4).map((observation) => (
            <div className="fact-item" key={observation.id}>
              <span className="item-icon">
                <ClipboardCheck size={15} />
              </span>
              <div>
                <strong>{observation.statement}</strong>
                <p>{observation.sourceNote}</p>
                <EvidenceBadge provenance={observation.provenance} />
              </div>
            </div>
          ))}
          {run.imageObservations.slice(0, 2).map((observation) => (
            <div className="fact-item" key={observation.id}>
              <span className="item-icon">
                <Eye size={15} />
              </span>
              <div>
                <strong>{observation.statement}</strong>
                <p>{observation.limitations}</p>
                <EvidenceBadge provenance={observation.provenance} />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="surface col-12 surface-highlight">
        <div className="section-heading">
          <div>
            <h3>Question under investigation</h3>
            <p>Kept as a question—not silently converted into a conclusion.</p>
          </div>
          <Lightbulb size={18} color="var(--amber)" />
        </div>
        <p className="objective-copy">{run.objective}</p>
      </section>
    </div>
  );
}

function VariableGroup({
  title,
  variables,
}: {
  title: string;
  variables: ExperimentRun["independentVariables"];
}) {
  return (
    <div className="variable-group">
      <h4>{title}</h4>
      <div className="variable-grid">
        {variables.map((variable) => (
          <div className="variable-card" key={variable.id}>
            <strong>{variable.name}</strong>
            <span>
              {variable.value === null
                ? "Not recorded"
                : `${variable.value}${variable.unit ? ` ${variable.unit}` : ""}`}
            </span>
            <span>{variable.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StructureView({ run }: { run: ExperimentRun }) {
  const measurements = sortMeasurements(run.measurements);
  return (
    <div className="panel-grid">
      <section className="surface col-12 surface-highlight">
        <div className="section-heading">
          <div>
            <h2>{run.title}</h2>
            <p>
              Structured {new Date(run.createdAt).toLocaleDateString()} ·{" "}
              {run.measurements.length} validated measurements
            </p>
          </div>
          <EvidenceBadge provenance="user_reported" />
        </div>
        <p className="objective-copy">{run.objective}</p>
      </section>

      <section className="surface col-5">
        <div className="section-heading">
          <div>
            <h3>Apparatus</h3>
            <p>Physical setup recorded from supplied evidence.</p>
          </div>
          <Microscope size={18} color="var(--zinc)" />
        </div>
        <div className="apparatus-list">
          {run.apparatus.map((item) => (
            <div className="apparatus-item" key={item.id}>
              <span className="item-icon">
                <Beaker size={15} />
              </span>
              <div>
                <strong>{item.name}</strong>
                <p>{item.details ?? "Detail not recorded"}</p>
                <EvidenceBadge provenance={item.provenance} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="surface col-7">
        <div className="section-heading">
          <div>
            <h3>Materials</h3>
            <p>Composition is preserved only where the user supplied it.</p>
          </div>
          <TestTube2 size={18} color="var(--evidence)" />
        </div>
        <div className="material-grid">
          {run.materials.map((material) => (
            <div className="material-card" key={material.id}>
              <span className="material-role">{material.role}</span>
              <strong>{material.name}</strong>
              <span>{material.composition ?? "Composition unknown"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="surface col-5">
        <div className="section-heading">
          <div>
            <h3>Variables</h3>
            <p>Uncontrolled items remain visible as unknowns.</p>
          </div>
          <Variable size={18} color="var(--amber)" />
        </div>
        <VariableGroup
          title="Changed / independent"
          variables={run.independentVariables}
        />
        <VariableGroup
          title="Measured / dependent"
          variables={run.dependentVariables}
        />
        <VariableGroup
          title="Intended controls"
          variables={run.controlledVariables}
        />
      </section>

      <section className="surface col-7">
        <div className="section-heading">
          <div>
            <h3>Measurement timeline</h3>
            <p>
              Ordered deterministically by elapsed time. No model-authored chart
              points.
            </p>
          </div>
          <Clock3 size={18} color="var(--zinc)" />
        </div>
        <div className="timeline">
          {measurements.map((measurement) => (
            <div className="timeline-item" key={measurement.id}>
              <span className="timeline-time">
                {formatDuration(measurement.elapsedSeconds)}
              </span>
              <span className="timeline-name">
                <strong>{measurement.name}</strong>
                <span>{measurement.condition}</span>
              </span>
              <span className="timeline-value">
                {formatValue(measurement.value)} {measurement.unit}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="surface col-8">
        <div className="section-heading">
          <div>
            <h3>Observations by provenance</h3>
            <p>
              Reported facts and image-derived details never merge silently.
            </p>
          </div>
          <Eye size={18} color="var(--zinc)" />
        </div>
        <div className="observation-columns">
          <div className="observation-card reported">
            <strong>Reported by the researcher</strong>
            <ul>
              {run.reportedObservations.map((item) => (
                <li key={item.id}>{item.statement}</li>
              ))}
            </ul>
          </div>
          <div className="observation-card image">
            <strong>Observed from images</strong>
            <ul>
              {run.imageObservations.length ? (
                run.imageObservations.map((item) => (
                  <li key={item.id}>
                    {item.statement}{" "}
                    <span className="muted">({item.confidence})</span>
                  </li>
                ))
              ) : (
                <li>No image-derived observations in this record.</li>
              )}
            </ul>
          </div>
        </div>
      </section>

      <section className="surface col-4">
        <div className="section-heading">
          <div>
            <h3>Calculated results</h3>
            <p>Derived—not measured.</p>
          </div>
          <Gauge size={18} color="var(--amber)" />
        </div>
        <div className="fact-list">
          {run.calculatedResults.map((result) => (
            <div className="fact-item" key={result.id}>
              <span className="item-icon">
                <Gauge size={15} />
              </span>
              <div>
                <strong>
                  {result.name}: {formatValue(result.value)} {result.unit}
                </strong>
                <p>
                  {result.formula} · {result.interpretation}
                </p>
                <EvidenceBadge provenance="calculated" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="surface col-6">
        <div className="section-heading">
          <div>
            <h3>Unknowns and uncertainty</h3>
            <p>Gaps that could change the interpretation.</p>
          </div>
          <Info size={18} color="var(--amber)" />
        </div>
        <div className="warning-grid">
          {run.uncertainties.slice(0, 3).map((item) => (
            <div className="warning-card" key={item.id}>
              <strong>{item.description}</strong>
              <p>{item.impact}</p>
            </div>
          ))}
          {run.missingInformation.slice(0, 3).map((item, index) => (
            <div className="warning-card" key={`${item}-${index}`}>
              <strong>Missing information</strong>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface col-6">
        <div className="section-heading">
          <div>
            <h3>Safety considerations</h3>
            <p>Precautions, not a safety certification.</p>
          </div>
          <ShieldAlert size={18} color="var(--danger)" />
        </div>
        <div className="warning-grid">
          {run.safetyConsiderations.map((item) => (
            <div
              className={`warning-card ${item.severity === "high" ? "danger" : ""}`}
              key={item.id}
            >
              <strong>
                {item.hazard} · {item.severity}
              </strong>
              <p>{item.precaution}</p>
              <p>
                <b>Stop:</b> {item.stopCondition}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function evidenceDescription(run: ExperimentRun, id: string): string {
  const measurement = run.measurements.find((item) => item.id === id);
  if (measurement)
    return `${measurement.name}: ${formatValue(measurement.value)} ${measurement.unit} at ${formatDuration(measurement.elapsedSeconds)}`;
  const reported = run.reportedObservations.find((item) => item.id === id);
  if (reported) return reported.statement;
  const image = run.imageObservations.find((item) => item.id === id);
  if (image) return image.statement;
  const calculated = run.calculatedResults.find((item) => item.id === id);
  if (calculated)
    return `${calculated.name}: ${formatValue(calculated.value)} ${calculated.unit}`;
  return id.replaceAll("-", " ");
}

function MatrixIcon({ effect }: { effect: MatrixEffect }) {
  if (effect === "supports") return <Check size={16} />;
  if (effect === "contradicts") return <X size={16} />;
  if (effect === "does_not_distinguish") return <Minus size={16} />;
  return <Info size={14} />;
}

const effectLabels: Record<MatrixEffect, string> = {
  supports: "Supports",
  contradicts: "Contradicts",
  does_not_distinguish: "Does not distinguish",
  unknown: "Unknown",
};

function HypothesisMatrixView({
  run,
  matrix,
  updateScenario,
  onApplyUpdate,
}: {
  run: ExperimentRun;
  matrix: HypothesisMatrix;
  updateScenario: DemoDataset["simulatedMatrixUpdate"] | null;
  onApplyUpdate: () => void;
}) {
  const built = buildHypothesisMatrix({ ...run, hypothesisMatrix: matrix });
  const updateApplied = Boolean(
    updateScenario &&
    matrix.observations.some(
      (item) => item.id === updateScenario.observation.id,
    ),
  );
  return (
    <section className="matrix-shell">
      <div className="matrix-heading">
        <div>
          <h3>Hypothesis Matrix</h3>
          <p>
            Rows compete. Columns discriminate. Every cell has an explicit
            evidence relationship.
          </p>
        </div>
        <div className="inline-actions" aria-label="Matrix legend">
          <span
            className="mini-badge"
            style={{ background: "var(--evidence-soft)" }}
          >
            <Check size={11} /> Support
          </span>
          <span
            className="mini-badge"
            style={{ background: "var(--danger-soft)" }}
          >
            <X size={11} /> Contradict
          </span>
          <span className="mini-badge">
            <Minus size={11} /> Neutral
          </span>
        </div>
      </div>
      <div className="matrix-scroll">
        <table className="matrix-table">
          <thead>
            <tr>
              <th scope="col">Competing explanation</th>
              {built.observations.map((observation) => (
                <th
                  scope="col"
                  key={observation.id}
                  title={observation.description}
                >
                  {observation.label}
                  {observation.status === "planned" ? (
                    <span
                      className="mini-badge"
                      style={{ margin: "6px auto 0" }}
                    >
                      Planned
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {built.rows.map(({ hypothesis, cells }) => (
              <tr key={hypothesis.id}>
                <th className="matrix-row-label" scope="row">
                  <strong>{hypothesis.title}</strong>
                  <span>{hypothesis.confidence} confidence</span>
                </th>
                {cells.map((cell) => (
                  <td
                    className={`matrix-cell ${cell.effect}`}
                    key={cell.observationId}
                    title={cell.rationale}
                  >
                    <span className="matrix-cell-icon">
                      <MatrixIcon effect={cell.effect} />
                    </span>
                    <span>{effectLabels[cell.effect]}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {updateScenario ? (
        <div className={`matrix-update ${updateApplied ? "" : "simulated"}`}>
          <span className="item-icon">
            {updateApplied ? <RefreshCw size={15} /> : <Plus size={15} />}
          </span>
          <div>
            <strong>
              {updateApplied ? "Matrix updated" : updateScenario.title}
            </strong>
            <span>
              {updateApplied
                ? matrix.lastUpdateSummary
                : `${formatValue(updateScenario.measurement.value)} ${updateScenario.measurement.unit} at ${formatDuration(updateScenario.measurement.elapsedSeconds)} · ${updateScenario.measurement.disclaimer}`}
            </span>
          </div>
          {!updateApplied ? (
            <button
              className="button button-primary button-small"
              onClick={onApplyUpdate}
            >
              Add simulated measurement
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ChallengeView({
  run,
  matrix,
  updateScenario,
  onApplyUpdate,
}: {
  run: ExperimentRun;
  matrix: HypothesisMatrix;
  updateScenario: DemoDataset["simulatedMatrixUpdate"] | null;
  onApplyUpdate: () => void;
}) {
  return (
    <>
      <div className="challenge-intro">
        <Scale size={22} color="var(--amber)" />
        <div>
          <strong>BenchPilot is designed to disagree usefully.</strong>
          <p>
            These are competing, falsifiable explanations—not conclusions.
            Confidence is calibrated to the available evidence and unknown
            controls.
          </p>
        </div>
      </div>
      <div className="hypothesis-grid">
        {run.hypotheses.map((hypothesis, index) => (
          <article className="hypothesis-card" key={hypothesis.id}>
            <span className="hypothesis-index">H{index + 1}</span>
            <h3>{hypothesis.title}</h3>
            <p>{hypothesis.mechanism}</p>
            <span className={`confidence-pill ${hypothesis.confidence}`}>
              {hypothesis.confidence} confidence
            </span>
            <div className="evidence-pair">
              <div className="evidence-stack supports">
                <strong>
                  <Check size={11} /> For
                </strong>
                <p>
                  {hypothesis.evidenceSupporting.length
                    ? evidenceDescription(run, hypothesis.evidenceSupporting[0])
                    : "No direct support recorded."}
                </p>
              </div>
              <div className="evidence-stack contradicts">
                <strong>
                  <X size={11} /> Against
                </strong>
                <p>
                  {hypothesis.evidenceAgainst.length
                    ? evidenceDescription(run, hypothesis.evidenceAgainst[0])
                    : "No direct contradiction recorded."}
                </p>
              </div>
            </div>
            <div className="falsifier">
              <strong>Would falsify it</strong>
              <p>{hypothesis.falsifier}</p>
            </div>
          </article>
        ))}
      </div>
      <HypothesisMatrixView
        run={run}
        matrix={matrix}
        updateScenario={updateScenario}
        onApplyUpdate={onApplyUpdate}
      />
    </>
  );
}

function TestView({ run }: { run: ExperimentRun }) {
  const experiments = [...run.nextExperiments].sort(
    (left, right) => left.rank - right.rank,
  );
  return (
    <div className="experiment-list">
      {experiments.map((experiment) => (
        <article
          className={`experiment-card ${experiment.rank === 1 ? "rank-one" : ""}`}
          key={experiment.id}
        >
          <div className="rank-block" aria-label={`Rank ${experiment.rank}`}>
            {experiment.rank}
          </div>
          <div>
            <div className="section-heading" style={{ marginBottom: 0 }}>
              <div>
                <h3>{experiment.title}</h3>
                <p className="rationale">{experiment.rationale}</p>
              </div>
              {experiment.rank === 1 ? (
                <span
                  className="mini-badge"
                  style={{ background: "var(--evidence-soft)" }}
                >
                  <Sparkles size={11} /> Best next move
                </span>
              ) : null}
            </div>
            <div className="experiment-details">
              <div className="detail-block">
                <strong>Change one variable</strong>
                <p>{experiment.changedVariable}</p>
              </div>
              <div className="detail-block">
                <strong>Keep controlled</strong>
                <ul>
                  {experiment.controlledVariables.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="detail-block">
                <strong>Measure exactly</strong>
                <ul>
                  {experiment.measurementsToCapture.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="detail-block">
                <strong>Stop + safety</strong>
                <p>
                  {experiment.stopConditions[0]} {experiment.safetyNote}
                </p>
              </div>
            </div>
            <div
              className="expectation-table"
              aria-label={`Expected results for ${experiment.title}`}
            >
              {experiment.expectations.map((expectation) => {
                const hypothesis = run.hypotheses.find(
                  (item) => item.id === expectation.hypothesisId,
                );
                return (
                  <div
                    className="expectation-row"
                    key={expectation.hypothesisId}
                  >
                    <div className="expectation-hypothesis">
                      {hypothesis?.title ?? expectation.hypothesisId}
                    </div>
                    <div>
                      <strong>If true:</strong> {expectation.expectedResult}
                    </div>
                    <div>
                      <strong>Would weaken:</strong>{" "}
                      {expectation.resultThatWeakensIt}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <aside className="experiment-score">
            <div className="score-label">
              <span>Information / effort</span>
              <strong>{experiment.informationGainPerEffort.toFixed(1)}</strong>
            </div>
            <div className="score-track">
              <div
                className="score-fill"
                style={{
                  width: `${experiment.informationGainPerEffort * 10}%`,
                }}
              />
            </div>
            <div className="score-meta">
              <div>
                <span>Effort</span>
                <strong>{experiment.estimatedEffort}</strong>
              </div>
              <div>
                <span>Info value</span>
                <strong>{experiment.informationValue}</strong>
              </div>
            </div>
          </aside>
        </article>
      ))}
    </div>
  );
}

function CompareView({
  activeRun,
  comparisonRun,
  comparison,
}: {
  activeRun: ExperimentRun;
  comparisonRun: ExperimentRun | null;
  comparison: RunComparison | null;
}) {
  if (!comparisonRun || !comparison) {
    return (
      <div className="empty-state">
        <Activity size={28} color="var(--zinc)" />
        <h3>Add another run to compare</h3>
        <p>
          BenchPilot needs two validated records before it can construct a
          shared timeline or support-shift analysis.
        </p>
      </div>
    );
  }
  const hypothesisById = new Map(
    activeRun.hypotheses.map((item) => [item.id, item]),
  );
  const comparedRuns = [comparisonRun, activeRun];
  const plottedMeasurementCount = comparedRuns.flatMap((run) =>
    run.measurements.filter(
      (measurement) =>
        measurement.unit === "V" && measurement.elapsedSeconds !== null,
    ),
  ).length;
  const unplottedMeasurementCount = comparedRuns.flatMap((run) =>
    run.measurements.filter(
      (measurement) =>
        measurement.unit === "V" && measurement.elapsedSeconds === null,
    ),
  ).length;
  return (
    <div className="panel-grid">
      <section className="surface col-12">
        <div className="section-heading">
          <div>
            <h2>Voltage vs. elapsed time</h2>
            <p>
              All {plottedMeasurementCount} plotted values come from validated
              structured records.
              {unplottedMeasurementCount > 0
                ? ` ${unplottedMeasurementCount} validated reading with unrecorded elapsed time is listed below but not plotted.`
                : ""}
            </p>
          </div>
          <span className="chart-legend-note">
            <CircleDot size={12} /> No model-authored points
          </span>
        </div>
        <VoltageChart runs={comparedRuns} />
      </section>
      <section className="surface col-7 surface-highlight">
        <div className="section-heading">
          <div>
            <h3>What changed in the evidence</h3>
            <p>Labeled AI comparison—not a proven mechanism.</p>
          </div>
          <Scale size={18} color="var(--amber)" />
        </div>
        <p className="compare-summary">{comparison.summary}</p>
        <div
          className="causal-warning"
          role="note"
          aria-label="Causal attribution warning"
        >
          <AlertTriangle size={19} aria-hidden="true" />
          <div>
            <strong>Causal attribution is not yet valid</strong>
            <p>Control these before naming the winning construction change:</p>
            <ul>
              {comparison.changedVariables.map((variable) => (
                <li key={variable}>{variable}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="support-shifts" style={{ marginTop: 18 }}>
          {comparison.hypothesisSupportShifts.map((shift) => (
            <div
              className={`shift-item ${shift.direction}`}
              key={shift.hypothesisId}
            >
              <span className="shift-arrow">
                {shift.direction === "gained" ? (
                  <ArrowUpRight size={16} />
                ) : shift.direction === "lost" ? (
                  <ArrowDownRight size={16} />
                ) : (
                  <Minus size={16} />
                )}
              </span>
              <div>
                <strong>
                  {hypothesisById.get(shift.hypothesisId)?.title ??
                    shift.hypothesisId}{" "}
                  · {shift.direction} support
                </strong>
                <span>{shift.explanation}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="surface col-5">
        <div className="section-heading">
          <div>
            <h3>Configuration differences</h3>
            <p>Potentially uncontrolled changes stay explicit.</p>
          </div>
          <Variable size={18} color="var(--zinc)" />
        </div>
        <div className="difference-list">
          {comparison.configurationDifferences.map((difference) => (
            <div className="difference-item" key={difference.field}>
              <strong>{difference.field}</strong>
              <div className="difference-values">
                <div>
                  <b>Earlier</b>
                  <br />
                  {difference.baselineValue}
                </div>
                <div>
                  <b>Current</b>
                  <br />
                  {difference.comparisonValue}
                </div>
              </div>
              <p>{difference.significance}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="surface col-12">
        <div className="section-heading">
          <div>
            <h3>Readable measurement timeline</h3>
            <p>
              Side-by-side readings preserve gaps instead of interpolating them.
            </p>
          </div>
          <Clock3 size={18} color="var(--zinc)" />
        </div>
        <div className="panel-grid">
          {[comparisonRun, activeRun].map((run) => (
            <div className="col-6" key={run.id}>
              <h4 style={{ margin: "0 0 8px" }}>{run.title}</h4>
              <div className="timeline">
                {sortMeasurements(run.measurements).map((measurement) => (
                  <div className="timeline-item" key={measurement.id}>
                    <span className="timeline-time">
                      {formatDuration(measurement.elapsedSeconds)}
                    </span>
                    <span className="timeline-name">
                      <strong>{measurement.condition}</strong>
                      <span>{measurement.name}</span>
                    </span>
                    <span className="timeline-value">
                      {formatValue(measurement.value)} {measurement.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReportDialog({
  run,
  onClose,
  onNotice,
}: {
  run: ExperimentRun;
  onClose: () => void;
  onNotice: (notice: Notice) => void;
}) {
  useEffect(() => {
    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  async function copySummary() {
    const summary = `${run.title}\n\nObjective: ${run.objective}\n\nMeasurements:\n${sortMeasurements(
      run.measurements,
    )
      .map(
        (item) =>
          `- ${formatDuration(item.elapsedSeconds)}: ${item.value} ${item.unit} (${item.condition})`,
      )
      .join(
        "\n",
      )}\n\nLeading hypotheses:\n${run.hypotheses.map((item) => `- ${item.title} (${item.confidence} confidence): ${item.mechanism}`).join("\n")}\n\nBenchPilot separates evidence from interpretation; this report does not prove a scientific conclusion.`;
    try {
      await navigator.clipboard.writeText(summary);
      onNotice({
        tone: "success",
        title: "Summary copied",
        message: "Paste it into your lab notebook, email, or project update.",
      });
    } catch {
      onNotice({
        tone: "error",
        title: "Copy unavailable",
        message: "Use Print / save PDF to export this report instead.",
      });
    }
  }

  return (
    <div
      className="report-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
    >
      <div className="report-shell">
        <div className="report-toolbar">
          <button className="button button-secondary" onClick={copySummary}>
            <Copy size={15} /> Copy summary
          </button>
          <button
            className="button button-primary"
            onClick={() => window.print()}
          >
            <FileText size={15} /> Print / save PDF
          </button>
          <button className="button button-secondary" onClick={onClose}>
            <X size={15} /> Close
          </button>
        </div>
        <article className="report-sheet">
          <header className="report-heading">
            <div>
              <span className="report-brand">BenchPilot experiment report</span>
              <h1 className="report-title" id="report-title">
                {run.title}
              </h1>
            </div>
            <div className="report-meta">
              Generated from validated structured data
              <br />
              {new Date(run.createdAt).toLocaleDateString()} · {run.sourceMode}{" "}
              mode
            </div>
          </header>
          <section className="report-section">
            <h2>Objective</h2>
            <p>{run.objective}</p>
          </section>
          <section className="report-section">
            <h2>Setup</h2>
            <p>
              <b>Apparatus:</b>{" "}
              {run.apparatus.map((item) => item.name).join(", ")}
            </p>
            <p>
              <b>Materials:</b>{" "}
              {run.materials
                .map((item) => `${item.name} (${item.role})`)
                .join(", ")}
            </p>
          </section>
          <section className="report-section">
            <h2>Measurements</h2>
            <div className="timeline">
              {sortMeasurements(run.measurements).map((measurement) => (
                <div className="timeline-item" key={measurement.id}>
                  <span className="timeline-time">
                    {formatDuration(measurement.elapsedSeconds)}
                  </span>
                  <span className="timeline-name">
                    <strong>{measurement.name}</strong>
                    <span>{measurement.condition}</span>
                  </span>
                  <span className="timeline-value">
                    {formatValue(measurement.value)} {measurement.unit}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="report-section">
            <h2>Competing hypotheses</h2>
            {run.hypotheses.map((hypothesis) => (
              <p key={hypothesis.id}>
                <b>
                  {hypothesis.title} · {hypothesis.confidence} confidence.
                </b>{" "}
                {hypothesis.mechanism}
                <br />
                <em>Falsifier:</em> {hypothesis.falsifier}
              </p>
            ))}
          </section>
          <section className="report-section">
            <h2>Recommended next test</h2>
            <p>
              <b>{run.nextExperiments[0]?.title}</b> —{" "}
              {run.nextExperiments[0]?.rationale}
            </p>
          </section>
          <div className="report-disclaimer">
            <b>Evidence boundary:</b> This report separates user-reported facts,
            image-derived observations, calculations, hypotheses, and
            recommendations. It is decision support, not proof, certification,
            or a substitute for laboratory safety review.
          </div>
        </article>
      </div>
    </div>
  );
}

function NoticeToast({
  notice,
  onClose,
}: {
  notice: Notice;
  onClose: () => void;
}) {
  return (
    <div
      className={`notice ${notice.tone}`}
      role={notice.tone === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <span className="item-icon">
        {notice.tone === "success" ? (
          <Check size={15} />
        ) : notice.tone === "error" ? (
          <AlertTriangle size={15} />
        ) : (
          <Info size={15} />
        )}
      </span>
      <div>
        <strong>{notice.title}</strong>
        <span>{notice.message}</span>
      </div>
      <button
        className="notice-close"
        aria-label="Dismiss notification"
        onClick={onClose}
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function BenchPilotApp() {
  const [stage, setStage] = useState<Stage>("capture");
  const [runs, setRuns] = useState<ExperimentRun[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [comparisonRunId, setComparisonRunId] = useState<string | null>(null);
  const [comparison, setComparison] = useState<RunComparison | null>(null);
  const [updateScenario, setUpdateScenario] = useState<
    DemoDataset["simulatedMatrixUpdate"] | null
  >(null);
  const [matrixOverride, setMatrixOverride] = useState<HypothesisMatrix | null>(
    null,
  );
  const [notes, setNotes] = useState("");
  const [uploads, setUploads] = useState<UploadImage[]>([]);
  const [analysisState, setAnalysisState] = useState<"idle" | "loading">(
    "idle",
  );
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showReport, setShowReport] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const restoredRef = useRef(false);

  const activeRun =
    runs.find((run) => run.id === activeRunId) ?? runs[0] ?? null;
  const comparisonRun = runs.find((run) => run.id === comparisonRunId) ?? null;

  useEffect(() => {
    try {
      const persisted = localStorage.getItem(PERSISTENCE_KEY);
      if (!persisted) return;
      const parsed = JSON.parse(persisted) as {
        runs?: unknown[];
        activeRunId?: unknown;
        comparisonRunId?: unknown;
      };
      const restoredRuns = (parsed.runs ?? [])
        .map((run) => experimentRunSchema.safeParse(run))
        .filter((result) => result.success)
        .map((result) => result.data);
      if (!restoredRuns.length) return;
      queueMicrotask(() => {
        setRuns(restoredRuns);
        setActiveRunId(
          typeof parsed.activeRunId === "string"
            ? parsed.activeRunId
            : restoredRuns[0].id,
        );
        setComparisonRunId(
          typeof parsed.comparisonRunId === "string"
            ? parsed.comparisonRunId
            : (restoredRuns[1]?.id ?? null),
        );
        const demo = loadDemoDataset();
        if (
          restoredRuns.some((run) => run.id === demo.activeRunId) &&
          restoredRuns.some((run) => run.id === demo.comparisonRunId)
        ) {
          setComparison(demo.comparison);
          setUpdateScenario(demo.simulatedMatrixUpdate);
        }
        setNotice({
          tone: "info",
          title: "Workspace restored",
          message:
            "Validated experiment records were loaded from this browser.",
        });
      });
    } catch {
      localStorage.removeItem(PERSISTENCE_KEY);
    } finally {
      restoredRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!restoredRef.current || !runs.length) return;
    localStorage.setItem(
      PERSISTENCE_KEY,
      JSON.stringify({ runs, activeRunId, comparisonRunId }),
    );
  }, [runs, activeRunId, comparisonRunId]);

  function loadDemo() {
    setIsLoadingDemo(true);
    window.setTimeout(() => {
      const demo = loadDemoDataset();
      setRuns(demo.runs);
      setActiveRunId(demo.activeRunId);
      setComparisonRunId(demo.comparisonRunId);
      setComparison(demo.comparison);
      setUpdateScenario(demo.simulatedMatrixUpdate);
      setMatrixOverride(null);
      setNotes(zincAirNotes);
      setStage("capture");
      setIsLoadingDemo(false);
      setNotice({
        tone: "success",
        title: "Zinc-air investigation loaded",
        message:
          "Two validated runs, three competing hypotheses, and a ranked test plan are ready.",
      });
    }, 420);
  }

  function startFresh() {
    abortRef.current?.abort();
    setRuns([]);
    setActiveRunId(null);
    setComparisonRunId(null);
    setComparison(null);
    setUpdateScenario(null);
    setMatrixOverride(null);
    setNotes("");
    setUploads([]);
    setStage("capture");
    localStorage.removeItem(PERSISTENCE_KEY);
    setNotice({
      tone: "info",
      title: "Fresh workspace",
      message: "Local experiment records were cleared from this browser.",
    });
  }

  async function analyzeLive() {
    if (!notes.trim()) {
      setNotice({
        tone: "error",
        title: "Add experiment notes",
        message:
          "Include at least one reported reading or observation before live analysis.",
      });
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setAnalysisState("loading");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          notes,
          images: uploads.map((upload) => upload.dataUrl),
        }),
        signal: controller.signal,
      });
      const payload = (await response.json()) as {
        analysis?: unknown;
        error?: { message?: string; code?: string };
      };
      if (!response.ok)
        throw new Error(
          payload.error?.message ?? "Live analysis could not be completed.",
        );
      const parsed = analysisSchema.safeParse(payload.analysis);
      if (!parsed.success)
        throw new Error("The server returned an invalid structured result.");
      setRuns((current) => [
        parsed.data.run,
        ...current.filter((run) => run.id !== parsed.data.run.id),
      ]);
      setActiveRunId(parsed.data.run.id);
      setComparisonRunId(null);
      setComparison(null);
      setUpdateScenario(null);
      setMatrixOverride(null);
      setStage("structure");
      setNotice({
        tone: "success",
        title: "Evidence structured",
        message: "The validated GPT-5.6 result is ready for review.",
      });
    } catch (error) {
      if (controller.signal.aborted) {
        setNotice({
          tone: "info",
          title: "Analysis cancelled",
          message: "Your notes and selected images are still here.",
        });
      } else {
        setNotice({
          tone: "error",
          title: "Live analysis unavailable",
          message:
            error instanceof Error
              ? error.message
              : "Use the complete zinc-air demo while live mode is unavailable.",
        });
      }
    } finally {
      setAnalysisState("idle");
      abortRef.current = null;
    }
  }

  function applyMatrixUpdate() {
    if (!activeRun || !updateScenario) return;
    try {
      const updated = addMatrixObservation(
        activeRun.hypothesisMatrix,
        activeRun.hypotheses,
        updateScenario.observation,
        updateScenario.cells,
        updateScenario.changeSummary,
      );
      setMatrixOverride(updated);
      setNotice({
        tone: "success",
        title: "Matrix updated",
        message: updateScenario.changeSummary,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        title: "Matrix update rejected",
        message:
          error instanceof Error
            ? error.message
            : "The update did not pass validation.",
      });
    }
  }

  return (
    <div className="bp-app">
      <GlobalHeader
        hasRun={Boolean(activeRun)}
        onReport={() => setShowReport(true)}
        onFresh={startFresh}
      />
      {!activeRun ? (
        <Landing
          onLoadDemo={loadDemo}
          isLoadingDemo={isLoadingDemo}
          notes={notes}
          setNotes={setNotes}
          uploads={uploads}
          setUploads={setUploads}
          analysisState={analysisState}
          onAnalyze={() => void analyzeLive()}
          onCancel={() => abortRef.current?.abort()}
          onNotice={setNotice}
        />
      ) : (
        <div className="workspace">
          <WorkflowNav stage={stage} onStage={setStage} />
          <main
            className="workspace-main"
            id={`panel-${stage}`}
            role="tabpanel"
            aria-labelledby={`tab-${stage}`}
          >
            <WorkspaceHeader
              stage={stage}
              run={activeRun}
              onReport={() => setShowReport(true)}
            />
            {stage === "capture" ? (
              <CaptureView
                run={activeRun}
                notes={notes}
                setNotes={setNotes}
                uploads={uploads}
                setUploads={setUploads}
                analysisState={analysisState}
                onAnalyze={() => void analyzeLive()}
                onCancel={() => abortRef.current?.abort()}
                onNotice={setNotice}
              />
            ) : null}
            {stage === "structure" ? <StructureView run={activeRun} /> : null}
            {stage === "challenge" ? (
              <ChallengeView
                run={activeRun}
                matrix={matrixOverride ?? activeRun.hypothesisMatrix}
                updateScenario={updateScenario}
                onApplyUpdate={applyMatrixUpdate}
              />
            ) : null}
            {stage === "test" ? <TestView run={activeRun} /> : null}
            {stage === "compare" ? (
              <CompareView
                activeRun={activeRun}
                comparisonRun={comparisonRun}
                comparison={comparison}
              />
            ) : null}
          </main>
        </div>
      )}
      {showReport && activeRun ? (
        <ReportDialog
          run={activeRun}
          onClose={() => setShowReport(false)}
          onNotice={setNotice}
        />
      ) : null}
      {notice ? (
        <NoticeToast notice={notice} onClose={() => setNotice(null)} />
      ) : null}
    </div>
  );
}
