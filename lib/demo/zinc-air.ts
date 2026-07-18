import {
  analysisSchema,
  demoDatasetSchema,
  type DemoDataset,
  type ExperimentRun,
  type Hypothesis,
  type Material,
  type NextExperiment,
  type SafetyConsideration,
} from "../domain";

const materials: Material[] = [
  {
    id: "zinc-anode",
    name: "Zinc anode",
    role: "Oxidizing electrode",
    composition: "Zinc; grade and surface preparation not recorded",
    quantity: null,
    unit: null,
    provenance: "user_reported",
  },
  {
    id: "air-cathode",
    name: "Air cathode",
    role: "Oxygen-reduction electrode",
    composition: "Carbon and manganese dioxide",
    quantity: null,
    unit: null,
    provenance: "user_reported",
  },
  {
    id: "acrylic-binder",
    name: "Acrylic binder",
    role: "Cathode binder",
    composition: "Exact product and solids fraction not recorded",
    quantity: null,
    unit: null,
    provenance: "user_reported",
  },
  {
    id: "koh-electrolyte",
    name: "Potassium hydroxide electrolyte",
    role: "Alkaline electrolyte",
    composition: "Approximately 30% KOH; basis not recorded",
    quantity: null,
    unit: null,
    provenance: "user_reported",
  },
];

const safetyConsiderations: SafetyConsideration[] = [
  {
    id: "safety-koh",
    hazard: "Caustic potassium hydroxide",
    severity: "high",
    precaution:
      "Wear splash goggles and alkali-resistant gloves, use secondary containment, and keep an appropriate eyewash route available.",
    stopCondition:
      "Stop for any leak, splash, damaged glove, or electrolyte outside containment.",
  },
  {
    id: "safety-short",
    hazard: "Short circuit and localized heating",
    severity: "moderate",
    precaution:
      "Use current-limited loads and insulated clips; do not leave the prototype energized unattended.",
    stopCondition:
      "Disconnect immediately if temperature rises unexpectedly, wiring softens, or current exceeds the load rating.",
  },
  {
    id: "safety-disposal",
    hazard: "Alkaline zinc/manganese waste",
    severity: "moderate",
    precaution:
      "Collect spent electrolyte and electrode material as laboratory chemical waste under local requirements.",
    stopCondition:
      "Do not drain-dispose or continue work without a labeled compatible waste container.",
  },
];

function hypotheses(evidence: {
  collapse: string;
  recovery: string;
  highOpenCircuit: string;
  visualCathode: string;
}): Hypothesis[] {
  return [
    {
      id: "electrolyte-redistribution",
      title: "Electrolyte redistribution / wetting",
      mechanism:
        "Uneven KOH distribution changes ionic contact area over time. Progressive wetting could lower ionic resistance in the recovering run, while local depletion or poor initial wetting could drive the rapid collapse.",
      evidenceSupporting: [evidence.collapse, evidence.recovery],
      evidenceAgainst: [evidence.highOpenCircuit],
      unknowns: [
        "Electrolyte volume and placement were not recorded.",
        "No internal-resistance or mass-change measurements were captured.",
      ],
      confidence: "medium",
      falsifier:
        "If a controlled electrolyte rewet or redistribution step produces no repeatable change in loaded voltage or internal resistance while connections and airflow remain fixed, this mechanism loses support.",
    },
    {
      id: "air-cathode-transport",
      title: "Air-cathode transport state",
      mechanism:
        "The carbon/MnO₂ cathode may alternate between oxygen starvation and electrolyte flooding. Air-path opening, binder distribution, or gradual gas access could therefore make voltage recover in one assembly but decay in another.",
      evidenceSupporting: [evidence.collapse, evidence.visualCathode],
      evidenceAgainst: [evidence.recovery],
      unknowns: [
        "Cathode thickness, porosity, exposed air area, and airflow were not quantified.",
        "No dissolved-oxygen, polarization, or airflow-control data were captured.",
      ],
      confidence: "medium",
      falsifier:
        "If a controlled change in exposed air area or airflow leaves the load transient unchanged across matched replicates, oxygen transport alone is unlikely to explain the divergence.",
    },
    {
      id: "electrical-contact",
      title: "Intermittent electrical contact",
      mechanism:
        "Variable clip pressure, oxide films, or changing mechanical contact could add series resistance. Settling could improve the earlier run; a degrading junction could collapse the current run under load.",
      evidenceSupporting: [evidence.collapse, evidence.highOpenCircuit],
      evidenceAgainst: [evidence.recovery],
      unknowns: [
        "Contact resistance and fixture pressure were not recorded.",
        "It is unknown whether the same leads, connection points, and load were used in both runs.",
      ],
      confidence: "low",
      falsifier:
        "If four-wire or fixed-pressure connections show stable contact resistance while the voltage trajectories still diverge, contact variation is not the dominant cause.",
    },
  ];
}

