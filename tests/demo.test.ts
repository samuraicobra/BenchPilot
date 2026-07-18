import { describe, expect, it } from "vitest";

import { demoDatasetSchema } from "../lib/domain";
import { demoDataset, loadDemoAnalysis, loadDemoDataset } from "../lib/demo";

describe("zinc-air demo loading", () => {
  it("is validated by the same schema used at runtime", () => {
    expect(demoDatasetSchema.safeParse(demoDataset).success).toBe(true);
    expect(loadDemoDataset().runs).toHaveLength(2);
  });

  it("contains the exact supplied current-run measurements", () => {
    const dataset = loadDemoDataset();
    const active = dataset.runs.find(({ id }) => id === dataset.activeRunId)!;

    expect(
      active.measurements.map(({ value, elapsedSeconds }) => [
        value,
        elapsedSeconds,
      ]),
    ).toEqual([
      [1.562, 0],
      [0.732, 10],
      [0.482, 60],
    ]);
  });

  it("contains the exact supplied earlier-run measurements", () => {
    const dataset = loadDemoDataset();
    const earlier = dataset.runs.find(
      ({ id }) => id === dataset.comparisonRunId,
    )!;

    expect(
      earlier.measurements.map(({ value, elapsedSeconds }) => [
        value,
        elapsedSeconds,
      ]),
    ).toEqual([
      [0.912, 60],
      [1.13, 300],
      [1.253, 600],
      [1.298, 1_380],
      [1.308, 1_800],
    ]);
  });

  it("loads a fresh validated clone so UI mutations cannot corrupt the seed", () => {
    const first = loadDemoDataset();
    first.runs[0].measurements[0].value = 999;

    expect(loadDemoDataset().runs[0].measurements[0].value).toBe(1.562);
    expect(demoDataset.runs[0].measurements[0].value).toBe(1.562);
  });

  it("keeps the simulated matrix scenario outside observed run data", () => {
    const dataset = loadDemoDataset();
    const allMeasurementIds = dataset.runs.flatMap(({ measurements }) =>
      measurements.map(({ id }) => id),
    );

    expect(dataset.simulatedMatrixUpdate.label).toBe("simulated");
    expect(dataset.simulatedMatrixUpdate.measurement.disclaimer).toMatch(
      /not measured/i,
    );
    expect(allMeasurementIds).not.toContain(
      dataset.simulatedMatrixUpdate.measurement.id,
    );
  });

  it("includes a rigorous comparison and ranked information-per-effort tests", () => {
    const dataset = loadDemoDataset();
    const active = dataset.runs.find(({ id }) => id === dataset.activeRunId)!;

    expect(dataset.comparison.baselineRunId).toBe(dataset.comparisonRunId);
    expect(dataset.comparison.hypothesisSupportShifts).toHaveLength(3);
    expect(active.hypotheses).toHaveLength(3);
    expect(active.nextExperiments.map(({ rank }) => rank)).toEqual([1, 2, 3]);
    expect(active.nextExperiments[0].informationGainPerEffort).toBeGreaterThan(
      active.nextExperiments[1].informationGainPerEffort,
    );
  });

  it("returns schema-valid analysis envelopes and rejects unknown run ids", () => {
    expect(loadDemoAnalysis().run.id).toBe(demoDataset.activeRunId);
    expect(() => loadDemoAnalysis("missing-run")).toThrow(/Unknown demo run/);
  });
});
