import { z } from "zod";

export const ANALYSIS_API_CONTRACT_VERSION = "benchpilot.analysis-api.v2";

const idSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a stable kebab-case identifier");
const textSchema = z.string().trim().min(1).max(2_000);
const shortTextSchema = z.string().trim().min(1).max(240);

export const sourceModeSchema = z.enum(["demo", "live"]);
export const runStatusSchema = z.enum(["draft", "structured", "reviewed"]);
export const confidenceSchema = z.enum(["low", "medium", "high"]);
export const evidenceProvenanceSchema = z.enum([
  "user_reported",
  "image_derived",
  "instrument_readout",
  "calculated",
]);

export const apparatusItemSchema = z
  .object({
    id: idSchema,
    name: shortTextSchema,
    details: textSchema.nullable(),
    provenance: evidenceProvenanceSchema,
  })
  .strict();

export const materialSchema = z
  .object({
    id: idSchema,
    name: shortTextSchema,
    role: shortTextSchema,
    composition: shortTextSchema.nullable(),
    quantity: z.number().finite().nullable(),
    unit: shortTextSchema.nullable(),
    provenance: evidenceProvenanceSchema,
  })
  .strict();

export const variableSchema = z
  .object({
    id: idSchema,
    name: shortTextSchema,
    value: z
      .union([z.string().trim().min(1).max(500), z.number().finite()])
      .nullable(),
    unit: shortTextSchema.nullable(),
    description: textSchema,
    provenance: evidenceProvenanceSchema,
  })
  .strict();

export const measurementUncertaintySchema = z
  .object({
    value: z.number().finite().nonnegative().nullable(),
    unit: shortTextSchema.nullable(),
    note: textSchema,
  })
  .strict();

export const measurementSchema = z
  .object({
    id: idSchema,
    name: shortTextSchema,
    value: z.number().finite(),
    unit: shortTextSchema,
    elapsedSeconds: z.number().finite().nonnegative().nullable(),
    capturedAt: z.string().datetime({ offset: true }).nullable(),
    method: textSchema,
    condition: textSchema,
    provenance: evidenceProvenanceSchema,
    uncertainty: measurementUncertaintySchema.nullable(),
  })
  .strict();

export const reportedObservationSchema = z
  .object({
    id: idSchema,
    statement: textSchema,
    elapsedSeconds: z.number().finite().nonnegative().nullable(),
    sourceNote: textSchema,
    provenance: z.literal("user_reported"),
  })
  .strict();

export const imageObservationSchema = z
  .object({
    id: idSchema,
    statement: textSchema,
    imageId: idSchema,
    confidence: confidenceSchema,
    limitations: textSchema,
    provenance: z.literal("image_derived"),
  })
  .strict();

export const calculatedResultSchema = z
  .object({
    id: idSchema,
    name: shortTextSchema,
    formula: shortTextSchema,
    inputMeasurementIds: z.array(idSchema).min(1).max(20),
    value: z.number().finite(),
    unit: shortTextSchema,
    interpretation: textSchema,
    provenance: z.literal("calculated"),
  })
  .strict();

export const uncertaintySchema = z
  .object({
    id: idSchema,
    description: textSchema,
    impact: textSchema,
    mitigation: textSchema,
  })
  .strict();

export const safetyConsiderationSchema = z
  .object({
    id: idSchema,
    hazard: shortTextSchema,
    severity: z.enum(["low", "moderate", "high"]),
    precaution: textSchema,
    stopCondition: textSchema,
  })
  .strict();

export const hypothesisSchema = z
  .object({
    id: idSchema,
    title: shortTextSchema,
    mechanism: textSchema,
    evidenceSupporting: z.array(idSchema).max(20),
    evidenceAgainst: z.array(idSchema).max(20),
    unknowns: z.array(textSchema).min(1).max(12),
    confidence: confidenceSchema,
    falsifier: textSchema,
  })
  .strict();

export const hypothesisExpectationSchema = z
  .object({
    hypothesisId: idSchema,
    expectedResult: textSchema,
    resultThatWeakensIt: textSchema,
  })
  .strict();

export const nextExperimentSchema = z
  .object({
    id: idSchema,
    rank: z.number().int().min(1).max(10),
    title: shortTextSchema,
    rationale: textSchema,
    changedVariable: textSchema,
    controlledVariables: z.array(textSchema).min(1).max(20),
    measurementsToCapture: z.array(textSchema).min(1).max(20),
    expectations: z.array(hypothesisExpectationSchema).min(1).max(3),
    stopConditions: z.array(textSchema).min(1).max(10),
    safetyNote: textSchema,
    estimatedEffort: z.enum(["low", "medium", "high"]),
    informationValue: z.enum(["low", "medium", "high"]),
    informationGainPerEffort: z.number().finite().min(0).max(10),
  })
  .strict();

export const matrixObservationSchema = z
  .object({
    id: idSchema,
    label: shortTextSchema,
    description: textSchema,
    status: z.enum(["observed", "planned"]),
    evidenceId: idSchema.nullable(),
    measurementId: idSchema.nullable(),
  })
  .strict();

export const matrixEffectSchema = z.enum([
  "supports",
  "contradicts",
  "does_not_distinguish",
  "unknown",
]);

export const matrixCellSchema = z
  .object({
    hypothesisId: idSchema,
    observationId: idSchema,
    effect: matrixEffectSchema,
    rationale: textSchema,
    evidenceIds: z.array(idSchema).max(20),
  })
  .strict();