const nextExperiments: NextExperiment[] = [
  {
    id: "test-controlled-rewet",
    rank: 1,
    title: "Paired controlled-rewet test",
    rationale:
      "A matched dry-control/rewet pair is low effort and should separate ionic wetting from a pure contact explanation while revealing whether added liquid floods the air cathode.",
    changedVariable:
      "After the same 60-second fan-load baseline, add one preselected electrolyte aliquot to the treatment cell; add nothing to the control.",
    controlledVariables: [
      "Same cathode batch, geometric area, zinc area, binder ratio, and no-separator configuration",
      "Same fan load, wiring, clip locations, fixture pressure, temperature, and airflow",
      "Same initial electrolyte concentration and conditioning time",
    ],
    measurementsToCapture: [
      "Loaded voltage every 10 seconds from 0 to 120 seconds, then every minute to 10 minutes",
      "Open-circuit voltage immediately before and two minutes after the load interval",
      "Electrolyte aliquot mass or volume and whole-cell mass before and after",
      "Current and, if practical, a brief current-interrupt estimate of internal resistance",
    ],
    expectations: [
      {
        hypothesisId: "electrolyte-redistribution",
        expectedResult:
          "Rewetting produces a prompt, repeatable voltage recovery and lower estimated internal resistance.",
        resultThatWeakensIt:
          "Treatment and control trajectories remain alike within measurement uncertainty.",
      },
      {
        hypothesisId: "air-cathode-transport",
        expectedResult:
          "If flooding dominates, the added electrolyte depresses voltage unless air access is also improved.",
        resultThatWeakensIt:
          "A small aliquot improves voltage without any airflow dependence across replicates.",
      },
      {
        hypothesisId: "electrical-contact",
        expectedResult:
          "Voltage remains tied to contact resistance and does not respond reproducibly to the aliquot.",
        resultThatWeakensIt:
          "Fixed contacts remain stable while only the rewet cell recovers.",
      },
    ],
    stopConditions: [
      "Stop if the cell leaks, visibly swells, exceeds 45 °C, or voltage reverses polarity.",
      "Disconnect if the fan stalls or current exceeds its rated range.",
    ],
    safetyNote:
      "KOH is caustic. Dose behind a splash shield with goggles, compatible gloves, secondary containment, and a documented neutralization/spill procedure.",
    estimatedEffort: "low",
    informationValue: "high",
    informationGainPerEffort: 9.2,
  },
  {
    id: "test-fixed-contact",
    rank: 2,
    title: "Fixed-pressure contact control",
    rationale:
      "A repeatable fixture and contact-resistance check directly tests the cheapest competing explanation before rebuilding the cathode.",
    changedVariable:
      "Compare hand-held clip contacts with fixed-pressure, cleaned contacts.",
    controlledVariables: [
      "Same assembled cell without electrolyte adjustment",
      "Same fan, airflow, temperature, lead length, and acquisition timing",
      "No repositioning of electrodes between contact conditions",
    ],
    measurementsToCapture: [
      "Loaded voltage and current every 10 seconds for 10 minutes",
      "Voltage drop across each connection under load",
      "Fixture pressure setting and contact-surface preparation",
    ],
    expectations: [
      {
        hypothesisId: "electrolyte-redistribution",
        expectedResult:
          "The transient persists after contact drops become stable.",
        resultThatWeakensIt:
          "Stabilizing contacts removes the transient completely.",
      },
      {
        hypothesisId: "air-cathode-transport",
        expectedResult:
          "The transient persists and remains sensitive to air-side conditions, not contact pressure.",
        resultThatWeakensIt: "Fixed contacts alone remove the divergence.",
      },
      {
        hypothesisId: "electrical-contact",
        expectedResult:
          "Fixed-pressure contacts reduce connection voltage drop and make repeated trajectories converge.",
        resultThatWeakensIt:
          "Measured connection drops are stable and negligible while cell voltage still diverges.",
      },
    ],
    stopConditions: [
      "Stop for fixture slippage, lead heating, electrolyte leakage, or cell temperature above 45 °C.",
    ],
    safetyNote:
      "De-energize before moving clips; fixed pressure must not puncture or crack the wet cell fixture.",
    estimatedEffort: "low",
    informationValue: "medium",
    informationGainPerEffort: 7.6,
  },
  {
    id: "test-air-aperture",
    rank: 3,
    title: "Air-aperture crossover",
    rationale:
      "A reversible aperture change tests oxygen-access sensitivity without changing cathode chemistry, but requires more careful fixturing than the first two tests.",
    changedVariable:
      "Alternate a fixed open air aperture and a 50%-masked aperture in randomized order.",
    controlledVariables: [
      "Same cell, fan load, electrolyte state, contact fixture, temperature, and acquisition schedule",
      "Equal exposure time in each aperture condition",
      "Do not allow the mask to touch or compress the cathode",
    ],
    measurementsToCapture: [
      "Loaded voltage and current every 10 seconds for five minutes per aperture state",
      "Air-side temperature and exposed geometric area",
      "Recovery for two minutes after removing the mask",
    ],
    expectations: [
      {
        hypothesisId: "electrolyte-redistribution",
        expectedResult:
          "Aperture changes have a smaller effect than electrolyte-state history.",
        resultThatWeakensIt:
          "Voltage tracks aperture state promptly and reversibly.",
      },
      {
        hypothesisId: "air-cathode-transport",
        expectedResult:
          "Masking causes a prompt reversible loss and reopening restores voltage.",
        resultThatWeakensIt:
          "Aperture state produces no repeatable difference.",
      },
      {
        hypothesisId: "electrical-contact",
        expectedResult:
          "Voltage changes follow contact disturbances rather than randomized aperture state.",
        resultThatWeakensIt:
          "Stable contacts accompany a repeatable aperture-dependent response.",
      },
    ],
    stopConditions: [
      "Stop for cathode contact by the mask, condensation, leakage, heating above 45 °C, or polarity reversal.",
    ],
    safetyNote:
      "Keep the air-side mask dry and electrically insulating; do not enclose a warming or leaking cell.",
    estimatedEffort: "medium",
    informationValue: "high",
    informationGainPerEffort: 6.8,
  },
];

const commonApparatus = [
  {
    id: "prototype-cell",
    name: "Hand-built zinc-air test cell",
    details:
      "Open-air prototype with no conventional separator in this version.",
    provenance: "user_reported" as const,
  },
  {
    id: "digital-multimeter",
    name: "Digital multimeter",
    details:
      "Model, range, calibration status, and logging method not recorded.",
    provenance: "image_derived" as const,
  },
  {
    id: "fan-load",
    name: "Small fan load",
    details:
      "Rated voltage, current, and whether the same fan was used in both runs are unknown.",
    provenance: "user_reported" as const,
  },
];

const commonVariables = {
  independentVariables: [
    {
      id: "elapsed-load-time",
      name: "Elapsed time under load",
      value: null,
      unit: "s",
      description: "Time elapsed after the load was connected.",
      provenance: "user_reported" as const,
    },
  ],
  dependentVariables: [
    {
      id: "terminal-voltage",
      name: "Terminal voltage",
      value: null,
      unit: "V",
      description:
        "Measured cell terminal voltage under the stated load condition.",
      provenance: "instrument_readout" as const,
    },
  ],
  controlledVariables: [
    {
      id: "nominal-chemistry",
      name: "Nominal chemistry",
      value: "Zn | approximately 30% KOH | carbon/MnO₂ air cathode",
      unit: null,
      description:
        "Reported chemistry intended to remain constant; exact batch equivalence is unverified.",
      provenance: "user_reported" as const,
    },
    {
      id: "separator-configuration",
      name: "Separator configuration",
      value: "No conventional separator",
      unit: null,
      description:
        "This prototype version was reported to omit a conventional separator.",
      provenance: "user_reported" as const,
    },
  ],
};

const activeHypotheses = hypotheses({
  collapse: "active-voltage-60s",
  recovery: "reported-earlier-recovery",
  highOpenCircuit: "active-voltage-ocv",
  visualCathode: "image-irregular-cathode",
});

