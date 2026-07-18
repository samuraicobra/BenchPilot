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

const earlierRun: ExperimentRun = {
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

export const demoDataset: DemoDataset = demoDatasetSchema.parse({
  id: "zinc-air-demo",
  name: "Zinc-air voltage divergence",
  description:
    "Two reported zinc-air prototype runs with opposite loaded-voltage trajectories, structured as evidence rather than a claimed conclusion.",
  activeRunId: activeRun.id,
  comparisonRunId: earlierRun.id,
  runs: [activeRun, earlierRun],
  comparison: {
    id: "comparison-zinc-air-runs",
    baselineRunId: earlierRun.id,
    comparisonRunId: activeRun.id,
    summary:
      "The current run collapses over 60 seconds while the earlier run recovers over 30 minutes. Because load current and assembly details are missing, the comparison shifts hypothesis support but proves none of the mechanisms.",
    configurationDifferences: [
      {
        field: "Initial condition",
        baselineValue: "Open-circuit voltage not recorded",
        comparisonValue: "1.562 V open circuit",
        significance:
          "The two runs cannot be normalized to the same measured starting state.",
      },
      {
        field: "Observation window",
        baselineValue: "1–30 minutes under an unspecified load",
        comparisonValue: "0–60 seconds with a fan load",
        significance:
          "Different windows and potentially different loads confound direct trajectory comparison.",
      },
      {
        field: "Separator",
        baselineValue:
          "Reported prototype version: no conventional separator; exact run equivalence unconfirmed",
        comparisonValue: "No conventional separator",
        significance:
          "Both are nominally separator-free, but build-to-build spacing and wetting were not controlled.",
      },
    ],
    changedVariables: [
      "Run/assembly identity",
      "Recorded observation window",
      "Known initial condition (OCV available only for current run)",
      "Potential load identity, electrode wetting, airflow, and contact state — all uncontrolled or undocumented",
    ],
    hypothesisSupportShifts: [
      {
        hypothesisId: "electrolyte-redistribution",
        direction: "gained",
        explanation:
          "Opposite trajectories in nominally similar separator-free builds increase the plausibility of uncontrolled wetting or electrolyte geometry.",
        evidenceIds: [
          "active-voltage-60s",
          "earlier-voltage-60s",
          "earlier-voltage-1800s",
        ],
      },
      {
        hypothesisId: "air-cathode-transport",
        direction: "gained",
        explanation:
          "The divergence under load is also compatible with differing cathode flooding or air access, which were not recorded.",
        evidenceIds: [
          "active-voltage-60s",
          "earlier-voltage-1800s",
          "image-irregular-cathode",
        ],
      },
      {
        hypothesisId: "electrical-contact",
        direction: "uncertain",
        explanation:
          "High OCV followed by collapse supports a series-resistance possibility, but the earlier smooth recovery is weaker evidence for an intermittent junction.",
        evidenceIds: [
          "active-voltage-ocv",
          "active-voltage-60s",
          "reported-smooth-recovery",
        ],
      },
    ],
  },
  simulatedMatrixUpdate: {
    id: "simulation-controlled-rewet",
    label: "simulated",
    title: "What if controlled rewetting restores the 60-second voltage?",
    measurement: {
      id: "simulated-rewet-voltage-60s",
      name: "Voltage after controlled electrolyte rewet",
      value: 1.08,
      unit: "V",
      elapsedSeconds: 60,
      label: "simulated",
      disclaimer:
        "Illustrative outcome only—not measured, not part of either run, and excluded from all charts until a user records a real result.",
    },
    observation: {
      id: "matrix-simulated-rewet-recovery",
      label: "Simulated: rewet reaches 1.08 V",
      description:
        "SIMULATED OUTCOME: after a controlled electrolyte aliquot, loaded voltage is imagined to recover to 1.08 V at 60 seconds with fixed contacts and airflow.",
      status: "planned",
      evidenceId: null,
      measurementId: "simulated-rewet-voltage-60s",
    },
    cells: [
      {
        hypothesisId: "electrolyte-redistribution",
        observationId: "matrix-simulated-rewet-recovery",
        effect: "supports",
        rationale:
          "A reproducible response to controlled rewetting would directly support electrolyte distribution as causal.",
        evidenceIds: ["simulated-rewet-voltage-60s"],
      },
      {
        hypothesisId: "air-cathode-transport",
        observationId: "matrix-simulated-rewet-recovery",
        effect: "does_not_distinguish",
        rationale:
          "Added liquid can change both ionic wetting and cathode flooding, so rewetting alone does not isolate air transport.",
        evidenceIds: ["simulated-rewet-voltage-60s"],
      },
      {
        hypothesisId: "electrical-contact",
        observationId: "matrix-simulated-rewet-recovery",
        effect: "contradicts",
        rationale:
          "With independently verified stable contacts, selective recovery after electrolyte dosing would weaken a contact-only mechanism.",
        evidenceIds: ["simulated-rewet-voltage-60s"],
      },
    ],
    changeSummary:
      "In this explicitly simulated outcome, electrolyte redistribution gains support, a contact-only explanation loses support, and air-cathode transport remains unresolved. A real matched replicate is still required.",
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
