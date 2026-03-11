const test = require("node:test");
const assert = require("node:assert/strict");

const {
  BERLIN52_OPTIMAL,
  runBerlin52Benchmark
} = require("../scripts/berlin52-benchmark-lib");

test("Berlin52 benchmark is deterministic and histories are monotonic", () => {
  const first = runBerlin52Benchmark({ seeds: [11, 19] });
  const second = runBerlin52Benchmark({ seeds: [11, 19] });

  assert.deepEqual(second, first);

  for (const scenario of first) {
    for (const run of scenario.runs) {
      assert.ok(run.finalLength <= run.initialLength, `${scenario.name} should improve over time`);
      assert.ok(run.finalLength >= BERLIN52_OPTIMAL, `${scenario.name} should not beat the known optimum`);

      for (let index = 1; index < run.history.length; index += 1) {
        assert.ok(
          run.history[index] <= run.history[index - 1],
          `${scenario.name} best-so-far increased at ${index}: ${run.history[index - 1]} -> ${run.history[index]}`
        );
      }
    }
  }
});