const activeRun: ExperimentRun = {
  id: "zinc-air-collapse",
  title: "Zinc-air prototype — rapid load collapse",
  objective:
    "Determine why this zinc-air prototype fell from a high open-circuit voltage to 0.482 V after one minute of fan load while an earlier run rose under load.",
  createdAt: "2026-07-18T13:00:00.000Z",
  status: "reviewed",
  sourceMode: "demo",
  apparatus: commonApparatus.map((item) => ({ ...item })),
  materials: materials.map((item) => ({ ...item })),
  independentVariables: commonVariables.independentVariables.map((item) => ({
    ...item,
  })),
  dependentVariables: commonVariables.dependentVariables.map((item) => ({
    ...item,
  })),
  controlledVariables: commonVariables.controlledVariables.map((item) => ({
    ...item,
  })),
  measurements: [
    {
      id: "active-voltage-ocv",
      name: "Open-circuit voltage",
      value: 1.562,
      unit: "V",
      elapsedSeconds: 0,
      capturedAt: null,
      method:
        "Digital multimeter reading transcribed from the experiment notes.",
      condition: "Open circuit immediately before the fan-load sequence.",
      provenance: "user_reported",
      uncertainty: {
        value: null,
        unit: null,
        note: "Meter resolution and calibration were not reported.",
      },
    },
    {
      id: "active-voltage-10s",
      name: "Fan-load voltage",
      value: 0.732,
      unit: "V",
      elapsedSeconds: 10,
      capturedAt: null,
      method:
        "Digital multimeter reading transcribed from the experiment notes.",
      condition: "Fan connected for 10 seconds.",
      provenance: "user_reported",
      uncertainty: {
        value: null,
        unit: null,
        note: "Load current and meter uncertainty were not reported.",
      },
    },
    {
      id: "active-voltage-60s",
      name: "Fan-load voltage",
      value: 0.482,
      unit: "V",
      elapsedSeconds: 60,
      capturedAt: null,
      method:
        "Digital multimeter reading transcribed from the experiment notes.",
      condition: "Fan connected continuously for one minute.",
      provenance: "user_reported",
      uncertainty: {
        value: null,
        unit: null,
        note: "Load current and meter uncertainty were not reported.",
      },
    },
  ],
  reportedObservations: [
    {
      id: "reported-earlier-recovery",
      statement:
        "An earlier run rose from 0.912 V at one minute to 1.308 V at 30 minutes under load.",
      elapsedSeconds: null,
      sourceNote:
        "Directly reported in the user's rough notes; represented as individual measurements in the comparison run.",
      provenance: "user_reported",
    },
    {
      id: "reported-no-separator",
      statement:
        "No conventional separator was used in this prototype version.",
      elapsedSeconds: null,
      sourceNote: "Directly reported configuration fact.",
      provenance: "user_reported",
    },
  ],
  imageObservations: [
    {
      id: "image-irregular-cathode",
      statement:
        "The exposed dark cathode surface appears visually nonuniform in texture and wetting.",
      imageId: "prototype-image-1",
      confidence: "medium",
      limitations:
        "Lighting and perspective prevent quantitative claims about porosity, thickness, composition, or liquid saturation.",
      provenance: "image_derived",
    },
    {
      id: "image-clip-connections",
      statement:
        "Clip-lead connections and an open benchtop assembly are visible.",
      imageId: "prototype-image-1",
      confidence: "medium",
      limitations:
        "The image cannot establish contact pressure, contact resistance, polarity, or electrical continuity.",
      provenance: "image_derived",
    },
  ],
  calculatedResults: [
    {
      id: "calculated-active-drop",
      name: "Open-circuit to 60-second voltage change",
      formula: "V(60 s, load) − V(open circuit)",
      inputMeasurementIds: ["active-voltage-ocv", "active-voltage-60s"],
      value: -1.08,
      unit: "V",
      interpretation:
        "The loaded reading is 1.080 V below the initial open-circuit reading; this arithmetic does not identify the causal mechanism.",
      provenance: "calculated",
    },
  ],
  uncertainties: [
    {
      id: "uncertainty-current",
      description: "Load current was not measured.",
      impact:
        "Voltage alone cannot separate activation, ohmic, and mass-transport losses.",
      mitigation: "Record synchronized current and voltage in the next run.",
    },
    {
      id: "uncertainty-replicates",
      description:
        "Each trajectory appears to be a single run with no matched replicate.",
      impact:
        "The divergence may reflect assembly-to-assembly variation rather than a controlled variable.",
      mitigation:
        "Run randomized matched replicates from the same electrode and electrolyte batches.",
    },
    {
      id: "uncertainty-environment",
      description:
        "Temperature, humidity, exposed air area, electrolyte dose, and fixture pressure were not recorded.",
      impact: "Several plausible mechanisms remain confounded.",
      mitigation:
        "Log these values and photograph the same fixture geometry before every run.",
    },
  ],
  safetyConsiderations: safetyConsiderations.map((item) => ({ ...item })),
  hypotheses: activeHypotheses,
  missingInformation: [
    "Fan load current, rated power, and whether the same fan was used across runs",
    "Electrolyte volume, placement, age, temperature, and whether 30% is mass or volume basis",
    "Zinc area, grade, surface preparation, and prior use",
    "Cathode area, thickness, mass loading, binder fraction, porosity, and exposed air area",
    "Contact materials, locations, pressure, and resistance",
    "Ambient temperature, humidity, and airflow",
    "Replicate count and assembly-to-assembly variation",
  ],
  nextExperiments: nextExperiments.map((item) => ({
    ...item,
    expectations: item.expectations.map((entry) => ({ ...entry })),
  })),
  hypothesisMatrix: {
    observations: [
      {
        id: "matrix-high-ocv",
        label: "1.562 V open circuit",
        description:
          "The current assembly produced a high initial voltage before load was applied.",
        status: "observed",
        evidenceId: "active-voltage-ocv",
        measurementId: "active-voltage-ocv",
      },
      {
        id: "matrix-rapid-collapse",
        label: "0.482 V after 60 s",
        description:
          "Under fan load, current-run voltage fell to 0.482 V by one minute.",
        status: "observed",
        evidenceId: "active-voltage-60s",
        measurementId: "active-voltage-60s",
      },
      {
        id: "matrix-earlier-rise",
        label: "Earlier run rose for 30 min",
        description:
          "The earlier run rose from 0.912 V at one minute to 1.308 V at 30 minutes under load.",
        status: "observed",
        evidenceId: "reported-earlier-recovery",
        measurementId: null,
      },
      {
        id: "matrix-no-separator",
        label: "No conventional separator",
        description:
          "The reported configuration lacks a conventional separator, increasing sensitivity to liquid distribution and electrode contact.",
        status: "observed",
        evidenceId: "reported-no-separator",
        measurementId: null,
      },
    ],
    cells: [
      {
        hypothesisId: "electrolyte-redistribution",
        observationId: "matrix-high-ocv",
        effect: "does_not_distinguish",
        rationale:
          "Initial OCV can be high despite nonuniform wetting that appears only under load.",
        evidenceIds: ["active-voltage-ocv"],
      },
      {
        hypothesisId: "electrolyte-redistribution",
        observationId: "matrix-rapid-collapse",
        effect: "supports",
        rationale:
          "Rapid polarization is consistent with limited ionic contact or local depletion, but is not unique to it.",
        evidenceIds: ["active-voltage-60s"],
      },
      {
        hypothesisId: "electrolyte-redistribution",
        observationId: "matrix-earlier-rise",
        effect: "supports",
        rationale:
          "A slow rise is consistent with electrolyte spreading into previously under-wet active area.",
        evidenceIds: ["reported-earlier-recovery"],
      },
      {
        hypothesisId: "electrolyte-redistribution",
        observationId: "matrix-no-separator",
        effect: "supports",
        rationale:
          "Without a separator, electrolyte geometry and electrode spacing may be less repeatable.",
        evidenceIds: ["reported-no-separator"],
      },
      {
        hypothesisId: "air-cathode-transport",
        observationId: "matrix-high-ocv",
        effect: "does_not_distinguish",
        rationale:
          "Open-circuit voltage places little oxygen demand on the cathode.",
        evidenceIds: ["active-voltage-ocv"],
      },
      {
        hypothesisId: "air-cathode-transport",
        observationId: "matrix-rapid-collapse",
        effect: "supports",
        rationale:
          "A demand-dependent collapse is compatible with oxygen starvation or flooding.",
        evidenceIds: ["active-voltage-60s", "image-irregular-cathode"],
      },
      {
        hypothesisId: "air-cathode-transport",
        observationId: "matrix-earlier-rise",
        effect: "supports",
        rationale:
          "Gradual establishment of gas pathways could improve oxygen transport over time.",
        evidenceIds: ["reported-earlier-recovery"],
      },
      {
        hypothesisId: "air-cathode-transport",
        observationId: "matrix-no-separator",
        effect: "does_not_distinguish",
        rationale:
          "Separator absence may affect flooding, but it does not directly identify oxygen transport as dominant.",
        evidenceIds: ["reported-no-separator"],
      },
      {
        hypothesisId: "electrical-contact",
        observationId: "matrix-high-ocv",
        effect: "supports",
        rationale:
          "A resistive connection can preserve OCV yet fail when current is drawn.",
        evidenceIds: ["active-voltage-ocv"],
      },
      {
        hypothesisId: "electrical-contact",
        observationId: "matrix-rapid-collapse",
        effect: "supports",
        rationale:
          "Increasing series resistance could produce the loaded-voltage collapse.",
        evidenceIds: ["active-voltage-60s", "image-clip-connections"],
      },
      {
        hypothesisId: "electrical-contact",
        observationId: "matrix-earlier-rise",
        effect: "contradicts",
        rationale:
          "The smooth long recovery is less typical of an intermittent contact, though mechanical settling remains possible.",
        evidenceIds: ["reported-earlier-recovery"],
      },
      {
        hypothesisId: "electrical-contact",
        observationId: "matrix-no-separator",
        effect: "does_not_distinguish",
        rationale:
          "This fact does not reveal whether the external electrical junctions were stable.",
        evidenceIds: ["reported-no-separator"],
      },
    ],
    lastUpdateSummary:
      "Current evidence leaves electrolyte distribution and air-cathode transport competitive; contact variation remains plausible but has less support from the smooth earlier recovery.",
  },
};

