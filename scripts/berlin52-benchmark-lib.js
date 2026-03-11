const { BERLIN52, BERLIN52_OPTIMAL, DEFAULT_SEEDS } = require("./berlin52-data");

const EPS = 1e-9;

const ALGORITHM_SCENARIOS = [
  { key: "ga_tabu", name: "GA+Tabu", params: { nests: 110, pa: 0.17, maxIter: 220, alpha: 0.9, beta: 220 } },
  { key: "annealing", name: "Simulated Annealing", params: { nests: 100, pa: 0.0003, maxIter: 22000, alpha: 0.9972, beta: 5.0 } },
  { key: "scatter", name: "Scatter Search", params: { nests: 80, pa: 0.25, maxIter: 120, alpha: 0.35, beta: 14 } },
  { key: "cuckoo", name: "Cuckoo Search", params: { nests: 90, pa: 0.18, maxIter: 450, alpha: 0.12, beta: 1.35 } }
];

function createSeededRandom(seed) {
  let state = seed >>> 0;
  if (state === 0) state = 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "NaN";
  if (Math.abs(value) >= 100000 || Math.abs(value) < 0.001) return value.toExponential(3);
  return value.toFixed(3);
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) return `"${text.replace(/"/g, "\"\"")}"`;
  return text;
}

function shuffle(values, rng) {
  const array = values.slice();
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
  return array;
}

function buildDistanceMatrix(points) {
  const matrix = Array.from({ length: points.length }, () => Array(points.length).fill(0));
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const d = Math.round(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y));
      matrix[i][j] = d;
      matrix[j][i] = d;
    }
  }
  return matrix;
}

function routeLength(order, matrix) {
  let total = 0;
  for (let i = 0; i < order.length; i += 1) total += matrix[order[i]][order[(i + 1) % order.length]];
  return total;
}

function cloneSolution(solution) {
  return { order: solution.order.slice(), length: solution.length };
}

function reverseSegment(order, start, end) {
  let left = start;
  let right = end;
  while (left < right) {
    const tmp = order[left];
    order[left] = order[right];
    order[right] = tmp;
    left += 1;
    right -= 1;
  }
}

function swapPositions(order, left, right) {
  const tmp = order[left];
  order[left] = order[right];
  order[right] = tmp;
}

function insertPosition(order, from, to) {
  const next = order.slice();
  const [value] = next.splice(from, 1);
  next.splice(to, 0, value);
  return next;
}

function randomOrder(size, rng) {
  return [0, ...shuffle(Array.from({ length: size - 1 }, (_, index) => index + 1), rng)];
}

function nearestNeighborOrder(matrix) {
  const used = Array(matrix.length).fill(false);
  const order = [0];
  used[0] = true;
  let current = 0;
  while (order.length < matrix.length) {
    let bestNode = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let candidate = 1; candidate < matrix.length; candidate += 1) {
      if (used[candidate]) continue;
      if (matrix[current][candidate] < bestDistance) {
        bestDistance = matrix[current][candidate];
        bestNode = candidate;
      }
    }
    used[bestNode] = true;
    order.push(bestNode);
    current = bestNode;
  }
  return order;
}

function orderHammingDistance(first, second) {
  let distance = 0;
  for (let index = 1; index < first.length; index += 1) {
    if (first[index] !== second[index]) distance += 1;
  }
  return distance;
}

function orderedCrossover(parentA, parentB, rng) {
  const genesA = parentA.slice(1);
  const genesB = parentB.slice(1);
  const child = Array(genesA.length).fill(null);
  const left = randomInt(rng, 0, genesA.length - 1);
  const right = randomInt(rng, left, genesA.length - 1);
  const used = new Set();

  for (let i = left; i <= right; i += 1) {
    child[i] = genesA[i];
    used.add(genesA[i]);
  }

  let source = 0;
  for (let i = 0; i < child.length; i += 1) {
    if (child[i] !== null) continue;
    while (used.has(genesB[source])) source += 1;
    child[i] = genesB[source];
    used.add(genesB[source]);
    source += 1;
  }

  return [0, ...child];
}

