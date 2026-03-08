const assert = require("node:assert/strict");

const { createHarness } = require("./utils/headless-app-harness");

const EPS = 1e-12;
const BOUNDS = { min: -5, max: 5 };

const scenarios = {
  ga_tabu: {
    algorithmKey: "ga_tabu",
    objectiveKey: "sphere",
    nests: 60,
    pa: 0.15,
    maxIter: 100,
    alpha: 0.85,
    beta: 100
  },
  annealing: {
    algorithmKey: "annealing",
    objectiveKey: "sphere",
    nests: 40,
    pa: 0.001,
    maxIter: 1400,
    alpha: 0.96,
    beta: 0.45
  },
  scatter: {
    algorithmKey: "scatter",
    objectiveKey: "sphere",
    nests: 80,
    pa: 0.25,
    maxIter: 120,
    alpha: 0.35,
    beta: 14
  },
  cuckoo: {
    algorithmKey: "cuckoo",
    objectiveKey: "sphere",
    nests: 50,
    pa: 0.25,
    maxIter: 120,
    alpha: 0.35,
    beta: 1.5
  }
};

function assertPointInBounds(point) {
  assert.ok(point.x >= BOUNDS.min - EPS && point.x <= BOUNDS.max + EPS, `x out of bounds: ${point.x}`);
  assert.ok(point.y >= BOUNDS.min - EPS && point.y <= BOUNDS.max + EPS, `y out of bounds: ${point.y}`);
  assert.ok(Number.isFinite(point.fitness), `fitness must be finite: ${point.fitness}`);
}

function runScenario(seed, params, extra = {}) {
  const harness = createHarness({ seed });
  harness.configure(params);
  return harness.runUntilDone(extra);
}

function checkFinishAndMonotonicity() {
  for (const [name, params] of Object.entries(scenarios)) {
    const result = runScenario(100 + name.length, params);
    assert.equal(result.done, true, `${name} did not finish`);
    assert.ok(result.steps > 0, `${name} should execute at least one step`);
    assert.equal(result.final.flowPhase, "done", `${name} should end in done phase`);
    assert.ok(result.final.best, `${name} should keep best solution`);

    for (let i = 1; i < result.final.history.length; i += 1) {
      const prev = result.final.history[i - 1];
      const current = result.final.history[i];
      assert.ok(current <= prev + EPS, `${name} best-so-far increased at index ${i}: ${prev} -> ${current}`);
    }
  }
}

function checkBounds() {
  for (const [name, params] of Object.entries(scenarios)) {
    const result = runScenario(200 + name.length, params);
    for (const snapshot of result.snapshots) {
      if (snapshot.best) assertPointInBounds(snapshot.best);
      snapshot.points.forEach(assertPointInBounds);
      snapshot.candidates.forEach(assertPointInBounds);
    }
  }
}

function checkGaTabuPopulationAndSeeds() {
  const harness = createHarness({ seed: 301 });
  harness.configure({
    ...scenarios.ga_tabu,
    objectiveKey: "ackley"
  });

  const expectedPopulationSize = scenarios.ga_tabu.nests;
  let sawSeedSelection = false;

  const result = harness.runUntilDone({
    onStep(snapshot) {
      const algo = snapshot.algorithmState;
      if (!algo) return;

      if (Array.isArray(algo.population)) {
        assert.equal(algo.population.length, expectedPopulationSize, "population size must stay constant");
      }

      if (snapshot.flowPhase === "seed_select") {
        sawSeedSelection = true;
        assert.ok(algo.seeds.length > 0, "seed selection should find at least one seed");
        assert.ok(algo.seeds.length <= algo.restartCount, "seed count should not exceed restart count");
      }
    }
  });

  assert.equal(result.done, true);
  if (!sawSeedSelection) {
    assert.match(result.final.stopReason, /достигнута целевая точность/u, "without seed selection GA+Tabu should stop only by reaching target");
  }
}