const earlierHypotheses = hypotheses({
  collapse: "earlier-voltage-60s",
  recovery: "earlier-voltage-1800s",
  highOpenCircuit: "earlier-voltage-60s",
  visualCathode: "earlier-image-cathode",
});

export const historicalRecoveryRun: ExperimentRun = {
  id: "zinc-air-recovery",
  title: "Zinc-air prototype — delayed voltage recovery",
  objective:
    "Characterize the earlier under-load trajectory that rose from one to 30 minutes.",
  createdAt: "2026-07-17T13:00:00.000Z",
  status: "reviewed",
  sourceMode: "demo",
  apparatus: commonApparatus.map((item) => ({ ...item })),
  materials: materials.map((item) => ({ ...item })),
  independentVariables: commonVariables.independentVariables.map((item) => ({
    ...item,
  })),
  dependentVariables: commonVariables.dependentVariables.map((item) => ({
    ...item,
  })),
  controlledVariables: commonVariables.controlledVariables.map((item) => ({
    ...item,
  })),
  measurements: [
    {
      id: "earlier-voltage-60s",
      name: "Loaded voltage",
      value: 0.912,
      unit: "V",
      elapsedSeconds: 60,
      capturedAt: null,
      method:
        "Digital multimeter reading transcribed from the experiment notes.",
      condition: "Earlier run under load for one minute.",
      provenance: "user_reported",
      uncertainty: {
        value: null,
        unit: null,
        note: "Load identity, current, and meter uncertainty were not reported.",
      },
    },
    {
      id: "earlier-voltage-300s",
      name: "Loaded voltage",
      value: 1.13,
      unit: "V",
      elapsedSeconds: 300,
      capturedAt: null,
      method:
        "Digital multimeter reading transcribed from the experiment notes.",
      condition: "Earlier run under load for five minutes.",
      provenance: "user_reported",
      uncertainty: {
        value: null,
        unit: null,
        note: "Load identity, current, and meter uncertainty were not reported.",
      },
    },
    {
      id: "earlier-voltage-600s",
      name: "Loaded voltage",
      value: 1.253,
      unit: "V",
      elapsedSeconds: 600,
      capturedAt: null,
      method:
        "Digital multimeter reading transcribed from the experiment notes.",
      condition: "Earlier run under load for 10 minutes.",
      provenance: "user_reported",
      uncertainty: {
        value: null,
        unit: null,
        note: "Load identity, current, and meter uncertainty were not reported.",
      },
    },
    {
      id: "earlier-voltage-1380s",
      name: "Loaded voltage",
      value: 1.298,
      unit: "V",
      elapsedSeconds: 1380,
      capturedAt: null,
      method:
        "Digital multimeter reading transcribed from the experiment notes.",
      condition: "Earlier run under load for 23 minutes.",
      provenance: "user_reported",
      uncertainty: {
        value: null,
        unit: null,
        note: "Load identity, current, and meter uncertainty were not reported.",
      },
    },
    {
      id: "earlier-voltage-1800s",
      name: "Loaded voltage",
      value: 1.308,
      unit: "V",
      elapsedSeconds: 1800,
      capturedAt: null,
      method:
        "Digital multimeter reading transcribed from the experiment notes.",
      condition: "Earlier run under load for 30 minutes.",
      provenance: "user_reported",
      uncertainty: {
        value: null,
        unit: null,
        note: "Load identity, current, and meter uncertainty were not reported.",
      },
    },
  ],
  reportedObservations: [
    {
      id: "reported-smooth-recovery",
      statement:
        "The recorded loaded voltage increased at every sampled time from one through 30 minutes.",
      elapsedSeconds: null,
      sourceNote:
        "Deterministic summary of the user-reported measurement series.",
      provenance: "user_reported",
    },
    {
      id: "reported-earlier-no-separator",
      statement:
        "The prototype configuration was reported as having no conventional separator.",
      elapsedSeconds: null,
      sourceNote:
        "Configuration report; exact equivalence between assemblies is not confirmed.",
      provenance: "user_reported",
    },
  ],
  imageObservations: [
    {
      id: "earlier-image-cathode",
      statement:
        "The air-cathode surface is exposed to ambient air in the recorded prototype view.",
      imageId: "prototype-image-1",
      confidence: "medium",
      limitations:
        "The image cannot establish that the photographed geometry exactly matches this earlier run.",
      provenance: "image_derived",
    },
  ],
  calculatedResults: [
    {
      id: "calculated-earlier-rise",
      name: "One-to-30-minute voltage change",
      formula: "V(1800 s) − V(60 s)",
      inputMeasurementIds: ["earlier-voltage-60s", "earlier-voltage-1800s"],
      value: 0.396,
      unit: "V",
      interpretation:
        "Loaded voltage increased by 0.396 V between the first and last reported samples; this does not establish why.",
      provenance: "calculated",
    },
  ],
  uncertainties: [
    {
      id: "earlier-uncertainty-ocv",
      description: "No open-circuit voltage was provided for the earlier run.",
      impact:
        "Its initial activation state cannot be compared directly with the 1.562 V current-run OCV.",
      mitigation:
        "Capture OCV immediately before every standardized load sequence.",
    },
    {
      id: "earlier-uncertainty-load",
      description:
        "The earlier load current and whether it was the same fan were not reported.",
      impact:
        "The two voltage trajectories may not have experienced comparable demand.",
      mitigation:
        "Use the same characterized electronic load or log fan current in both runs.",
    },
    {
      id: "earlier-uncertainty-assembly",
      description:
        "Assembly, electrolyte, contact, and environment details were not logged.",
      impact:
        "Run-to-run differences cannot be assigned to one controlled variable.",
      mitigation: "Use a build sheet and matched replicates.",
    },
  ],
  safetyConsiderations: safetyConsiderations.map((item) => ({ ...item })),
  hypotheses: earlierHypotheses,
  missingInformation: [
    "Open-circuit voltage before the earlier loaded sequence",
    "Load identity and synchronized current",
    "Exact electrolyte dose, electrode geometry, assembly pressure, and airflow",
    "Whether the photographed prototype is this exact earlier assembly",
  ],
  nextExperiments: nextExperiments.map((item) => ({
    ...item,
    expectations: item.expectations.map((entry) => ({ ...entry })),
  })),
  hypothesisMatrix: {
    observations: [
      {
        id: "earlier-matrix-60s",
        label: "0.912 V at 1 min",
        description:
          "The first supplied loaded reading was 0.912 V at one minute.",
        status: "observed",
        evidenceId: "earlier-voltage-60s",
        measurementId: "earlier-voltage-60s",
      },
      {
        id: "earlier-matrix-monotonic-rise",
        label: "Monotonic sampled rise",
        description:
          "Every supplied sample rose through 1.308 V at 30 minutes.",
        status: "observed",
        evidenceId: "reported-smooth-recovery",
        measurementId: "earlier-voltage-1800s",
      },
    ],
    cells: [
      {
        hypothesisId: "electrolyte-redistribution",
        observationId: "earlier-matrix-60s",
        effect: "does_not_distinguish",
        rationale:
          "The one-minute voltage does not identify the loss mechanism by itself.",
        evidenceIds: ["earlier-voltage-60s"],
      },
      {
        hypothesisId: "electrolyte-redistribution",
        observationId: "earlier-matrix-monotonic-rise",
        effect: "supports",
        rationale:
          "Progressive wetting could produce a gradual reduction in ionic resistance.",
        evidenceIds: ["reported-smooth-recovery", "earlier-voltage-1800s"],
      },
      {
        hypothesisId: "air-cathode-transport",
        observationId: "earlier-matrix-60s",
        effect: "does_not_distinguish",
        rationale:
          "The one-minute point alone does not test oxygen limitation.",
        evidenceIds: ["earlier-voltage-60s"],
      },
      {
        hypothesisId: "air-cathode-transport",
        observationId: "earlier-matrix-monotonic-rise",
        effect: "supports",
        rationale: "A gradually opening air pathway could generate this shape.",
        evidenceIds: ["reported-smooth-recovery", "earlier-voltage-1800s"],
      },
      {
        hypothesisId: "electrical-contact",
        observationId: "earlier-matrix-60s",
        effect: "does_not_distinguish",
        rationale: "Contact resistance was not measured.",
        evidenceIds: ["earlier-voltage-60s"],
      },
      {
        hypothesisId: "electrical-contact",
        observationId: "earlier-matrix-monotonic-rise",
        effect: "contradicts",
        rationale:
          "A smooth 29-minute recovery is less characteristic of intermittent contact, though settling is possible.",
        evidenceIds: ["reported-smooth-recovery", "earlier-voltage-1800s"],
      },
    ],
    lastUpdateSummary:
      "The earlier trajectory is compatible with progressive wetting or gas-path establishment; no measurement directly isolates either mechanism.",
  },
};

