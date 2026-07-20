import { describe, expect, it } from "vitest";

import { buildVoltageChartData } from "../app/voltage-chart";
import { demoDatasetSchema } from "../lib/domain";
import { demoDataset, loadDemoAnalysis, loadDemoDataset } from "../lib/demo";

describe("zinc-air demo loading", () => {
  it("is validated by the same schema used at runtime", () => {
    expect(demoDatasetSchema.safeParse(demoDataset).success).toBe(true);
    expect(loadDemoDataset().runs).toHaveLength(3);
  });

  it("contains the exact supplied latest-run measurements and provenance", () => {
    const dataset = loadDemoDataset();
    const active = dataset.runs.find(({ id }) => id === dataset.activeRunId)!;

    expect(
      active.measurements.map(({ value, elapsedSeconds }) => [
        value,
        elapsedSeconds,
      ]),
    ).toEqual([
      [1.692, 0],
      [1.1, null],
    ]);
    expect(active.apparatus.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        "Improvised Tic Tac container cell",
        "Analog Devices Scopy voltmeter",
      ]),
    );
  });

  it("compares against the exact supplied collapse-run measurements", () => {
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
      [1.562, 0],
      [0.732, 10],
      [0.482, 60],
    ]);
  });

  it("preserves the exact earlier recovery series as a distinct validated run", () => {
    const recovery = loadDemoDataset().runs.find(
      ({ id }) => id === "zinc-air-recovery",
    )!;
    expect(
      recovery.measurements.map(({ value, elapsedSeconds }) => [
        value,
        elapsedSeconds,
      ]),
    ).toEqual([
      [0.912, 60],
      [1.13, 300],
      [1.253, 600],
      [1.298, 1380],
      [1.308, 1800],
    ]);
  });

  it("derives every chart point from the validated fixture without interpolation", () => {
    const dataset = loadDemoDataset();
    const chart = buildVoltageChartData(dataset.runs);
    const plotted = chart.flatMap((point) =>
      Object.entries(point)
        .filter(([key]) => key !== "elapsedSeconds")
        .map(([runId, value]) => [runId, point.elapsedSeconds, value]),
    );

    const expected = dataset.runs.flatMap((run) =>
      run.measurements
        .filter(
          ({ unit, elapsedSeconds }) => unit === "V" && elapsedSeconds !== null,
        )
        .map(({ elapsedSeconds, value }) => [run.id, elapsedSeconds, value]),
    );
    expect(plotted).toEqual(expect.arrayContaining(expected));
    expect(plotted).toHaveLength(expected.length);
    expect(plotted).not.toContainEqual([dataset.activeRunId, 60, 1.1]);
  });

  it("records the complete uncertainty boundary and construction facts", () => {
    const dataset = loadDemoDataset();
    const latest = dataset.runs.find(({ id }) => id === dataset.activeRunId)!;
    const uncertaintyText = latest.uncertainties
      .map(({ description }) => description)
      .join(" ");

    for (const term of [
      /electrical load.*fan current/i,
      /contact resistance/i,
      /cathode thickness/i,
      /wetting or flooding/i,
      /electrolyte quantity/i,
      /oxygen access/i,
      /clamping pressure/i,
      /zinc surface condition/i,
      /temperature/i,
      /time since cell assembly/i,
    ]) {
      expect(uncertaintyText).toMatch(term);
    }
    expect(latest.materials.map(({ name }) => name)).toContain(
      "Stainless-steel mesh support",
    );
    expect(
      latest.controlledVariables.find(
        ({ id }) => id === "separator-configuration",
      )?.value,
    ).toBe("No conventional separator");
    expect(latest.imageObservations[0].limitations).toMatch(
      /not evidence of proven cell reversal/i,
    );
    expect(latest.missingInformation.join(" ")).toMatch(
      /cannot be calculated without measured current or load resistance/i,
    );
  });
  it("loads a fresh validated clone so UI mutations cannot corrupt the seed", () => {
    const first = loadDemoDataset();
    first.runs[0].measurements[0].value = 999;

    expect(loadDemoDataset().runs[0].measurements[0].value).toBe(1.692);
    expect(demoDataset.runs[0].measurements[0].value).toBe(1.692);
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
    expect(dataset.comparison.changedVariables).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/fan current/i),
        expect.stringMatching(/contact resistance/i),
        expect.stringMatching(/cathode thickness/i),
        expect.stringMatching(/wetting or flooding/i),
        expect.stringMatching(/electrolyte quantity/i),
        expect.stringMatching(/oxygen access/i),
        expect.stringMatching(/clamping pressure/i),
        expect.stringMatching(/zinc surface condition/i),
        expect.stringMatching(/temperature/i),
        expect.stringMatching(/time since cell assembly/i),
      ]),
    );
  });

  it("returns schema-valid analysis envelopes and rejects unknown run ids", () => {
    expect(loadDemoAnalysis().run.id).toBe(demoDataset.activeRunId);
    expect(() => loadDemoAnalysis("missing-run")).toThrow(/Unknown demo run/);
  });
});