function checkAnnealingCooling() {
  const harness = createHarness({ seed: 401 });
  harness.configure(scenarios.annealing);

  const temperatures = [];

  const result = harness.runUntilDone({
    onStep(snapshot) {
      if (snapshot.flowPhase !== "sa_cool") return;
      temperatures.push(snapshot.algorithmState.temperature);
      assert.ok(snapshot.algorithmState.alpha >= 0.8 && snapshot.algorithmState.alpha <= 0.999, "alpha out of bounds");
    }
  });

  assert.equal(result.done, true);
  assert.ok(temperatures.length > 5, "annealing should cool multiple times");
  for (let i = 1; i < temperatures.length; i += 1) {
    assert.ok(temperatures[i] < temperatures[i - 1], `temperature must decrease: ${temperatures[i - 1]} -> ${temperatures[i]}`);
  }
}

function checkScatterRefSet() {
  const harness = createHarness({ seed: 501 });
  harness.configure(scenarios.scatter);

  let expectedRefSize = null;

  const result = harness.runUntilDone({
    onStep(snapshot) {
      const algo = snapshot.algorithmState;
      if (!algo || !Array.isArray(algo.refSet)) return;
      if (expectedRefSize === null) expectedRefSize = algo.refSize;
      assert.equal(algo.refSet.length, expectedRefSize, "RefSet size must stay constant");
      assert.ok(algo.refSet.length > 0, "RefSet must not become empty");
    }
  });

  assert.equal(result.done, true);
  assert.ok(expectedRefSize > 0, "RefSet size should be initialized");
}

function checkCuckooNestInvariants() {
  const harness = createHarness({ seed: 601 });
  harness.configure({
    ...scenarios.cuckoo,
    objectiveKey: "ackley"
  });

  const expectedNestCount = scenarios.cuckoo.nests;
  let sawAbandonPhase = false;

  const result = harness.runUntilDone({
    onStep(snapshot) {
      const algo = snapshot.algorithmState;
      if (!algo || !Array.isArray(algo.nests)) return;

      assert.equal(algo.nests.length, expectedNestCount, "cuckoo nest count must stay constant");
      assert.ok(algo.discoveryRate >= 0.05 && algo.discoveryRate <= 0.6, "discovery rate out of bounds");
      assert.ok(algo.levyLambda >= 1.1 && algo.levyLambda <= 2, "Levy lambda out of bounds");

      if (snapshot.flowPhase === "cs_abandon") {
        sawAbandonPhase = true;
        assert.ok(Array.isArray(snapshot.candidates), "abandon phase should expose candidates");
      }
    }
  });

  assert.equal(result.done, true);
  assert.equal(sawAbandonPhase, true, "cuckoo search should enter abandon phase");
}

function checkSphereConvergence() {
  const thresholds = {
    ga_tabu: 0.01,
    annealing: 0.01,
    scatter: 0.03,
    cuckoo: 0.02
  };

  for (const [name, params] of Object.entries(scenarios)) {
    const finals = [];
    for (const seed of [11, 19, 23, 29, 31]) {
      const result = runScenario(seed, params);
      finals.push(result.final.best.fitness);
    }

    finals.sort((a, b) => a - b);
    const median = finals[Math.floor(finals.length / 2)];
    assert.ok(median <= thresholds[name], `${name} median Sphere fitness too high: ${median}`);
  }
}

function runAllChecks() {
  const checks = [
    { name: "finish and monotonic best-so-far", fn: checkFinishAndMonotonicity },
    { name: "search points stay within bounds", fn: checkBounds },
    { name: "GA+Tabu population and seed invariants", fn: checkGaTabuPopulationAndSeeds },
    { name: "annealing cooling invariants", fn: checkAnnealingCooling },
    { name: "scatter RefSet invariants", fn: checkScatterRefSet },
    { name: "cuckoo nest invariants", fn: checkCuckooNestInvariants },
    { name: "sphere convergence sanity-check", fn: checkSphereConvergence }
  ];

  const results = [];
  for (const check of checks) {
    try {
      check.fn();
      results.push({ name: check.name, pass: true });
    } catch (error) {
      results.push({ name: check.name, pass: false, error });
    }
  }

  return {
    passed: results.every((result) => result.pass),
    results
  };
}

module.exports = {
  runAllChecks,
  scenarios
};