const latestHypotheses: Hypothesis[] = hypotheses({
  collapse: "reported-prior-collapse",
  recovery: "latest-voltage-loaded",
  highOpenCircuit: "latest-voltage-ocv",
  visualCathode: "reported-tic-tac-format",
}).map((hypothesis) => ({
  ...hypothesis,
  confidence: "low",
  unknowns: [
    ...hypothesis.unknowns,
    "The construction change and repeatability of the latest result have not been isolated.",
  ],
}));

const latestNextExperiments: NextExperiment[] = [
  {
    ...nextExperiments[0],
    id: "test-latest-replicates",
    rank: 1,
    title: "Matched latest-build replication",
    rationale:
      "Before attributing cause, establish whether the approximately 1.10 V loaded result survives matched rebuilds under a characterized load.",
    changedVariable:
      "Assembly identity only: build at least three nominally identical Tic Tac-format cells from the latest construction recipe.",
    controlledVariables: [
      "Same measured load current, acquisition schedule, and Scopy voltmeter setup",
      "Same KOH concentration, electrolyte dose, hydration/conditioning time, and temperature",
      "Same cathode batch, thickness, mass loading, binder ratio, exposed air area, and zinc geometry",
      "Same fixed-pressure contacts, lead locations, container geometry, and ambient airflow",
    ],
    measurementsToCapture: [
      "Open-circuit voltage immediately before loading",
      "Synchronized loaded voltage and current every 10 seconds for two minutes, then every minute to 10 minutes",
      "Electrolyte dose and whole-cell mass, cathode thickness/mass, exposed air area, contact voltage drops, temperature, and humidity",
    ],
    expectations: [
      {
        hypothesisId: "electrolyte-redistribution",
        expectedResult:
          "Matched hydration produces tightly grouped voltage trajectories across the latest builds.",
        resultThatWeakensIt:
          "Large run-to-run scatter remains despite measured, matched hydration and electrolyte dose.",
      },
      {
        hypothesisId: "air-cathode-transport",
        expectedResult:
          "Matched cathode thickness and exposed air area produce repeatable loaded performance.",
        resultThatWeakensIt:
          "Performance remains variable while air-side geometry and airflow are demonstrably matched.",
      },
      {
        hypothesisId: "electrical-contact",
        expectedResult:
          "Connection voltage drops predict any remaining cell-to-cell performance differences.",
        resultThatWeakensIt:
          "Fixed-pressure contacts remain stable while cell voltage still varies materially.",
      },
    ],
    informationGainPerEffort: 9.7,
  },
  {
    ...nextExperiments[1],
    id: "test-construction-rollback",
    rank: 2,
    title: "One-factor construction rollback",
    rationale:
      "A build-sheet comparison followed by one controlled rollback can identify which candidate change carries the performance gain.",
    changedVariable:
      "After documenting old versus latest builds, revert exactly one candidate change—hydration, cathode thickness, air window, container geometry, or contact fixture—per paired test.",
    controlledVariables: [
      "Same characterized load and elapsed-time schedule",
      "All untested construction dimensions and material batches",
      "Same Scopy channels, wiring, temperature, humidity, and assembly conditioning time",
    ],
    measurementsToCapture: [
      "Loaded voltage and current every 10 seconds for 10 minutes",
      "The exact reverted dimension, dose, mass, or fixture setting",
      "Contact voltage drops, cathode air-side area, cell mass, and temperature",
    ],
    expectations: [
      {
        hypothesisId: "electrolyte-redistribution",
        expectedResult:
          "Reverting hydration or electrolyte geometry recreates the low-voltage trajectory.",
        resultThatWeakensIt:
          "Hydration rollback has no repeatable effect in matched pairs.",
      },
      {
        hypothesisId: "air-cathode-transport",
        expectedResult:
          "Reverting cathode thickness or exposed air area recreates the loss under load.",
        resultThatWeakensIt:
          "Air-side rollback produces no repeatable trajectory change.",
      },
      {
        hypothesisId: "electrical-contact",
        expectedResult:
          "Reverting the connection fixture increases measured contact drop and lowers terminal voltage.",
        resultThatWeakensIt:
          "Contact drops remain negligible while the voltage benefit disappears.",
      },
    ],
    estimatedEffort: "medium",
    informationValue: "high",
    informationGainPerEffort: 8.7,
  },
  {
    ...nextExperiments[2],
    rank: 3,
  },
];

