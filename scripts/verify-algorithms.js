const fs = require("node:fs");
const path = require("node:path");

const { createHarness } = require("../tests/utils/headless-app-harness");

const scenarios = [
  {
    name: "GA+Tabu / Sphere",
    params: { algorithmKey: "ga_tabu", objectiveKey: "sphere", nests: 60, pa: 0.15, maxIter: 100, alpha: 0.85, beta: 100 },
    seeds: [11, 19, 23, 29, 31]
  },
  {
    name: "GA+Tabu / Ackley",
    params: { algorithmKey: "ga_tabu", objectiveKey: "ackley", nests: 60, pa: 0.15, maxIter: 100, alpha: 0.85, beta: 100 },
    seeds: [11, 19, 23, 29, 31]
  },
  {
    name: "GA+Tabu / Rastrigin",
    params: { algorithmKey: "ga_tabu", objectiveKey: "rastrigin", nests: 60, pa: 0.15, maxIter: 100, alpha: 0.85, beta: 100 },
    seeds: [11, 19, 23, 29, 31]
  },
  {
    name: "Annealing / Sphere",
    params: { algorithmKey: "annealing", objectiveKey: "sphere", nests: 40, pa: 0.001, maxIter: 1400, alpha: 0.96, beta: 0.45 },
    seeds: [11, 19, 23, 29, 31]
  },
  {
    name: "Annealing / Ackley",
    params: { algorithmKey: "annealing", objectiveKey: "ackley", nests: 40, pa: 0.001, maxIter: 1600, alpha: 0.96, beta: 0.45 },
    seeds: [11, 19, 23, 29, 31]
  },
  {
    name: "Annealing / Rastrigin",
    params: { algorithmKey: "annealing", objectiveKey: "rastrigin", nests: 40, pa: 0.001, maxIter: 1800, alpha: 0.965, beta: 0.4 },
    seeds: [11, 19, 23, 29, 31]
  },
  {
    name: "Scatter / Sphere",
    params: { algorithmKey: "scatter", objectiveKey: "sphere", nests: 80, pa: 0.25, maxIter: 120, alpha: 0.35, beta: 14 },
    seeds: [11, 19, 23, 29, 31]
  },
  {
    name: "Scatter / Ackley",
    params: { algorithmKey: "scatter", objectiveKey: "ackley", nests: 80, pa: 0.25, maxIter: 120, alpha: 0.35, beta: 14 },
    seeds: [11, 19, 23, 29, 31]
  },
  {
    name: "Scatter / Rastrigin",
    params: { algorithmKey: "scatter", objectiveKey: "rastrigin", nests: 80, pa: 0.25, maxIter: 120, alpha: 0.35, beta: 14 },
    seeds: [11, 19, 23, 29, 31]
  }
];

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "NaN";
  if (value === 0) return "0";
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) return value.toExponential(3);
  return value.toFixed(6);
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) return `"${text.replace(/"/g, "\"\"")}"`;
  return text;
}

function runOne(seed, params) {
  const harness = createHarness({ seed });
  const initial = harness.configure(params);
  const result = harness.runUntilDone();
  const finalBest = result.final.best.fitness;
  const initialBest = initial.best.fitness;
  const improvement = initialBest <= 1e-12 ? 0 : ((initialBest - finalBest) / initialBest) * 100;

  return {
    seed,
    initialBest,
    finalBest,
    improvement,
    steps: result.steps,
    stopReason: result.final.stopReason
  };
}

function verifyScenario(scenario) {
  const runs = scenario.seeds.map((seed) => runOne(seed, scenario.params));
  const finals = runs.map((run) => run.finalBest);
  const improvements = runs.map((run) => run.improvement);
  const finished = runs.every((run) => run.stopReason.includes("Причина остановки:"));

  return {
    ...scenario,
    runs,
    summary: {
      finished,
      bestFinal: Math.min(...finals),
      worstFinal: Math.max(...finals),
      medianFinal: median(finals),
      medianImprovement: median(improvements),
      avgSteps: runs.reduce((sum, run) => sum + run.steps, 0) / runs.length
    }
  };
}