export const hypothesisMatrixSchema = z
  .object({
    observations: z.array(matrixObservationSchema).max(20),
    cells: z.array(matrixCellSchema).max(60),
    lastUpdateSummary: textSchema,
  })
  .strict();

export const experimentRunSchema = z
  .object({
    id: idSchema,
    title: shortTextSchema,
    objective: textSchema,
    createdAt: z.string().datetime({ offset: true }),
    status: runStatusSchema,
    sourceMode: sourceModeSchema,
    apparatus: z.array(apparatusItemSchema).max(30),
    materials: z.array(materialSchema).max(30),
    independentVariables: z.array(variableSchema).max(30),
    dependentVariables: z.array(variableSchema).min(1).max(30),
    controlledVariables: z.array(variableSchema).max(30),
    measurements: z.array(measurementSchema).min(1).max(200),
    reportedObservations: z.array(reportedObservationSchema).max(50),
    imageObservations: z.array(imageObservationSchema).max(50),
    calculatedResults: z.array(calculatedResultSchema).max(50),
    uncertainties: z.array(uncertaintySchema).max(50),
    safetyConsiderations: z.array(safetyConsiderationSchema).max(30),
    hypotheses: z.array(hypothesisSchema).max(3),
    missingInformation: z.array(textSchema).max(50),
    nextExperiments: z.array(nextExperimentSchema).max(10),
    hypothesisMatrix: hypothesisMatrixSchema,
  })
  .strict();

export const configurationDifferenceSchema = z
  .object({
    field: shortTextSchema,
    baselineValue: textSchema,
    comparisonValue: textSchema,
    significance: textSchema,
  })
  .strict();

export const hypothesisSupportShiftSchema = z
  .object({
    hypothesisId: idSchema,
    direction: z.enum(["gained", "lost", "unchanged", "uncertain"]),
    explanation: textSchema,
    evidenceIds: z.array(idSchema).min(1).max(20),
  })
  .strict();

export const runComparisonSchema = z
  .object({
    id: idSchema,
    baselineRunId: idSchema,
    comparisonRunId: idSchema,
    summary: textSchema,
    configurationDifferences: z.array(configurationDifferenceSchema).max(30),
    changedVariables: z.array(textSchema).max(30),
    hypothesisSupportShifts: z.array(hypothesisSupportShiftSchema).max(3),
  })
  .strict();

export const plannedMeasurementSchema = z
  .object({
    id: idSchema,
    name: shortTextSchema,
    value: z.number().finite(),
    unit: shortTextSchema,
    elapsedSeconds: z.number().finite().nonnegative(),
    label: z.literal("simulated"),
    disclaimer: textSchema,
  })
  .strict();

export const matrixUpdateScenarioSchema = z
  .object({
    id: idSchema,
    label: z.literal("simulated"),
    title: shortTextSchema,
    measurement: plannedMeasurementSchema,
    observation: matrixObservationSchema,
    cells: z.array(matrixCellSchema).min(1).max(3),
    changeSummary: textSchema,
  })
  .strict();

export const analysisSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    promptVersion: z.string().trim().min(1).max(50),
    generatedAt: z.string().datetime({ offset: true }),
    run: experimentRunSchema,
  })
  .strict();

export const demoDatasetSchema = z
  .object({
    id: idSchema,
    name: shortTextSchema,
    description: textSchema,
    activeRunId: idSchema,
    comparisonRunId: idSchema,
    runs: z.array(experimentRunSchema).min(2).max(3),
    comparison: runComparisonSchema,
    simulatedMatrixUpdate: matrixUpdateScenarioSchema,
  })
  .strict();

export type SourceMode = z.infer<typeof sourceModeSchema>;
export type Confidence = z.infer<typeof confidenceSchema>;
export type EvidenceProvenance = z.infer<typeof evidenceProvenanceSchema>;
export type ApparatusItem = z.infer<typeof apparatusItemSchema>;
export type Material = z.infer<typeof materialSchema>;
export type ExperimentVariable = z.infer<typeof variableSchema>;
export type Measurement = z.infer<typeof measurementSchema>;
export type ReportedObservation = z.infer<typeof reportedObservationSchema>;
export type ImageObservation = z.infer<typeof imageObservationSchema>;
export type CalculatedResult = z.infer<typeof calculatedResultSchema>;
export type Uncertainty = z.infer<typeof uncertaintySchema>;
export type SafetyConsideration = z.infer<typeof safetyConsiderationSchema>;
export type Hypothesis = z.infer<typeof hypothesisSchema>;
export type NextExperiment = z.infer<typeof nextExperimentSchema>;
export type MatrixObservation = z.infer<typeof matrixObservationSchema>;
export type MatrixEffect = z.infer<typeof matrixEffectSchema>;
export type MatrixCell = z.infer<typeof matrixCellSchema>;
export type HypothesisMatrix = z.infer<typeof hypothesisMatrixSchema>;
export type ExperimentRun = z.infer<typeof experimentRunSchema>;
export type RunComparison = z.infer<typeof runComparisonSchema>;
export type MatrixUpdateScenario = z.infer<typeof matrixUpdateScenarioSchema>;
export type Analysis = z.infer<typeof analysisSchema>;
export type DemoDataset = z.infer<typeof demoDatasetSchema>;
