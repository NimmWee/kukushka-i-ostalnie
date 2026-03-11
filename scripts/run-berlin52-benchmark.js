const fs = require("node:fs");
const path = require("node:path");

const {
  DEFAULT_SEEDS,
  BERLIN52_OPTIMAL,
  formatNumber,
  buildJsonReport,
  buildCsvReport,
  buildMarkdownReport,
  runBerlin52Benchmark
} = require("./berlin52-benchmark-lib");

function writeReport(filePath, content) {
  const absolutePath = path.resolve(filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

function parseArgs(argv) {
  const options = {
    json: null,
    csv: null,
    md: null,
    seeds: DEFAULT_SEEDS
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--json") options.json = argv[index + 1] || null;
    if (current === "--csv") options.csv = argv[index + 1] || null;
    if (current === "--md") options.md = argv[index + 1] || null;
    if (current === "--seeds") {
      const raw = argv[index + 1] || "";
      options.seeds = raw
        .split(",")
        .map((value) => Number.parseInt(value.trim(), 10))
        .filter((value) => Number.isFinite(value));
    }
  }

  return options;
}

function printConsoleReport(results) {
  console.log("BERLIN52 CONVERGENCE REPORT");
  console.log("===========================");
  console.log(`Known optimum: ${BERLIN52_OPTIMAL}`);
  console.log("");

  for (const result of results) {
    console.log(result.name);
    console.log(`  best final:        ${formatNumber(result.summary.bestFinal)}`);
    console.log(`  median final:      ${formatNumber(result.summary.medianFinal)}`);
    console.log(`  worst final:       ${formatNumber(result.summary.worstFinal)}`);
    console.log(`  median gap:        ${formatNumber(result.summary.medianGapPercent)}%`);
    console.log(`  median improvement:${formatNumber(result.summary.medianImprovementPercent)}%`);
    console.log(`  <=5% gap hits:     ${result.summary.gap5Hits}/${result.runs.length}`);
    console.log(`  <=1% gap hits:     ${result.summary.gap1Hits}/${result.runs.length}`);
    console.log(`  exact hits:        ${result.summary.exactHits}/${result.runs.length}`);

    for (const run of result.runs) {
      console.log(
        `    seed=${run.seed} initial=${run.initialLength} final=${run.finalLength} gap=${formatNumber(run.gapPercent)}% improvement=${formatNumber(run.improvementPercent)}% iterations=${run.iterations}`
      );
    }

    console.log("");
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const results = runBerlin52Benchmark({ seeds: options.seeds });
  printConsoleReport(results);

  if (options.json) {
    const jsonPath = writeReport(
      options.json,
      `${JSON.stringify(buildJsonReport(results, options.seeds), null, 2)}\n`
    );
    console.log(`JSON report: ${jsonPath}`);
  }

  if (options.csv) {
    const csvPath = writeReport(options.csv, `${buildCsvReport(results)}\n`);
    console.log(`CSV report:  ${csvPath}`);
  }

  if (options.md) {
    const mdPath = writeReport(options.md, buildMarkdownReport(results, options.seeds));
    console.log(`Markdown:    ${mdPath}`);
  }
}

if (require.main === module) main();