function mutateOrder(order, rng, mutationRate) {
  const candidate = order.slice();
  const last = candidate.length - 1;
  if (rng() < mutationRate) {
    const left = randomInt(rng, 1, last - 1);
    const right = randomInt(rng, left + 1, last);
    reverseSegment(candidate, left, right);
  }
  if (rng() < mutationRate) {
    const left = randomInt(rng, 1, last);
    let right = randomInt(rng, 1, last);
    if (left === right) right = right === last ? 1 : right + 1;
    swapPositions(candidate, left, right);
  }
  if (rng() < mutationRate * 0.4) {
    const from = randomInt(rng, 1, last);
    let to = randomInt(rng, 1, last);
    if (from === to) to = to === last ? 1 : to + 1;
    return insertPosition(candidate, from, to);
  }
  return candidate;
}

function createNeighbor(order, rng) {
  const candidate = order.slice();
  const last = candidate.length - 1;
  const move = rng();
  if (move < 0.4) {
    const left = randomInt(rng, 1, last - 1);
    const right = randomInt(rng, left + 1, last);
    reverseSegment(candidate, left, right);
    return candidate;
  }
  if (move < 0.75) {
    const left = randomInt(rng, 1, last);
    let right = randomInt(rng, 1, last);
    if (left === right) right = right === last ? 1 : right + 1;
    swapPositions(candidate, left, right);
    return candidate;
  }
  const from = randomInt(rng, 1, last);
  let to = randomInt(rng, 1, last);
  if (from === to) to = to === last ? 1 : to + 1;
  return insertPosition(candidate, from, to);
}