const latestRun: ExperimentRun = {
  ...activeRun,
  id: "zinc-air-latest-sustained",
  title: "Zinc-air prototype — latest sustained output",
  objective:
    "Determine which construction change raised loaded voltage from approximately 0.46–0.48 V in earlier versions to approximately 1.10 V, and whether the improvement is reproducible.",
  createdAt: "2026-07-18T15:45:00.000Z",
  apparatus: [
    {
      id: "tic-tac-cell",
      name: "Improvised Tic Tac container cell",
      details:
        "Latest reported zinc-air construction; dimensions, electrode spacing, and air-window geometry were not recorded.",
      provenance: "user_reported",
    },
    {
      id: "scopy-voltmeter",
      name: "Analog Devices Scopy voltmeter",
      details:
        "Used for the latest 1.692 V open-circuit and approximately 1.100 V loaded readings; range and uncertainty were not supplied.",
      provenance: "instrument_readout",
    },
    {
      id: "latest-load",
      name: "Same or similar electrical load",
      details:
        "The user described the load as the same or similar to earlier trials; identity and current were not recorded.",
      provenance: "user_reported",
    },
  ],
  materials: materials.map((item) =>
    item.id === "air-cathode"
      ? { ...item, composition: "Activated carbon and manganese dioxide" }
      : { ...item },
  ),
  independentVariables: [
    {
      id: "construction-revision",
      name: "Construction revision",
      value: "Latest Tic Tac-format build",
      unit: null,
      description:
        "One or more construction details changed, but the changed variables were not logged individually.",
      provenance: "user_reported",
    },
  ],
  controlledVariables: commonVariables.controlledVariables
    .filter((item) => item.id === "nominal-chemistry")
    .map((item) => ({ ...item })),
  measurements: [
    {
      id: "latest-voltage-ocv",
      name: "Fresh open-circuit voltage",
      value: 1.692,
      unit: "V",
      elapsedSeconds: 0,
      capturedAt: null,
      method: "Analog Devices Scopy voltmeter reading reported by the user.",
      condition: "Fresh cell at open circuit before the latest loaded reading.",
      provenance: "instrument_readout",
      uncertainty: {
        value: null,
        unit: null,
        note: "Scopy range, probe configuration, and uncertainty were not supplied.",
      },
    },
    {
      id: "latest-voltage-loaded",
      name: "Latest loaded voltage",
      value: 1.1,
      unit: "V",
      elapsedSeconds: null,
      capturedAt: null,
      method:
        "Approximate Analog Devices Scopy voltmeter reading reported by the user.",
      condition:
        "Under the same or a similar load; elapsed time and load current were not recorded.",
      provenance: "instrument_readout",
      uncertainty: {
        value: null,
        unit: null,
        note: "Reported as approximately 1.100 V; timing, load current, and instrument uncertainty are unknown.",
      },
    },
  ],
  reportedObservations: [
    {
      id: "reported-prior-collapse",
      statement:
        "Earlier versions fell to approximately 0.46–0.48 V under load.",
      elapsedSeconds: null,
      sourceNote:
        "User-reported historical range; the validated comparison run contains a 0.482 V reading at 60 seconds.",
      provenance: "user_reported",
    },
    {
      id: "reported-latest-sustained",
      statement:
        "The latest version sustains approximately 1.10 V under the same or a similar load.",
      elapsedSeconds: null,
      sourceNote:
        "User-reported improvement; load equivalence and elapsed time remain unconfirmed.",
      provenance: "user_reported",
    },
    {
      id: "reported-tic-tac-format",
      statement: "The latest cell uses an improvised Tic Tac container.",
      elapsedSeconds: null,
      sourceNote:
        "User-reported format; its causal relationship to performance is unknown.",
      provenance: "user_reported",
    },
  ],
  imageObservations: [],
  calculatedResults: [
    {
      id: "calculated-latest-drop",
      name: "Open-circuit to reported loaded-voltage difference",
      formula: "V(load) − V(open circuit)",
      inputMeasurementIds: ["latest-voltage-ocv", "latest-voltage-loaded"],
      value: -0.592,
      unit: "V",
      interpretation:
        "The approximate loaded reading is 0.592 V below the fresh OCV; this arithmetic does not identify which construction change caused the improvement.",
      provenance: "calculated",
    },
  ],
  uncertainties: [
    {
      id: "latest-uncertainty-load",
      description: "Load identity and current were not recorded.",
      impact:
        "The latest and older voltage values may reflect different demand.",
      mitigation: "Use one characterized load and log synchronized current.",
    },
    {
      id: "latest-uncertainty-time",
      description:
        "Elapsed time for the approximately 1.10 V reading is unknown.",
      impact:
        "The point cannot be placed honestly on a voltage-versus-time chart.",
      mitigation:
        "Use a fixed acquisition schedule beginning at load connection.",
    },
    {
      id: "latest-uncertainty-hydration",
      description:
        "Electrolyte dose, placement, and cell hydration were not logged.",
      impact: "Ionic wetting may differ between builds.",
      mitigation: "Weigh electrolyte and the assembled cell before each test.",
    },
    {
      id: "latest-uncertainty-cathode",
      description:
        "Cathode thickness, mass loading, and binder ratio were not logged.",
      impact: "Reaction area and oxygen transport may have changed together.",
      mitigation: "Measure thickness, dry mass, area, and recipe by batch.",
    },
    {
      id: "latest-uncertainty-air",
      description:
        "Exposed cathode area and ambient airflow were not controlled.",
      impact: "Oxygen availability may explain some or all of the gain.",
      mitigation: "Use a measured air aperture and fixed orientation/airflow.",
    },
    {
      id: "latest-uncertainty-contact",
      description: "Contact resistance and fixture pressure were not measured.",
      impact: "A connection improvement could raise loaded terminal voltage.",
      mitigation: "Use fixed-pressure contacts and measure connection drops.",
    },
    {
      id: "latest-uncertainty-replicates",
      description: "The latest result is a single reported run.",
      impact: "Reproducibility is unknown and causal attribution is premature.",
      mitigation: "Build and test at least three matched latest-format cells.",
    },
  ],
  hypotheses: latestHypotheses,
  missingInformation: [
    "Exact load identity, current, and power",
    "Elapsed time of the approximately 1.10 V reading",
    "Electrolyte dose, placement, hydration, and conditioning time",
    "Cathode thickness, mass loading, binder ratio, porosity, and exposed air area",
    "Contact materials, pressure, and resistance",
    "Complete old-versus-latest construction change log",
    "Matched replicate count",
  ],
  nextExperiments: latestNextExperiments,
  hypothesisMatrix: {
    observations: [
      {
        id: "matrix-latest-ocv",
        label: "Latest OCV: 1.692 V",
        description:
          "The fresh latest-format cell measured 1.692 V at open circuit.",
        status: "observed",
        evidenceId: "latest-voltage-ocv",
        measurementId: "latest-voltage-ocv",
      },
      {
        id: "matrix-latest-loaded",
        label: "Latest load: ~1.10 V",
        description:
          "The latest cell reportedly sustains approximately 1.10 V, but current and elapsed time were not recorded.",
        status: "observed",
        evidenceId: "latest-voltage-loaded",
        measurementId: "latest-voltage-loaded",
      },
      {
        id: "matrix-rapid-collapse",
        label: "Older run: 0.482 V at 60 s",
        description:
          "A validated older run fell to 0.482 V after one minute under fan load.",
        status: "observed",
        evidenceId: "active-voltage-60s",
        measurementId: null,
      },
      {
        id: "matrix-controls-missing",
        label: "Six causal controls missing",
        description:
          "Load current, hydration, cathode thickness, air exposure, contact resistance, and elapsed time were not matched or recorded.",
        status: "observed",
        evidenceId: null,
        measurementId: null,
      },
    ],
    cells: [
      ...["matrix-latest-ocv", "matrix-controls-missing"].map(
        (observationId) => ({
          hypothesisId: "electrolyte-redistribution",
          observationId,
          effect:
            observationId === "matrix-controls-missing"
              ? ("unknown" as const)
              : ("does_not_distinguish" as const),
          rationale:
            observationId === "matrix-controls-missing"
              ? "Uncontrolled hydration prevents attribution to electrolyte distribution."
              : "High OCV does not test ionic transport under load.",
          evidenceIds:
            observationId === "matrix-latest-ocv" ? ["latest-voltage-ocv"] : [],
        }),
      ),
      ...["matrix-latest-loaded", "matrix-rapid-collapse"].map(
        (observationId) => ({
          hypothesisId: "electrolyte-redistribution",
          observationId,
          effect: "supports" as const,
          rationale:
            "The cross-build change is compatible with improved wetting, but it is not unique to that mechanism.",
          evidenceIds:
            observationId === "matrix-latest-loaded"
              ? ["latest-voltage-loaded"]
              : ["reported-prior-collapse"],
        }),
      ),
      ...["matrix-latest-ocv", "matrix-controls-missing"].map(
        (observationId) => ({
          hypothesisId: "air-cathode-transport",
          observationId,
          effect:
            observationId === "matrix-controls-missing"
              ? ("unknown" as const)
              : ("does_not_distinguish" as const),
          rationale:
            observationId === "matrix-controls-missing"
              ? "Uncontrolled cathode thickness and air exposure prevent attribution to oxygen transport."
              : "Open circuit places little oxygen demand on the cathode.",
          evidenceIds:
            observationId === "matrix-latest-ocv" ? ["latest-voltage-ocv"] : [],
        }),
      ),
      ...["matrix-latest-loaded", "matrix-rapid-collapse"].map(
        (observationId) => ({
          hypothesisId: "air-cathode-transport",
          observationId,
          effect: "supports" as const,
          rationale:
            "The construction-sensitive loaded performance is compatible with changed oxygen access, but not diagnostic.",
          evidenceIds:
            observationId === "matrix-latest-loaded"
              ? ["latest-voltage-loaded"]
              : ["reported-prior-collapse"],
        }),
      ),
      ...["matrix-latest-ocv"].map((observationId) => ({
        hypothesisId: "electrical-contact",
        observationId,
        effect: "does_not_distinguish" as const,
        rationale:
          "Open-circuit voltage does not quantify resistance under current.",
        evidenceIds: ["latest-voltage-ocv"],
      })),
      ...["matrix-latest-loaded", "matrix-rapid-collapse"].map(
        (observationId) => ({
          hypothesisId: "electrical-contact",
          observationId,
          effect: "supports" as const,
          rationale:
            "A construction change that improved the current path could explain the higher loaded terminal voltage.",
          evidenceIds:
            observationId === "matrix-latest-loaded"
              ? ["latest-voltage-loaded"]
              : ["reported-prior-collapse"],
        }),
      ),
      {
        hypothesisId: "electrical-contact",
        observationId: "matrix-controls-missing",
        effect: "unknown",
        rationale: "Contact resistance was not measured in either build.",
        evidenceIds: [],
      },
    ],
    lastUpdateSummary:
      "The latest result is encouraging but does not distinguish improved wetting, air-cathode transport, or electrical contact. Matched replicates and a one-factor rollback are required.",
  },
};

