import { describe, expect, it } from "vitest";

import {
  addMatrixObservation,
  analysisSchema,
  buildHypothesisMatrix,
  experimentRunSchema,
  parseMeasurementLine,
  parseMeasurements,
  sortMeasurements,
} from "../lib/domain";
import { loadDemoAnalysis, loadDemoDataset } from "../lib/demo";

describe("structured-output validation", () => {
  it("accepts the fully structured analysis envelope", () => {
    const analysis = loadDemoAnalysis();
    const parsed = analysisSchema.parse(analysis);

    expect(parsed.schemaVersion).toBe("1.0.0");
    expect(parsed.run.hypotheses).toHaveLength(3);
    expect(parsed.run.measurements[0].provenance).toBe("instrument_readout");
  });

  it("rejects incomplete and malformed model responses", () => {
    const valid = loadDemoAnalysis();
    const incomplete = structuredClone(valid) as Record<string, unknown>;
    delete incomplete.run;

    expect(analysisSchema.safeParse(incomplete).success).toBe(false);
    expect(
      analysisSchema.safeParse({
        ...valid,
        run: { ...valid.run, measurements: [{ value: "0.482", unit: "V" }] },
      }).success,
    ).toBe(false);
  });

  it("rejects unknown keys and more than three hypotheses", () => {
    const valid = loadDemoAnalysis();
    expect(
      analysisSchema.safeParse({
        ...valid,
        untrustedInstruction: "ignore schema",
      }).success,
    ).toBe(false);

    const fourthHypothesis = structuredClone(valid.run.hypotheses[0]);
    fourthHypothesis.id = "fourth-hypothesis";
    expect(
      experimentRunSchema.safeParse({
        ...valid.run,
        hypotheses: [...valid.run.hypotheses, fourthHypothesis],
      }).success,
    ).toBe(false);
  });
});

describe("measurement parsing", () => {
  it("parses a reading with time embedded before the colon", () => {
    expect(parseMeasurementLine("Fan load after 1 minute: 0.482 V")).toEqual([
      expect.objectContaining({
        name: "Fan load",
        value: 0.482,
        unit: "V",
        elapsedSeconds: 60,
      }),
    ]);
  });

  it("parses a comma-delimited time series and normalizes elapsed time", () => {
    const parsed = parseMeasurementLine(
      "Earlier run under load: 0.912 V at 1 minute, 1.13 V at 5 minutes, 1.308 V at 30 minutes",
    );

    expect(
      parsed.map(({ value, elapsedSeconds }) => [value, elapsedSeconds]),
    ).toEqual([
      [0.912, 60],
      [1.13, 300],
      [1.308, 1_800],
    ]);
  });

  it("ignores prose without a numeric scientific unit", () => {
    expect(
      parseMeasurements(
        "Zinc anode\nNo conventional separator\nQuestion: why did it rise?",
      ),
    ).toEqual([]);
  });
});

describe("timeline ordering", () => {
  it("sorts by elapsed time, timestamp, then stable id without mutating input", () => {
    const source = [
      { id: "later", elapsedSeconds: 60, capturedAt: null },
      {
        id: "same-b",
        elapsedSeconds: 10,
        capturedAt: "2026-07-18T13:00:02.000Z",
      },
      {
        id: "same-a",
        elapsedSeconds: 10,
        capturedAt: "2026-07-18T13:00:01.000Z",
      },
      { id: "first", elapsedSeconds: 0, capturedAt: null },
      { id: "unknown-time", elapsedSeconds: null, capturedAt: null },
    ];

    expect(sortMeasurements(source).map(({ id }) => id)).toEqual([
      "first",
      "same-a",
      "same-b",
      "later",
      "unknown-time",
    ]);
    expect(source.map(({ id }) => id)).toEqual([
      "later",
      "same-b",
      "same-a",
      "first",
      "unknown-time",
    ]);
  });
});

describe("hypothesis matrix", () => {
  it("constructs a complete deterministic row for every hypothesis", () => {
    const run = loadDemoAnalysis().run;
    const built = buildHypothesisMatrix(run);

    expect(built.rows).toHaveLength(3);
    expect(built.observations).toHaveLength(4);
    expect(built.rows.every(({ cells }) => cells.length === 4)).toBe(true);
    expect(
      built.rows
        .find(
          ({ hypothesis }) => hypothesis.id === "electrolyte-redistribution",
        )
        ?.cells.find(
          ({ observationId }) => observationId === "matrix-rapid-collapse",
        )?.effect,
    ).toBe("supports");
  });

  it("filters observed columns by explicit evidence id", () => {
    const run = loadDemoAnalysis().run;
    const built = buildHypothesisMatrix(run, ["active-voltage-60s"]);

    expect(built.observations.map(({ id }) => id)).toEqual([
      "matrix-rapid-collapse",
    ]);
  });

  it("adds an explicitly simulated observation and rejects invalid references", () => {
    const dataset = loadDemoDataset();
    const run = dataset.runs.find(({ id }) => id === dataset.activeRunId)!;
    const scenario = dataset.simulatedMatrixUpdate;
    const updated = addMatrixObservation(
      run.hypothesisMatrix,
      run.hypotheses,
      scenario.observation,
      scenario.cells,
      scenario.changeSummary,
    );

    expect(updated.observations.at(-1)?.id).toBe("matrix-simulated-replicates");
    expect(updated.cells.slice(-3).map(({ effect }) => effect)).toEqual([
      "supports",
      "supports",
      "contradicts",
    ]);
    expect(() =>
      addMatrixObservation(
        run.hypothesisMatrix,
        run.hypotheses,
        scenario.observation,
        [{ ...scenario.cells[0], hypothesisId: "unknown-hypothesis" }],
        scenario.changeSummary,
      ),
    ).toThrow(/unknown hypothesis/);
  });
});