function twoOptImprove(order, matrix, maxMoves = 6) {
  const candidate = order.slice();
  let currentLength = routeLength(candidate, matrix);
  let moves = 0;
  while (moves < maxMoves) {
    let improved = false;
    for (let left = 1; left < candidate.length - 1; left += 1) {
      const previous = candidate[left - 1];
      const current = candidate[left];
      for (let right = left + 1; right < candidate.length; right += 1) {
        const tail = candidate[right];
        const next = candidate[(right + 1) % candidate.length];
        const delta = matrix[previous][tail] + matrix[current][next] - matrix[previous][current] - matrix[tail][next];
        if (delta < -EPS) {
          reverseSegment(candidate, left, right);
          currentLength += delta;
          moves += 1;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
    if (!improved) break;
  }
  return { order: candidate, length: currentLength };
}

function buildInitialPopulation(size, matrix, rng, localMoves) {
  const population = [twoOptImprove(nearestNeighborOrder(matrix), matrix, localMoves + 4)];
  while (population.length < size) population.push(twoOptImprove(randomOrder(matrix.length, rng), matrix, localMoves));
  return population;
}

function selectTournament(population, rng, size = 4) {
  let best = null;
  for (let i = 0; i < size; i += 1) {
    const candidate = population[randomInt(rng, 0, population.length - 1)];
    if (!best || candidate.length < best.length) best = candidate;
  }
  return best;
}

function selectPromisingSeeds(population, count) {
  const sorted = population.slice().sort((a, b) => a.length - b.length);
  const selected = [];
  const minDistance = Math.max(6, Math.floor(sorted[0].order.length / 5));
  for (const candidate of sorted) {
    if (selected.every((seed) => orderHammingDistance(seed.order, candidate.order) >= minDistance)) selected.push(candidate);
    if (selected.length >= count) break;
  }
  return selected.length ? selected : sorted.slice(0, count);
}

function buildRefSet(population, refSize) {
  const seen = new Set();
  const unique = [];
  for (const candidate of population.slice().sort((a, b) => a.length - b.length)) {
    const key = candidate.order.join("-");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(candidate);
  }
  const eliteCount = Math.max(2, Math.ceil(refSize / 2));
  const selected = unique.slice(0, eliteCount);
  const pool = unique.slice(eliteCount);
  while (selected.length < refSize && pool.length > 0) {
    let bestIndex = 0;
    let bestScore = -1;
    for (let i = 0; i < pool.length; i += 1) {
      let minDistance = Number.POSITIVE_INFINITY;
      for (const current of selected) minDistance = Math.min(minDistance, orderHammingDistance(current.order, pool[i].order));
      if (minDistance > bestScore) {
        bestScore = minDistance;
        bestIndex = i;
      }
    }
    selected.push(pool[bestIndex]);
    pool.splice(bestIndex, 1);
  }
  return selected.slice(0, refSize);
}

function doubleBridgeKick(order, rng) {
  if (order.length < 9) return createNeighbor(order, rng);

  const last = order.length - 1;
  const cuts = [
    randomInt(rng, 1, Math.max(2, Math.floor(last * 0.2))),
    randomInt(rng, Math.max(2, Math.floor(last * 0.2)), Math.max(3, Math.floor(last * 0.45))),
    randomInt(rng, Math.max(3, Math.floor(last * 0.45)), Math.max(4, Math.floor(last * 0.7))),
    randomInt(rng, Math.max(4, Math.floor(last * 0.7)), last)
  ].sort((a, b) => a - b);

  const [a, b, c, d] = cuts;
  const p1 = order.slice(1, a);
  const p2 = order.slice(a, b);
  const p3 = order.slice(b, c);
  const p4 = order.slice(c, d);
  const p5 = order.slice(d);

  return [0, ...p1, ...p4, ...p3, ...p2, ...p5];
}

function buildCandidateFromOrder(baseOrder, matrix, rng, options = {}) {
  const trials = options.trials ?? 1;
  const moveStrength = Math.max(1, options.moveStrength ?? 3);
  const localMoves = Math.max(1, options.localMoves ?? 6);
  const kickProbability = options.kickProbability ?? 0.15;
  let best = null;

  for (let trial = 0; trial < trials; trial += 1) {
    let candidate = baseOrder.slice();
    if (rng() < kickProbability) candidate = doubleBridgeKick(candidate, rng);

    const steps = randomInt(rng, 1, moveStrength);
    for (let step = 0; step < steps; step += 1) candidate = createNeighbor(candidate, rng);

    const improved = twoOptImprove(candidate, matrix, localMoves);
    if (!best || improved.length < best.length) best = improved;
  }

  return best;
}

function sampleMilestones(history) {
  return [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
    const iteration = Math.min(history.length - 1, Math.round((history.length - 1) * fraction));
    const length = history[iteration];
    return { fraction, iteration, length, gapPercent: ((length - BERLIN52_OPTIMAL) / BERLIN52_OPTIMAL) * 100 };
  });
}

function firstIterationAtGap(history, gapPercent) {
  const limit = BERLIN52_OPTIMAL * (1 + gapPercent / 100);
  const index = history.findIndex((value) => value <= limit);
  return index >= 0 ? index : null;
}

function gamma(z) {
  const p = [676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  let x = 0.9999999999998099;
  const t = z - 1;
  for (let i = 0; i < p.length; i += 1) x += p[i] / (t + i + 1);
  const g = 7;
  const w = t + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(w, t + 0.5) * Math.exp(-w) * x;
}

function gaussianRandom(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function levyVector(beta, size, rng) {
  const numerator = gamma(1 + beta) * Math.sin((Math.PI * beta) / 2);
  const denominator = gamma((1 + beta) / 2) * beta * Math.pow(2, (beta - 1) / 2);
  const sigma = Math.pow(numerator / denominator, 1 / beta);
  return Array.from({ length: size }, () => {
    const u = gaussianRandom(rng) * sigma;
    const v = gaussianRandom(rng);
    return u / Math.pow(Math.abs(v) + 1e-12, 1 / beta);
  });
}

function orderToKeys(order) {
  const keys = Array(order.length - 1).fill(0);
  for (let index = 1; index < order.length; index += 1) keys[order[index] - 1] = index / order.length;
  return keys;
}

function keysToOrder(keys) {
  return [0, ...keys.map((value, index) => ({ city: index + 1, value })).sort((a, b) => a.value - b.value).map((item) => item.city)];
}

function evaluateKeys(keys, matrix, localMoves) {
  const improved = twoOptImprove(keysToOrder(keys), matrix, localMoves);
  return { keys: orderToKeys(improved.order), order: improved.order, length: improved.length };
}

function pickBest(population) {
  return population.reduce((best, candidate) => (candidate.length < best.length ? candidate : best));
}

function runGaTabu(matrix, params, seed) {
  const rng = createSeededRandom(seed);
  const restartCount = clamp(Math.round(Math.sqrt(params.nests)), 2, 16);
  const tabuIterations = Math.max(1, Math.round(params.beta));
  const tabuTenure = clamp(Math.round(Math.sqrt(params.nests) * 1.7), 4, 25);
  const stallLimit = Math.max(10, Math.floor(params.maxIter * 0.2));
  let population = buildInitialPopulation(params.nests, matrix, rng, 6);
  let best = cloneSolution(pickBest(population));
  const history = [best.length];
  let noImprove = 0;

  for (let generation = 0; generation < params.maxIter && noImprove < stallLimit; generation += 1) {
    const sorted = population.slice().sort((a, b) => a.length - b.length);
    const nextPopulation = sorted.slice(0, Math.max(3, Math.floor(params.nests * 0.1))).map(cloneSolution);
    while (nextPopulation.length < params.nests) {
      const parentA = selectTournament(sorted, rng);
      const parentB = selectTournament(sorted, rng);
      let child = rng() < params.alpha ? orderedCrossover(parentA.order, parentB.order, rng) : parentA.order.slice();
      child = mutateOrder(child, rng, params.pa);
      nextPopulation.push(twoOptImprove(child, matrix, rng() < 0.35 ? 6 : 2));
    }
    population = nextPopulation;
    const generationBest = pickBest(population);
    if (generationBest.length < best.length - EPS) {
      best = cloneSolution(generationBest);
      noImprove = 0;
    } else {
      noImprove += 1;
    }
    history.push(best.length);
  }

  const seeds = selectPromisingSeeds(population, restartCount);
  for (const start of seeds) {
    let current = cloneSolution(start);
    const tabu = new Map();
    for (let iteration = 0; iteration < tabuIterations; iteration += 1) {
      let bestMove = null;
      for (let candidateIndex = 0; candidateIndex < 24; candidateIndex += 1) {
        const left = randomInt(rng, 1, current.order.length - 2);
        const right = randomInt(rng, left + 1, current.order.length - 1);
        const useSwap = rng() < 0.35;
        const candidateOrder = current.order.slice();
        if (useSwap) swapPositions(candidateOrder, left, right);
        else reverseSegment(candidateOrder, left, right);
        const candidate = twoOptImprove(candidateOrder, matrix, useSwap ? 2 : 3);
        const key = `${useSwap ? "swap" : "reverse"}:${left}:${right}`;
        const isTabu = (tabu.get(key) || -1) > iteration;
        if (isTabu && candidate.length >= best.length - EPS) continue;
        if (!bestMove || candidate.length < bestMove.solution.length) bestMove = { solution: candidate, key };
      }
      if (!bestMove) break;
      current = bestMove.solution;
      tabu.set(bestMove.key, iteration + tabuTenure);
      if (current.length < best.length - EPS) best = cloneSolution(current);
      history.push(best.length);
    }
  }

  return { history, finalLength: best.length };
}

function estimateInitialTemperature(solution, matrix, rng) {
  const deltas = [];
  for (let index = 0; index < 80; index += 1) {
    const candidate = routeLength(createNeighbor(solution.order, rng), matrix);
    const delta = candidate - solution.length;
    if (delta > 0) deltas.push(delta);
  }
  const meanPositive = deltas.length ? average(deltas) : 50;
  return meanPositive / Math.abs(Math.log(0.8));
}

function runAnnealing(matrix, params, seed) {
  const rng = createSeededRandom(seed);
  const pool = buildInitialPopulation(params.nests, matrix, rng, 6);
  const eliteStarts = pool.slice().sort((a, b) => a.length - b.length).slice(0, Math.min(8, pool.length)).map(cloneSolution);
  let current = cloneSolution(pickBest(pool));
  let best = cloneSolution(current);
  const initialTemperature = estimateInitialTemperature(current, matrix, rng) * 2.5;
  let temperature = initialTemperature;
  const minimumTemperature = Math.max(0.5, initialTemperature * params.pa);
  let alpha = params.alpha;
  let acceptedWindow = 0;
  let stagnation = 0;
  const history = [best.length];
  const moveStrength = clamp(Math.round(3 + params.beta * 3), 3, 12);
  const localMoves = clamp(Math.round(6 + params.beta * 5), 6, 20);

  for (let iteration = 1; iteration <= params.maxIter && temperature > minimumTemperature; iteration += 1) {
    const candidateBase = stagnation > 50 && rng() < 0.5 ? best.order : current.order;
    const candidate = buildCandidateFromOrder(candidateBase, matrix, rng, {
      trials: stagnation > 80 ? 6 : 3,
      moveStrength,
      localMoves,
      kickProbability: stagnation > 80 ? 0.7 : 0.22
    });

    const delta = candidate.length - current.length;
    const scaledTemperature = temperature * (1 + matrix.length * 0.02);
    if (delta < 0 || rng() < Math.exp(-delta / Math.max(scaledTemperature, 1e-9))) {
      current = candidate;
      acceptedWindow += 1;
    }

    if (current.length < best.length - EPS) {
      best = cloneSolution(current);
      stagnation = 0;
    } else {
      stagnation += 1;
    }

    history.push(best.length);

    if (stagnation > 140) {
      const restartBase =
        rng() < 0.65 ? best.order : eliteStarts[randomInt(rng, 0, eliteStarts.length - 1)].order;
      current = buildCandidateFromOrder(restartBase, matrix, rng, {
        trials: 3,
        moveStrength: moveStrength + 3,
        localMoves: localMoves + 4,
        kickProbability: 0.9
      });
      temperature = Math.max(temperature, initialTemperature * 0.45);
      stagnation = 0;
    }

    if (iteration % 100 === 0) {
      const ratio = acceptedWindow / 100;
      if (ratio > 0.5) alpha = clamp(alpha * 0.95, 0.8, 0.999);
      else if (ratio < 0.1) alpha = clamp(alpha * 1.05, 0.8, 0.999);
      acceptedWindow = 0;
    }

    temperature *= alpha;
  }
  return { history, finalLength: best.length };
}

function runScatter(matrix, params, seed) {
  const rng = createSeededRandom(seed);
  const refSize = clamp(Math.round(params.pa * params.nests), 6, Math.min(40, params.nests));
  const mutationRate = clamp(params.alpha * 0.5, 0.05, 0.45);
  const localSteps = clamp(Math.round(params.beta), 2, 30);
  const maxNoImprove = Math.max(5, Math.floor(params.maxIter * 0.25));
  let population = buildInitialPopulation(params.nests, matrix, rng, 5);
  let refSet = buildRefSet(population, refSize);
  let best = cloneSolution(pickBest(refSet));
  const history = [best.length];
  let noImprove = 0;

  for (let iteration = 1; iteration <= params.maxIter && noImprove < maxNoImprove; iteration += 1) {
    const pairs = [];
    for (let left = 0; left < refSet.length; left += 1) {
      for (let right = left + 1; right < refSet.length; right += 1) {
        pairs.push({ left, right, diversity: orderHammingDistance(refSet[left].order, refSet[right].order) });
      }
    }
    pairs.sort((a, b) => b.diversity - a.diversity);
    const children = [];
    for (const pair of pairs.slice(0, 28)) {
      const first = refSet[pair.left];
      const second = refSet[pair.right];
      const orders = [
        mutateOrder(orderedCrossover(first.order, second.order, rng), rng, mutationRate),
        mutateOrder(orderedCrossover(second.order, first.order, rng), rng, mutationRate),
        mutateOrder(first.order, rng, mutationRate * 0.75)
      ];
      for (const order of orders) children.push(twoOptImprove(order, matrix, localSteps));
    }
    population = population.concat(children).sort((a, b) => a.length - b.length).slice(0, params.nests * 2);
    refSet = buildRefSet(population, refSize);
    const iterationBest = pickBest(refSet);
    if (iterationBest.length < best.length - EPS) {
      best = cloneSolution(iterationBest);
      noImprove = 0;
    } else {
      noImprove += 1;
    }
    history.push(best.length);
  }
  return { history, finalLength: best.length };
}

function runCuckoo(matrix, params, seed) {
  const rng = createSeededRandom(seed);
  const levyBeta = clamp(params.beta, 1.1, 1.99);
  const abandonCount = Math.max(1, Math.floor(params.pa * params.nests));
  const baseLocalMoves = clamp(Math.round(5 + params.alpha * 24), 5, 16);
  let nests = buildInitialPopulation(params.nests, matrix, rng, 5);
  let best = cloneSolution(pickBest(nests));
  const history = [best.length];

  for (let iteration = 1; iteration <= params.maxIter; iteration += 1) {
    for (let index = 0; index < nests.length; index += 1) {
      const source = nests[index];
      let candidateOrder =
        rng() < 0.45 ? orderedCrossover(source.order, best.order, rng) : source.order.slice();

      const levyStep = Math.abs(levyVector(levyBeta, 1, rng)[0]);
      const mutationCount = clamp(Math.round(1 + levyStep * 4), 1, 18);
      if (rng() < 0.3) candidateOrder = doubleBridgeKick(candidateOrder, rng);
      for (let step = 0; step < mutationCount; step += 1) {
        candidateOrder = createNeighbor(candidateOrder, rng);
      }

      const candidate = twoOptImprove(
        candidateOrder,
        matrix,
        clamp(baseLocalMoves + Math.floor(mutationCount / 3), baseLocalMoves, 24)
      );
      const targetIndex = randomInt(rng, 0, nests.length - 1);
      if (candidate.length < nests[targetIndex].length - EPS) nests[targetIndex] = candidate;
    }

    const worst = nests.map((nest, index) => ({ nest, index })).sort((a, b) => b.nest.length - a.nest.length).slice(0, abandonCount);
    for (const item of worst) {
      const replacementBase = rng() < 0.7 ? best.order : randomOrder(matrix.length, rng);
      nests[item.index] = buildCandidateFromOrder(replacementBase, matrix, rng, {
        trials: 3,
        moveStrength: clamp(Math.round(3 + params.alpha * 30), 3, 10),
        localMoves: baseLocalMoves + 2,
        kickProbability: 0.65
      });
    }

    const iterationBest = pickBest(nests);
    if (iterationBest.length < best.length - EPS) best = cloneSolution(iterationBest);
    history.push(best.length);
  }
  return { history, finalLength: best.length };
}

const RUNNERS = { ga_tabu: runGaTabu, annealing: runAnnealing, scatter: runScatter, cuckoo: runCuckoo };

function runScenario(scenario, seed, matrix) {
  const outcome = RUNNERS[scenario.key](matrix, scenario.params, seed);
  const initialLength = outcome.history[0];
  const finalLength = outcome.finalLength;
  return {
    seed,
    initialLength,
    finalLength,
    iterations: outcome.history.length - 1,
    gapPercent: ((finalLength - BERLIN52_OPTIMAL) / BERLIN52_OPTIMAL) * 100,
    improvementPercent: ((initialLength - finalLength) / initialLength) * 100,
    firstGap5: firstIterationAtGap(outcome.history, 5),
    firstGap1: firstIterationAtGap(outcome.history, 1),
    milestones: sampleMilestones(outcome.history),
    history: outcome.history
  };
}

function summarizeScenarioRuns(scenario, runs) {
  const finals = runs.map((run) => run.finalLength);
  const milestoneMedians = [0, 1, 2, 3, 4].map((index) => ({
    fraction: runs[0].milestones[index].fraction,
    medianLength: median(runs.map((run) => run.milestones[index].length)),
    medianGapPercent: median(runs.map((run) => run.milestones[index].gapPercent))
  }));
  const gap5 = runs.map((run) => run.firstGap5).filter((value) => value !== null);
  const gap1 = runs.map((run) => run.firstGap1).filter((value) => value !== null);
  return {
    key: scenario.key,
    name: scenario.name,
    params: scenario.params,
    runs,
    summary: {
      bestFinal: Math.min(...finals),
      medianFinal: median(finals),
      worstFinal: Math.max(...finals),
      averageFinal: average(finals),
      medianGapPercent: median(runs.map((run) => run.gapPercent)),
      averageGapPercent: average(runs.map((run) => run.gapPercent)),
      medianImprovementPercent: median(runs.map((run) => run.improvementPercent)),
      averageIterations: average(runs.map((run) => run.iterations)),
      exactHits: runs.filter((run) => run.finalLength <= BERLIN52_OPTIMAL).length,
      gap1Hits: runs.filter((run) => run.gapPercent <= 1).length,
      gap5Hits: runs.filter((run) => run.gapPercent <= 5).length,
      medianFirstGap5: gap5.length ? median(gap5) : null,
      medianFirstGap1: gap1.length ? median(gap1) : null,
      milestoneMedians
    }
  };
}

function runBerlin52Benchmark(options = {}) {
  const seeds = options.seeds || DEFAULT_SEEDS;
  const scenarios = options.scenarios || ALGORITHM_SCENARIOS;
  const matrix = buildDistanceMatrix(BERLIN52);
  return scenarios.map((scenario) => summarizeScenarioRuns(scenario, seeds.map((seed) => runScenario(scenario, seed, matrix))));
}

function buildJsonReport(results, seeds) {
  return {
    generatedAt: new Date().toISOString(),
    dataset: { name: "Berlin52", cityCount: BERLIN52.length, edgeWeightType: "EUC_2D", optimalTourLength: BERLIN52_OPTIMAL },
    seeds,
    results
  };
}

function buildCsvReport(results) {
  const header = ["algorithm", "seed", "initialLength", "finalLength", "gapPercent", "improvementPercent", "iterations", "firstGap5", "firstGap1"];
  const rows = [];
  for (const result of results) {
    for (const run of result.runs) rows.push({ algorithm: result.name, seed: run.seed, initialLength: run.initialLength, finalLength: run.finalLength, gapPercent: run.gapPercent, improvementPercent: run.improvementPercent, iterations: run.iterations, firstGap5: run.firstGap5 ?? "", firstGap1: run.firstGap1 ?? "" });
  }
  return [header.join(","), ...rows.map((row) => header.map((key) => csvEscape(row[key])).join(","))].join("\n");
}

function buildMarkdownReport(results, seeds) {
  const lines = [
    "# Berlin52 Convergence Summary",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Seeds: \`${seeds.join(", ")}\``,
    "",
    `Benchmark: \`Berlin52\`, \`EUC_2D\`, optimum \`${BERLIN52_OPTIMAL}\`.`,
    "",
    "## Final quality",
    "",
    "| Algorithm | Best final | Median final | Worst final | Median gap | <=5% gap hits | <=1% gap hits | Exact hits |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];
  for (const result of results) lines.push(`| ${result.name} | ${formatNumber(result.summary.bestFinal)} | ${formatNumber(result.summary.medianFinal)} | ${formatNumber(result.summary.worstFinal)} | ${formatNumber(result.summary.medianGapPercent)}% | ${result.summary.gap5Hits}/${result.runs.length} | ${result.summary.gap1Hits}/${result.runs.length} | ${result.summary.exactHits}/${result.runs.length} |`);
  lines.push("", "## Milestones", "", "| Algorithm | 0% | 25% | 50% | 75% | 100% |", "| --- | ---: | ---: | ---: | ---: | ---: |");
  for (const result of results) lines.push(`| ${result.name} | ${result.summary.milestoneMedians.map((item) => formatNumber(item.medianLength)).join(" | ")} |`);
  lines.push("", "## Notes", "", "- Histories keep best-so-far and are monotonic non-increasing.", "- GA+Tabu mirrors the project idea: GA stage first, then multi-start Tabu refinement.", "- This is a separate headless TSP benchmark and does not change the current browser visualization.");
  return `${lines.join("\n")}\n`;
}

module.exports = {
  BERLIN52,
  BERLIN52_OPTIMAL,
  DEFAULT_SEEDS,
  ALGORITHM_SCENARIOS,
  formatNumber,
  buildJsonReport,
  buildCsvReport,
  buildMarkdownReport,
  runBerlin52Benchmark
};