export const demoDataset: DemoDataset = demoDatasetSchema.parse({
  id: "zinc-air-demo",
  name: "Zinc-air voltage divergence",
  description:
    "A real latest zinc-air result compared with a validated earlier collapse, structured to preserve uncertainty and prevent premature causal attribution.",
  activeRunId: latestRun.id,
  comparisonRunId: activeRun.id,
  runs: [latestRun, activeRun],
  comparison: {
    id: "comparison-latest-versus-collapse",
    baselineRunId: activeRun.id,
    comparisonRunId: latestRun.id,
    summary:
      "The latest cell measured 1.692 V open circuit and approximately 1.10 V under load, compared with an older run that reached 0.482 V after 60 seconds. Because load current, elapsed time, hydration, cathode thickness, air exposure, and contact resistance were not matched, the improvement is real evidence but not causal proof.",
    configurationDifferences: [
      {
        field: "Initial condition",
        baselineValue: "1.562 V open circuit",
        comparisonValue: "1.692 V fresh open circuit",
        significance:
          "The latest cell began 0.130 V higher, but OCV alone does not predict loaded performance.",
      },
      {
        field: "Loaded result and timing",
        baselineValue: "0.482 V after 60 seconds with a fan load",
        comparisonValue: "Approximately 1.10 V; elapsed time not recorded",
        significance:
          "The latest loaded reading cannot be placed on the time chart or compared at a matched instant.",
      },
      {
        field: "Measurement and load",
        baselineValue: "Digital multimeter; fan current not recorded",
        comparisonValue:
          "Analog Devices Scopy; same or similar load, current not recorded",
        significance:
          "Instrument and demand equivalence must be established before quantitative attribution.",
      },
      {
        field: "Construction",
        baselineValue:
          "Open hand-built prototype; no conventional separator reported",
        comparisonValue:
          "Improvised Tic Tac container; other changes not logged",
        significance:
          "Container geometry, hydration, cathode thickness, air exposure, and contact pressure may all have changed together.",
      },
    ],
    changedVariables: [
      "Load current and load identity",
      "Cell hydration and electrolyte dose",
      "Cathode thickness, mass loading, and binder ratio",
      "Exposed air area and airflow",
      "Contact resistance and fixture pressure",
      "Elapsed time under load",
    ],
    hypothesisSupportShifts: [
      {
        hypothesisId: "electrolyte-redistribution",
        direction: "gained",
        explanation:
          "The build-to-build improvement is compatible with better electrolyte distribution, but hydration and dose were not recorded.",
        evidenceIds: ["latest-voltage-loaded", "active-voltage-60s"],
      },
      {
        hypothesisId: "air-cathode-transport",
        direction: "gained",
        explanation:
          "The Tic Tac-format construction may have changed cathode thickness or oxygen access, but neither was measured.",
        evidenceIds: [
          "latest-voltage-loaded",
          "active-voltage-60s",
          "reported-tic-tac-format",
        ],
      },
      {
        hypothesisId: "electrical-contact",
        direction: "uncertain",
        explanation:
          "A better current path could raise loaded voltage, but no connection drop or fixture pressure was measured.",
        evidenceIds: ["latest-voltage-loaded", "active-voltage-60s"],
      },
    ],
  },
  simulatedMatrixUpdate: {
    id: "simulation-matched-replicates",
    label: "simulated",
    title: "What if three matched latest builds hold 1.10 V at 60 seconds?",
    measurement: {
      id: "simulated-replicate-voltage-60s",
      name: "Matched-replicate loaded voltage",
      value: 1.1,
      unit: "V",
      elapsedSeconds: 60,
      label: "simulated",
      disclaimer:
        "Illustrative matched-replicate outcome only—not measured, not part of either run, and excluded from all charts.",
    },
    observation: {
      id: "matrix-simulated-replicates",
      label: "Simulated: 3 builds hold 1.10 V",
      description:
        "SIMULATED OUTCOME: three matched Tic Tac-format cells each sustain approximately 1.10 V at 60 seconds under a characterized load with fixed-pressure contacts.",
      status: "planned",
      evidenceId: null,
      measurementId: "simulated-replicate-voltage-60s",
    },
    cells: [
      {
        hypothesisId: "electrolyte-redistribution",
        observationId: "matrix-simulated-replicates",
        effect: "supports",
        rationale:
          "Reproducibility with matched hydration would strengthen a stable wetting explanation, but would not isolate it from cathode construction.",
        evidenceIds: ["simulated-replicate-voltage-60s"],
      },
      {
        hypothesisId: "air-cathode-transport",
        observationId: "matrix-simulated-replicates",
        effect: "supports",
        rationale:
          "Reproducibility with matched cathode thickness and exposed area would support a stable air-cathode construction, without proving oxygen transport is dominant.",
        evidenceIds: ["simulated-replicate-voltage-60s"],
      },
      {
        hypothesisId: "electrical-contact",
        observationId: "matrix-simulated-replicates",
        effect: "contradicts",
        rationale:
          "Three repeatable trajectories with independently verified fixed contacts would weaken an intermittent-contact-only explanation.",
        evidenceIds: ["simulated-replicate-voltage-60s"],
      },
    ],
    changeSummary:
      "In this explicitly simulated outcome, the improvement becomes reproducible and a contact-only explanation loses support, but wetting and air-cathode construction remain confounded. The real matched replicate is still required.",
  },
});

export function loadDemoDataset(): DemoDataset {
  return demoDatasetSchema.parse(structuredClone(demoDataset));
}

export function loadDemoAnalysis(runId = demoDataset.activeRunId) {
  const run = demoDataset.runs.find(({ id }) => id === runId);
  if (!run) throw new Error(`Unknown demo run: ${runId}`);
  return analysisSchema.parse({
    schemaVersion: "1.0.0",
    promptVersion: "demo-precomputed-v1",
    generatedAt: "2026-07-18T13:05:00.000Z",
    run: structuredClone(run),
  });
}
