const test = require("node:test");
const assert = require("node:assert/strict");

const { runAllChecks } = require("./algorithm-checks");

test("algorithm verification suite", () => {
  const report = runAllChecks();
  for (const result of report.results) {
    assert.equal(result.pass, true, result.error ? result.error.stack || result.error.message : result.name);
  }
});
