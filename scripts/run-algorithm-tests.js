const { runAllChecks } = require("../tests/algorithm-checks");

function main() {
  const report = runAllChecks();

  console.log("ALGORITHM TEST SUITE");
  console.log("====================");

  for (const result of report.results) {
    if (result.pass) {
      console.log(`PASS ${result.name}`);
      continue;
    }

    console.log(`FAIL ${result.name}`);
    console.log(result.error && result.error.stack ? result.error.stack : String(result.error));
  }

  console.log("");
  console.log(`Overall: ${report.passed ? "PASS" : "FAIL"}`);

  if (!report.passed) process.exitCode = 1;
}

main();
