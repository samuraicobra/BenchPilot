import {
  experimentRunSchema,
  hypothesisMatrixSchema,
  matrixCellSchema,
  matrixObservationSchema,
  type ExperimentRun,
  type Hypothesis,
  type HypothesisMatrix,
  type MatrixCell,
  type MatrixObservation,
} from "./schemas";

export interface HypothesisMatrixRow {
  hypothesis: Hypothesis;
  cells: MatrixCell[];
}

export interface BuiltHypothesisMatrix {
  observations: MatrixObservation[];
  rows: HypothesisMatrixRow[];
  lastUpdateSummary: string;
}

function validateReferences(
  hypotheses: readonly Hypothesis[],
  matrix: HypothesisMatrix,
): void {
  const hypothesisIds = new Set(hypotheses.map(({ id }) => id));
  const observationIds = new Set(matrix.observations.map(({ id }) => id));
  const pairs = new Set<string>();
  for (const cell of matrix.cells) {
    if (!hypothesisIds.has(cell.hypothesisId)) {
      throw new Error(
        `Matrix cell references unknown hypothesis: ${cell.hypothesisId}`,
      );
    }
    if (!observationIds.has(cell.observationId)) {
      throw new Error(
        `Matrix cell references unknown observation: ${cell.observationId}`,
      );
    }
    const pair = `${cell.hypothesisId}:${cell.observationId}`;
    if (pairs.has(pair)) throw new Error(`Duplicate matrix cell: ${pair}`);
    pairs.add(pair);
  }
}

export function buildHypothesisMatrix(
  input: ExperimentRun,
  includedEvidenceIds?: readonly string[],
): BuiltHypothesisMatrix {
  const run = experimentRunSchema.parse(input);
  validateReferences(run.hypotheses, run.hypothesisMatrix);
  const included = includedEvidenceIds ? new Set(includedEvidenceIds) : null;
  const observations = run.hypothesisMatrix.observations.filter(
    (observation) =>
      !included ||
      observation.status === "planned" ||
      (observation.evidenceId !== null &&
        included.has(observation.evidenceId)) ||
      (observation.measurementId !== null &&
        included.has(observation.measurementId)),
  );
  const selectedIds = new Set(observations.map(({ id }) => id));
  const cellByPair = new Map(
    run.hypothesisMatrix.cells
      .filter(({ observationId }) => selectedIds.has(observationId))
      .map((cell) => [`${cell.hypothesisId}:${cell.observationId}`, cell]),
  );
  const rows = run.hypotheses.map((hypothesis) => ({
    hypothesis,
    cells: observations.map(
      (observation): MatrixCell =>
        cellByPair.get(`${hypothesis.id}:${observation.id}`) ?? {
          hypothesisId: hypothesis.id,
          observationId: observation.id,
          effect: "unknown",
          rationale: "No explicit evidence relationship has been recorded.",
          evidenceIds: [],
        },
    ),
  }));
  return {
    observations,
    rows,
    lastUpdateSummary: run.hypothesisMatrix.lastUpdateSummary,
  };
}

export function addMatrixObservation(
  matrixInput: HypothesisMatrix,
  hypotheses: readonly Hypothesis[],
  observationInput: MatrixObservation,
  cellInputs: readonly MatrixCell[],
  updateSummary: string,
): HypothesisMatrix {
  const matrix = hypothesisMatrixSchema.parse(matrixInput);
  const observation = matrixObservationSchema.parse(observationInput);
  const cells = cellInputs.map((cell) => matrixCellSchema.parse(cell));
  if (matrix.observations.some(({ id }) => id === observation.id)) {
    throw new Error(`Matrix observation already exists: ${observation.id}`);
  }
  const update = hypothesisMatrixSchema.parse({
    observations: [...matrix.observations, observation],
    cells: [...matrix.cells, ...cells],
    lastUpdateSummary: updateSummary,
  });
  validateReferences(hypotheses, update);
  return update;
}