function runAllScenarios() {
  return scenarios.map(verifyScenario);
}

function flattenResults(results) {
  return results.flatMap((scenario) =>
    scenario.runs.map((run) => ({
      scenario: scenario.name,
      algorithmKey: scenario.params.algorithmKey,
      objectiveKey: scenario.params.objectiveKey,
      seed: run.seed,
      initialBest: run.initialBest,
      finalBest: run.finalBest,
      improvementPercent: run.improvement,
      steps: run.steps,
      stopReason: run.stopReason
    }))
  );
}

function buildJsonReport(results) {
  return {
    generatedAt: new Date().toISOString(),
    notes: [
      "Tests use the real browser implementation from app.js via a headless DOM/canvas harness.",
      "Results are deterministic because each run uses a fixed random seed.",
      "This validates continuous optimization behavior on Sphere, Ackley, and Rastrigin, not Berlin52/TSP."
    ],
    results
  };
}

function buildCsvReport(results) {
  const rows = flattenResults(results);
  const header = [
    "scenario",
    "algorithmKey",
    "objectiveKey",
    "seed",
    "initialBest",
    "finalBest",
    "improvementPercent",
    "steps",
    "stopReason"
  ];

  return [
    header.join(","),
    ...rows.map((row) =>
      [
        row.scenario,
        row.algorithmKey,
        row.objectiveKey,
        row.seed,
        row.initialBest,
        row.finalBest,
        row.improvementPercent,
        row.steps,
        row.stopReason
      ].map(csvEscape).join(",")
    )
  ].join("\n");
}

function writeReport(filePath, content) {
  const absolutePath = path.resolve(filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

function parseArgs(argv) {
  const options = {
    json: null,
    csv: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--json") options.json = argv[index + 1] || null;
    if (current === "--csv") options.csv = argv[index + 1] || null;
  }

  return options;
}

function printScenarioReport(result) {
  console.log(result.name);
  console.log(`  finished:          ${result.summary.finished ? "yes" : "no"}`);
  console.log(`  best final:        ${formatNumber(result.summary.bestFinal)}`);
  console.log(`  median final:      ${formatNumber(result.summary.medianFinal)}`);
  console.log(`  worst final:       ${formatNumber(result.summary.worstFinal)}`);
  console.log(`  median improvement:${result.summary.medianImprovement.toFixed(2)}%`);
  console.log(`  avg steps:         ${result.summary.avgSteps.toFixed(1)}`);

  for (const run of result.runs) {
    console.log(
      `    seed=${run.seed} initial=${formatNumber(run.initialBest)} final=${formatNumber(run.finalBest)} improvement=${run.improvement.toFixed(2)}% steps=${run.steps}`
    );
  }
  console.log("");
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log("ALGORITHM VERIFICATION REPORT");
  console.log("=============================");
  console.log("");

  const results = runAllScenarios();
  results.forEach(printScenarioReport);

  if (options.json) {
    const jsonPath = writeReport(options.json, `${JSON.stringify(buildJsonReport(results), null, 2)}\n`);
    console.log(`JSON report: ${jsonPath}`);
  }
  if (options.csv) {
    const csvPath = writeReport(options.csv, `${buildCsvReport(results)}\n`);
    console.log(`CSV report:  ${csvPath}`);
  }
  if (options.json || options.csv) console.log("");

  console.log("Notes:");
  console.log("- Tests use the real browser implementation from app.js via a headless DOM/canvas harness.");
  console.log("- Results are deterministic because each run uses a fixed random seed.");
  console.log("- Sphere is the strongest correctness sanity-check because its global optimum is known exactly: f(0,0)=0.");
  console.log("- This checks continuous optimization only; it does not validate Berlin52/TSP.");
}

if (require.main === module) main();

module.exports = {
  scenarios,
  runOne,
  verifyScenario,
  runAllScenarios,
  flattenResults,
  buildJsonReport,
  buildCsvReport
};
