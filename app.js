const searchCanvas = document.getElementById("searchCanvas");
const chartCanvas = document.getElementById("chartCanvas");
const searchCtx = searchCanvas.getContext("2d");
const chartCtx = chartCanvas.getContext("2d");

const controls = {
  algorithm: document.getElementById("algorithm"),
  algorithmHint: document.getElementById("algorithmHint"),
  nests: document.getElementById("nests"),
  pa: document.getElementById("pa"),
  maxIter: document.getElementById("maxIter"),
  alpha: document.getElementById("alpha"),
  beta: document.getElementById("beta"),
  objective: document.getElementById("objective"),
  speed: document.getElementById("speed"),
  speedVal: document.getElementById("speedVal"),
  startBtn: document.getElementById("startBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  stepBtn: document.getElementById("stepBtn"),
  resetBtn: document.getElementById("resetBtn"),
  statusLine: document.getElementById("statusLine"),
  stopReason: document.getElementById("stopReason"),
  iterVal: document.getElementById("iterVal"),
  bestVal: document.getElementById("bestVal"),
  bestPos: document.getElementById("bestPos"),
  phaseVal: document.getElementById("phaseVal"),
  iterBar: document.getElementById("iterBar"),
  iterProgressText: document.getElementById("iterProgressText"),
  qualityBar: document.getElementById("qualityBar"),
  qualityText: document.getElementById("qualityText"),
  plainTitle: document.getElementById("plainTitle"),
  plainText: document.getElementById("plainText"),
  hoverInfo: document.getElementById("hoverInfo"),
  flowList: document.getElementById("flowList"),
  logBox: document.getElementById("logBox"),
  nestsTitle: document.getElementById("nestsTitle"),
  nestsHint: document.getElementById("nestsHint"),
  paTitle: document.getElementById("paTitle"),
  paHint: document.getElementById("paHint"),
  maxIterTitle: document.getElementById("maxIterTitle"),
  maxIterHint: document.getElementById("maxIterHint"),
  alphaTitle: document.getElementById("alphaTitle"),
  alphaHint: document.getElementById("alphaHint"),
  betaTitle: document.getElementById("betaTitle"),
  betaHint: document.getElementById("betaHint")
};

const BOUNDS = { min: -5, max: 5 };
const EPS = 1e-12;
const MIN_STEP_MS = 80;
const MAX_STEP_MS = 1200;
const TABU_MOVE_BIN = 0.22;

const objectives = {
  sphere: {
    name: "Sphere",
    target: 1e-6,
    fn: (x, y) => x * x + y * y
  },
  rastrigin: {
    name: "Rastrigin",
    target: 1e-3,
    fn: (x, y) => {
      const twoPi = 2 * Math.PI;
      return 20 + (x * x - 10 * Math.cos(twoPi * x)) + (y * y - 10 * Math.cos(twoPi * y));
    }
  },
  ackley: {
    name: "Ackley",
    target: 1e-3,
    fn: (x, y) => {
      const sq = Math.sqrt(0.5 * (x * x + y * y));
      const trig = 0.5 * (Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * y));
      return -20 * Math.exp(-0.2 * sq) - Math.exp(trig) + Math.E + 20;
    }
  }
};

const algorithmProfiles = {
  ga_tabu: {
    hint: "ГА находит перспективные области, затем запускается мультистарт Tabu.",
    fields: {
      nests: { title: "Размер популяции N", hint: "Число решений в ГА", min: 20, max: 250, step: 1, default: 60, integer: true },
      pa: { title: "Вероятность мутации p_m", hint: "Для ГА", min: 0.01, max: 0.7, step: 0.01, default: 0.15 },
      maxIter: { title: "Поколений ГА", hint: "maxGen", min: 20, max: 1200, step: 1, default: 100, integer: true },
      alpha: { title: "Вероятность скрещивания p_c", hint: "Для ГА", min: 0.2, max: 1, step: 0.01, default: 0.85 },
      beta: { title: "Итераций Tabu на старт", hint: "Локальный лимит", min: 20, max: 1200, step: 1, default: 140, integer: true }
    }
  },
  annealing: {
    hint: "Отжиг с Метрополисом и адаптацией alpha по accept_ratio.",
    fields: {
      nests: { title: "Размер стартового пула", hint: "Из пула выбирается S0", min: 10, max: 250, step: 1, default: 40, integer: true },
      pa: { title: "Минимальная температура Tmin", hint: "Остановка по T", min: 0.000001, max: 1, step: 0.0005, default: 0.001 },
      maxIter: { title: "Максимум итераций", hint: "Лимит шагов", min: 100, max: 30000, step: 1, default: 1600, integer: true },
      alpha: { title: "Коэффициент alpha", hint: "T = alpha * T", min: 0.8, max: 0.999, step: 0.001, default: 0.96 },
      beta: { title: "Радиус соседства", hint: "Размер шага", min: 0.02, max: 2, step: 0.01, default: 0.45 }
    }
  },
  scatter: {
    hint: "Scatter Search: RefSet, subsets, recombination, local improve.",
    fields: {
      nests: { title: "Размер популяции N", hint: "Исходное множество", min: 20, max: 250, step: 1, default: 80, integer: true },
      pa: { title: "Доля RefSet (b/N)", hint: "Размер RefSet", min: 0.1, max: 0.7, step: 0.01, default: 0.25 },
      maxIter: { title: "Внешних итераций", hint: "Лимит цикла", min: 20, max: 1200, step: 1, default: 120, integer: true },
      alpha: { title: "Сигма мутации", hint: "Для потомков", min: 0.01, max: 2, step: 0.01, default: 0.35 },
      beta: { title: "Шагов лок. улучшения", hint: "Для лучших потомков", min: 2, max: 80, step: 1, default: 14, integer: true }
    }
  },
  cuckoo: {
    hint: "Cuckoo Search: Levy flights, случайная замена и abandon fraction.",
    fields: {
      nests: { title: "Число гнезд N", hint: "Размер набора гнезд", min: 15, max: 250, step: 1, default: 50, integer: true },
      pa: { title: "Вероятность обнаружения p_a", hint: "Доля худших гнезд для замены", min: 0.05, max: 0.6, step: 0.01, default: 0.25 },
      maxIter: { title: "Максимум итераций", hint: "Лимит основного цикла", min: 20, max: 2000, step: 1, default: 120, integer: true },
      alpha: { title: "Шаг Levy alpha", hint: "Масштаб Levy-полетов", min: 0.05, max: 1.2, step: 0.01, default: 0.35 },
      beta: { title: "Параметр Levy lambda", hint: "Показатель тяжелого хвоста", min: 1.1, max: 2, step: 0.05, default: 1.5 }
    }
  }
};

const flowDefinitions = {
  ga_tabu: [
    { key: "init", caption: "1) Init population", title: "Init", text: "Инициализация популяции и оценка" },
    { key: "ga_check", caption: "2) GA stop check", title: "GA check", text: "Проверка gen/maxGen" },
    { key: "ga_evolve", caption: "3) Selection+Crossover+Mutation", title: "GA evolve", text: "Формирование нового поколения" },
    { key: "seed_select", caption: "4) Select L promising areas", title: "Select areas", text: "Выбор стартов для Tabu" },
    { key: "tabu_init", caption: "5) Init Tabu run", title: "Tabu init", text: "Старт очередного запуска" },
    { key: "tabu_neighbor", caption: "6) Allowed neighbors and update", title: "Tabu step", text: "Соседи, tabu-list, аспирация" },
    { key: "finalize", caption: "7) Save best_i and global best", title: "Finalize", text: "Выбор лучшего из всех запусков" },
    { key: "done", caption: "8) Done", title: "Done", text: "Завершение" }
  ],
  annealing: [
    { key: "init", caption: "1) Init T,S,Sbest", title: "Init", text: "Инициализация отжига" },
    { key: "sa_check", caption: "2) Stop check", title: "Stop check", text: "T>Tmin and t<maxIter" },
    { key: "sa_propose", caption: "3) Generate S'", title: "Generate", text: "Генерация соседа" },
    { key: "sa_accept", caption: "4) Metropolis accept", title: "Accept", text: "Принятие по Delta и exp" },
    { key: "sa_adapt", caption: "5) Adapt alpha", title: "Adapt", text: "Адаптация по accept_ratio" },
    { key: "sa_cool", caption: "6) Cool: T=alpha*T", title: "Cool", text: "Обновление температуры" },
    { key: "done", caption: "7) Done", title: "Done", text: "Возврат S_best" }
  ],
  scatter: [
    { key: "init", caption: "1) Init P,RefSet", title: "Init", text: "Инициализация RefSet" },
    { key: "ss_check", caption: "2) Stop check", title: "Stop check", text: "iter/maxIter, noImpr" },
    { key: "ss_pick_subset", caption: "3) Pick subset", title: "Pick subset", text: "Выбор пары из RefSet" },
    { key: "ss_combine", caption: "4) Recombine+mutate", title: "Recombine", text: "Генерация потомков" },
    { key: "ss_improve", caption: "5) Local improve", title: "Improve", text: "Локальное улучшение" },
    { key: "ss_update_refset", caption: "6) Update RefSet", title: "Update", text: "Обновление RefSet и best" },
    { key: "done", caption: "7) Done", title: "Done", text: "Завершение" }
  ],
  cuckoo: [
    { key: "init", caption: "1) Init nests", title: "Init", text: "Инициализация гнезд и лучшего решения" },
    { key: "cs_check", caption: "2) Stop check", title: "Stop check", text: "Проверка iter/maxIter и target" },
    { key: "cs_flight", caption: "3) Levy flight", title: "Levy flight", text: "Генерация нового cuckoo via Levy flight" },
    { key: "cs_compare", caption: "4) Random nest compare", title: "Compare", text: "Случайное сравнение и замена" },
    { key: "cs_abandon", caption: "5) Abandon worst nests", title: "Abandon", text: "Замена части худших гнезд" },
    { key: "done", caption: "6) Done", title: "Done", text: "Завершение" }
  ]
};

const state = {
  params: null,
  points: [],
  candidates: [],
  best: null,
  iter: 0,
  progressMax: 1,
  history: [],
  machinePhase: "init",
  flowPhase: "init",
  running: false,
  timer: null,
  fieldImage: null,
  stepDelayMs: 340,
  initialBestFitness: null,
  algorithmState: null
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function formatNum(value, digits = 6) {
  if (!Number.isFinite(value)) return "-";
  if (Math.abs(value) >= 1e4 || (Math.abs(value) > 0 && Math.abs(value) < 1e-3)) return value.toExponential(3);
  return value.toFixed(digits);
}

function formatPoint(point) {
  return `[${formatNum(point.x, 3)}, ${formatNum(point.y, 3)}]`;
}

function formatSpeed(ms) {
  return `${(ms / 1000).toFixed(2)} с/шаг`;
}

function logEntry(message) {
  const row = document.createElement("p");
  row.className = "log-entry";
  const t = new Date().toLocaleTimeString("ru-RU", { hour12: false });
  row.innerHTML = `<strong>${t}</strong> ${message}`;
  controls.logBox.prepend(row);
  while (controls.logBox.children.length > 220) controls.logBox.removeChild(controls.logBox.lastChild);
}

function setStatus(text) {
  controls.statusLine.textContent = `Статус: ${text}`;
}

function setStopReason(text) {
  controls.stopReason.textContent = `Причина остановки: ${text}`;
}

function currentFlow() {
  const key = state.params ? state.params.algorithmKey : controls.algorithm.value;
  return flowDefinitions[key] || flowDefinitions.ga_tabu;
}

function renderFlowList(algorithmKey) {
  const flow = flowDefinitions[algorithmKey] || flowDefinitions.ga_tabu;
  controls.flowList.innerHTML = flow.map((item) => `<li data-step="${item.key}">${item.caption}</li>`).join("");
}

function getFlowItem(step) {
  return currentFlow().find((item) => item.key === step) || null;
}

function setPhase(step) {
  state.flowPhase = step;
  const item = getFlowItem(step);
  if (item) {
    controls.phaseVal.textContent = item.title;
    controls.plainTitle.textContent = item.title;
    controls.plainText.textContent = item.text;
  } else {
    controls.phaseVal.textContent = step;
    controls.plainTitle.textContent = step;
    controls.plainText.textContent = "Выполняется шаг";
  }
  controls.flowList.querySelectorAll("li").forEach((li) => li.classList.toggle("active", li.dataset.step === step));
}

function parseControlValue(input, spec) {
  const raw = parseFloat(input.value);
  let value = Number.isFinite(raw) ? raw : spec.default;
  value = clamp(value, spec.min, spec.max);
  if (spec.integer) value = Math.round(value);
  return value;
}

function setFieldSpec(input, titleEl, hintEl, spec, setDefault) {
  titleEl.textContent = spec.title;
  hintEl.textContent = spec.hint;
  input.min = `${spec.min}`;
  input.max = `${spec.max}`;
  input.step = `${spec.step}`;
  input.value = setDefault ? `${spec.default}` : `${parseControlValue(input, spec)}`;
}

function applyAlgorithmProfile(key, setDefaultValues = false) {
  const profile = algorithmProfiles[key];
  controls.algorithmHint.textContent = profile.hint;
  setFieldSpec(controls.nests, controls.nestsTitle, controls.nestsHint, profile.fields.nests, setDefaultValues);
  setFieldSpec(controls.pa, controls.paTitle, controls.paHint, profile.fields.pa, setDefaultValues);
  setFieldSpec(controls.maxIter, controls.maxIterTitle, controls.maxIterHint, profile.fields.maxIter, setDefaultValues);
  setFieldSpec(controls.alpha, controls.alphaTitle, controls.alphaHint, profile.fields.alpha, setDefaultValues);
  setFieldSpec(controls.beta, controls.betaTitle, controls.betaHint, profile.fields.beta, setDefaultValues);
  renderFlowList(key);
  setPhase("init");
}

function readParams() {
  const key = controls.algorithm.value;
  const profile = algorithmProfiles[key];
  return {
    algorithmKey: key,
    objectiveKey: controls.objective.value,
    nests: parseControlValue(controls.nests, profile.fields.nests),
    pa: parseControlValue(controls.pa, profile.fields.pa),
    maxIter: parseControlValue(controls.maxIter, profile.fields.maxIter),
    alpha: parseControlValue(controls.alpha, profile.fields.alpha),
    beta: parseControlValue(controls.beta, profile.fields.beta)
  };
}

function evaluateByKey(objectiveKey, point) {
  return objectives[objectiveKey].fn(point.x, point.y);
}

function evaluatePoint(point) {
  return { x: point.x, y: point.y, fitness: evaluateByKey(state.params.objectiveKey, point) };
}

function randomSolution() {
  return evaluatePoint({ x: rand(BOUNDS.min, BOUNDS.max), y: rand(BOUNDS.min, BOUNDS.max) });
}

function cloneSolution(solution) {
  return { x: solution.x, y: solution.y, fitness: solution.fitness };
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getBest(list) {
  if (!list.length) return null;
  let best = list[0];
  for (let i = 1; i < list.length; i += 1) if (list[i].fitness < best.fitness) best = list[i];
  return cloneSolution(best);
}

function gaussianRandom() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function gammaLanczos(z) {
  const p = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7
  ];

  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaLanczos(1 - z));

  let x = 0.9999999999998099;
  const shifted = z - 1;
  for (let i = 0; i < p.length; i += 1) x += p[i] / (shifted + i + 1);
  const t = shifted + p.length - 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, shifted + 0.5) * Math.exp(-t) * x;
}

function levyFlightStep(lambda) {
  const safeLambda = clamp(lambda, 1.1, 2);
  const numerator = gammaLanczos(1 + safeLambda) * Math.sin((Math.PI * safeLambda) / 2);
  const denominator = gammaLanczos((1 + safeLambda) / 2) * safeLambda * Math.pow(2, (safeLambda - 1) / 2);
  const sigma = Math.pow(numerator / Math.max(denominator, 1e-12), 1 / safeLambda);
  const u = gaussianRandom() * sigma;
  const v = gaussianRandom();
  return u / Math.pow(Math.abs(v) + 1e-12, 1 / safeLambda);
}

function randomIndex(length, except = -1) {
  if (length <= 1) return 0;
  let index = Math.floor(Math.random() * length);
  while (index === except) index = Math.floor(Math.random() * length);
  return index;
}

function levyFlightCandidate(current, best, flightScale, levyLambda) {
  const step = levyFlightStep(levyLambda) * Math.max(0.05, flightScale) * 0.18;
  const dx = Math.abs(current.x - best.x) > 0.02 ? current.x - best.x : gaussianRandom();
  const dy = Math.abs(current.y - best.y) > 0.02 ? current.y - best.y : gaussianRandom();

  return evaluatePoint({
    x: clamp(current.x + step * dx + gaussianRandom() * 0.015, BOUNDS.min, BOUNDS.max),
    y: clamp(current.y + step * dy + gaussianRandom() * 0.015, BOUNDS.min, BOUNDS.max)
  });
}

function abandonWorstNests(nests, discoveryRate, localSigma, best) {
  const ranked = nests
    .map((item, index) => ({ item, index }))
    .sort((a, b) => b.item.fitness - a.item.fitness);
  const next = nests.map((item) => cloneSolution(item));
  const replacements = [];
  const replaceCount = clamp(Math.round(discoveryRate * nests.length), 1, Math.max(1, nests.length - 1));

  for (let i = 0; i < replaceCount; i += 1) {
    const replaceIndex = ranked[i].index;
    const donorA = next[randomIndex(next.length)];
    const donorB = next[randomIndex(next.length)];
    const useRandomRestart = Math.random() < 0.3;

    const candidate = useRandomRestart
      ? randomSolution()
      : evaluatePoint({
          x: clamp(best.x + gaussianRandom() * localSigma + (donorA.x - donorB.x) * rand(-0.45, 0.45), BOUNDS.min, BOUNDS.max),
          y: clamp(best.y + gaussianRandom() * localSigma + (donorA.y - donorB.y) * rand(-0.45, 0.45), BOUNDS.min, BOUNDS.max)
        });

    next[replaceIndex] = candidate;
    replacements.push(cloneSolution(candidate));
  }

  return { nests: next, replacements };
}

function mutateCoordinates(point, mutationRate, sigma) {
  let x = point.x;
  let y = point.y;
  if (Math.random() < mutationRate) x = clamp(x + gaussianRandom() * sigma, BOUNDS.min, BOUNDS.max);
  if (Math.random() < mutationRate) y = clamp(y + gaussianRandom() * sigma, BOUNDS.min, BOUNDS.max);
  return { x, y };
}

function crossoverArithmetic(parentA, parentB) {
  const t1 = Math.random();
  const t2 = Math.random();
  return [
    { x: clamp(t1 * parentA.x + (1 - t1) * parentB.x, BOUNDS.min, BOUNDS.max), y: clamp(t1 * parentA.y + (1 - t1) * parentB.y, BOUNDS.min, BOUNDS.max) },
    { x: clamp(t2 * parentB.x + (1 - t2) * parentA.x, BOUNDS.min, BOUNDS.max), y: clamp(t2 * parentB.y + (1 - t2) * parentA.y, BOUNDS.min, BOUNDS.max) }
  ];
}

function tournamentSelect(population, size = 3) {
  let best = population[Math.floor(Math.random() * population.length)];
  for (let i = 1; i < size; i += 1) {
    const candidate = population[Math.floor(Math.random() * population.length)];
    if (candidate.fitness < best.fitness) best = candidate;
  }
  return best;
}
function evolvePopulation(population) {
  const sorted = [...population].sort((a, b) => a.fitness - b.fitness);
  const eliteCount = clamp(Math.round(sorted.length * 0.08), 1, Math.max(1, sorted.length - 2));
  const next = sorted.slice(0, eliteCount).map((item) => cloneSolution(item));

  while (next.length < sorted.length) {
    const parentA = tournamentSelect(sorted, 3);
    const parentB = tournamentSelect(sorted, 3);
    const children = Math.random() < state.params.alpha
      ? crossoverArithmetic(parentA, parentB)
      : [{ x: parentA.x, y: parentA.y }, { x: parentB.x, y: parentB.y }];

    for (let i = 0; i < children.length && next.length < sorted.length; i += 1) {
      const mutated = mutateCoordinates(children[i], state.params.pa, 0.45);
      next.push(evaluatePoint(mutated));
    }
  }

  return next;
}

function selectPromisingSeeds(population, count) {
  const sorted = [...population].sort((a, b) => a.fitness - b.fitness);
  const seeds = [];

  for (let i = 0; i < sorted.length && seeds.length < count; i += 1) {
    const candidate = sorted[i];
    if (!seeds.length || seeds.every((seed) => distance(seed, candidate) >= 0.9)) {
      seeds.push(cloneSolution(candidate));
    }
  }
  for (let i = 0; i < sorted.length && seeds.length < count; i += 1) {
    const candidate = sorted[i];
    if (seeds.every((seed) => distance(seed, candidate) >= 0.25)) {
      seeds.push(cloneSolution(candidate));
    }
  }
  if (!seeds.length && sorted.length) seeds.push(cloneSolution(sorted[0]));

  return seeds.slice(0, count);
}

function encodeMove(dx, dy) {
  return `${Math.round(dx / TABU_MOVE_BIN)}:${Math.round(dy / TABU_MOVE_BIN)}`;
}

function decayTabuList(list) {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    list[i].tenure -= 1;
    if (list[i].tenure <= 0) list.splice(i, 1);
  }
}

function addTabuMove(list, key, tenure) {
  const item = list.find((entry) => entry.key === key);
  if (item) item.tenure = tenure;
  else list.push({ key, tenure });
}

function hasTabuMove(list, key) {
  return list.some((entry) => entry.key === key);
}

function generateTabuNeighborhood(current, count, radius) {
  const neighbors = [];
  const safeRadius = Math.max(0.04, radius);

  for (let i = 0; i < count; i += 1) {
    const angle = rand(0, Math.PI * 2);
    const radial = safeRadius * (0.3 + Math.random() * 1.1);
    const dx = Math.cos(angle) * radial + gaussianRandom() * 0.15 * safeRadius;
    const dy = Math.sin(angle) * radial + gaussianRandom() * 0.15 * safeRadius;

    neighbors.push({
      point: evaluatePoint({
        x: clamp(current.x + dx, BOUNDS.min, BOUNDS.max),
        y: clamp(current.y + dy, BOUNDS.min, BOUNDS.max)
      }),
      moveKey: encodeMove(dx, dy)
    });
  }

  return neighbors;
}

function pickBestAllowedNeighbor(neighborhood, tabuList, aspirationFitness) {
  const ordered = [...neighborhood].sort((a, b) => a.point.fitness - b.point.fitness);
  for (let i = 0; i < ordered.length; i += 1) {
    const item = ordered[i];
    const tabu = hasTabuMove(tabuList, item.moveKey);
    if (!tabu || item.point.fitness < aspirationFitness - EPS) return item;
  }
  return ordered[0] || null;
}

function randomNeighbor(point, sigma) {
  const safe = Math.max(0.02, sigma);
  return evaluatePoint({
    x: clamp(point.x + gaussianRandom() * safe, BOUNDS.min, BOUNDS.max),
    y: clamp(point.y + gaussianRandom() * safe, BOUNDS.min, BOUNDS.max)
  });
}

function estimateInitialTemperature(seed, sigma) {
  let sum = 0;
  for (let i = 0; i < 20; i += 1) {
    const candidate = randomNeighbor(seed, sigma);
    sum += Math.abs(candidate.fitness - seed.fitness);
  }
  return Math.max(0.5, (sum / 20) * 2.5);
}

function dedupeSolutions(solutions, cell = 0.05) {
  const map = new Map();
  for (let i = 0; i < solutions.length; i += 1) {
    const item = solutions[i];
    const key = `${Math.round(item.x / cell)}:${Math.round(item.y / cell)}`;
    const prev = map.get(key);
    if (!prev || item.fitness < prev.fitness) map.set(key, cloneSolution(item));
  }
  return [...map.values()];
}

function buildRefSet(solutionPool, refSetSize) {
  const source = dedupeSolutions(solutionPool, 0.04).sort((a, b) => a.fitness - b.fitness);
  if (!source.length) return [];

  const target = Math.min(refSetSize, source.length);
  const eliteCount = Math.max(1, Math.floor(target / 2));
  const refSet = source.slice(0, eliteCount).map((item) => cloneSolution(item));
  const rest = source.slice(eliteCount);

  while (refSet.length < target && rest.length) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < rest.length; i += 1) {
      const candidate = rest[i];
      let minDist = Infinity;
      for (let j = 0; j < refSet.length; j += 1) minDist = Math.min(minDist, distance(candidate, refSet[j]));
      const score = minDist * 0.75 - candidate.fitness * 0.25;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    refSet.push(cloneSolution(rest.splice(bestIdx, 1)[0]));
  }

  return refSet;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function generateSubsets(refSet) {
  const pairs = [];
  for (let i = 0; i < refSet.length; i += 1) {
    for (let j = i + 1; j < refSet.length; j += 1) pairs.push([i, j]);
  }
  shuffle(pairs);
  return pairs.slice(0, 40);
}

function combinePair(parentA, parentB, mutationSigma) {
  const t = Math.random();
  const raw = [
    { x: (parentA.x + parentB.x) / 2, y: (parentA.y + parentB.y) / 2 },
    { x: 1.25 * parentA.x - 0.25 * parentB.x, y: 1.25 * parentA.y - 0.25 * parentB.y },
    { x: 1.25 * parentB.x - 0.25 * parentA.x, y: 1.25 * parentB.y - 0.25 * parentA.y },
    { x: t * parentA.x + (1 - t) * parentB.x, y: t * parentA.y + (1 - t) * parentB.y }
  ];

  return raw.map((p) =>
    evaluatePoint({
      x: clamp(p.x + gaussianRandom() * mutationSigma * 0.5, BOUNDS.min, BOUNDS.max),
      y: clamp(p.y + gaussianRandom() * mutationSigma * 0.5, BOUNDS.min, BOUNDS.max)
    })
  );
}

function localImprove(seed, localSteps, sigma) {
  let current = cloneSolution(seed);
  let best = cloneSolution(seed);
  const steps = Math.max(1, localSteps);

  for (let i = 0; i < steps; i += 1) {
    const localSigma = Math.max(0.03, sigma * (1 - i / steps));
    let improved = false;

    for (let j = 0; j < 6; j += 1) {
      const candidate = randomNeighbor(current, localSigma);
      if (candidate.fitness < current.fitness - EPS) {
        current = candidate;
        improved = true;
      }
      if (candidate.fitness < best.fitness - EPS) best = cloneSolution(candidate);
    }

    if (!improved && Math.random() < 0.2) current = randomNeighbor(current, localSigma * 0.8);
  }

  return best;
}

function mergeRefSet(refSet, children, refSetSize) {
  const before = refSet.map((item) => cloneSolution(item));
  let pool = dedupeSolutions([...refSet, ...children], 0.04);
  while (pool.length < refSetSize) pool.push(randomSolution());

  const merged = buildRefSet(pool, refSetSize);
  let replacements = 0;
  for (let i = 0; i < merged.length; i += 1) {
    const candidate = merged[i];
    const found = before.some((item) => Math.abs(item.fitness - candidate.fitness) < 1e-10 && distance(item, candidate) < 0.03);
    if (!found) replacements += 1;
  }
  return { refSet: merged, replacements };
}

function worldToScreen(point) {
  const x = ((point.x - BOUNDS.min) / (BOUNDS.max - BOUNDS.min)) * searchCanvas.width;
  const y = searchCanvas.height - ((point.y - BOUNDS.min) / (BOUNDS.max - BOUNDS.min)) * searchCanvas.height;
  return { x, y };
}

function screenToWorld(px, py) {
  const x = BOUNDS.min + (px / searchCanvas.width) * (BOUNDS.max - BOUNDS.min);
  const y = BOUNDS.min + ((searchCanvas.height - py) / searchCanvas.height) * (BOUNDS.max - BOUNDS.min);
  return { x, y };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function colorForValue(t) {
  const stops = [[15, 21, 31], [31, 73, 107], [77, 134, 129], [215, 162, 98], [207, 97, 54]];
  const p = clamp(t, 0, 1) * (stops.length - 1);
  const i = Math.floor(p);
  const k = Math.min(stops.length - 1, i + 1);
  const local = p - i;
  return [
    Math.round(lerp(stops[i][0], stops[k][0], local)),
    Math.round(lerp(stops[i][1], stops[k][1], local)),
    Math.round(lerp(stops[i][2], stops[k][2], local))
  ];
}

function rebuildFieldImage() {
  const w = searchCanvas.width;
  const h = searchCanvas.height;
  const values = new Float32Array(w * h);
  let minV = Infinity;
  let maxV = -Infinity;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const point = screenToWorld(x, y);
      const v = evaluateByKey(state.params.objectiveKey, point);
      const idx = y * w + x;
      values[idx] = v;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
  }

  const span = Math.max(maxV - minV, 1e-12);
  const image = searchCtx.createImageData(w, h);
  for (let i = 0; i < values.length; i += 1) {
    const normalized = Math.log1p(values[i] - minV) / Math.log1p(span);
    const [r, g, b] = colorForValue(normalized);
    const p = i * 4;
    image.data[p] = r;
    image.data[p + 1] = g;
    image.data[p + 2] = b;
    image.data[p + 3] = 255;
  }
  state.fieldImage = image;
}

function drawSearchCanvas() {
  if (state.fieldImage) searchCtx.putImageData(state.fieldImage, 0, 0);
  else searchCtx.clearRect(0, 0, searchCanvas.width, searchCanvas.height);

  const center = worldToScreen({ x: 0, y: 0 });
  searchCtx.strokeStyle = "rgba(255,255,255,0.4)";
  searchCtx.lineWidth = 1;
  searchCtx.beginPath();
  searchCtx.moveTo(center.x, 0);
  searchCtx.lineTo(center.x, searchCanvas.height);
  searchCtx.moveTo(0, center.y);
  searchCtx.lineTo(searchCanvas.width, center.y);
  searchCtx.stroke();

  for (let i = 0; i < state.candidates.length; i += 1) {
    const point = worldToScreen(state.candidates[i]);
    searchCtx.beginPath();
    searchCtx.strokeStyle = "rgba(244, 210, 127, 0.92)";
    searchCtx.lineWidth = 1;
    searchCtx.arc(point.x, point.y, 2.7, 0, Math.PI * 2);
    searchCtx.stroke();
  }

  for (let i = 0; i < state.points.length; i += 1) {
    const point = worldToScreen(state.points[i]);
    searchCtx.beginPath();
    searchCtx.fillStyle = "rgba(95, 178, 255, 0.93)";
    searchCtx.arc(point.x, point.y, 3.2, 0, Math.PI * 2);
    searchCtx.fill();
  }

  if (state.best) {
    const point = worldToScreen(state.best);
    searchCtx.beginPath();
    searchCtx.fillStyle = "#ffa038";
    searchCtx.arc(point.x, point.y, 6.1, 0, Math.PI * 2);
    searchCtx.fill();

    searchCtx.beginPath();
    searchCtx.strokeStyle = "rgba(255, 221, 175, 0.95)";
    searchCtx.lineWidth = 1.5;
    searchCtx.arc(point.x, point.y, 10.2, 0, Math.PI * 2);
    searchCtx.stroke();

    searchCtx.fillStyle = "rgba(255, 245, 230, 0.96)";
    searchCtx.font = "12px Consolas, monospace";
    searchCtx.fillText("X_best", point.x + 11, point.y - 8);
  }
}

function drawChartCanvas() {
  const w = chartCanvas.width;
  const h = chartCanvas.height;
  const pad = { left: 52, right: 12, top: 12, bottom: 24 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  chartCtx.clearRect(0, 0, w, h);
  const bg = chartCtx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#101722");
  bg.addColorStop(1, "#0a1019");
  chartCtx.fillStyle = bg;
  chartCtx.fillRect(0, 0, w, h);

  chartCtx.strokeStyle = "rgba(255,255,255,0.18)";
  chartCtx.strokeRect(pad.left, pad.top, plotW, plotH);
  if (!state.history.length) return;

  const transformed = state.history.map((v) => Math.log10(v + 1e-12));
  let minY = Math.min(...transformed);
  let maxY = Math.max(...transformed);
  if (Math.abs(maxY - minY) < 1e-12) {
    maxY += 1;
    minY -= 1;
  }

  chartCtx.strokeStyle = "rgba(255,255,255,0.1)";
  for (let i = 1; i <= 3; i += 1) {
    const y = pad.top + (plotH * i) / 4;
    chartCtx.beginPath();
    chartCtx.moveTo(pad.left, y);
    chartCtx.lineTo(pad.left + plotW, y);
    chartCtx.stroke();
  }

  const n = state.history.length;
  chartCtx.beginPath();
  chartCtx.lineWidth = 2;
  chartCtx.strokeStyle = "#f08b43";
  for (let i = 0; i < n; i += 1) {
    const x = pad.left + (i / Math.max(1, n - 1)) * plotW;
    const yNorm = (transformed[i] - minY) / (maxY - minY);
    const y = pad.top + plotH - yNorm * plotH;
    if (i === 0) chartCtx.moveTo(x, y);
    else chartCtx.lineTo(x, y);
  }
  chartCtx.stroke();

  const lastX = pad.left + plotW;
  const lastNorm = (transformed[n - 1] - minY) / (maxY - minY);
  const lastY = pad.top + plotH - lastNorm * plotH;
  chartCtx.beginPath();
  chartCtx.fillStyle = "#ffe2be";
  chartCtx.arc(lastX, lastY, 4, 0, Math.PI * 2);
  chartCtx.fill();

  chartCtx.fillStyle = "rgba(236, 242, 249, 0.95)";
  chartCtx.font = "12px Consolas, monospace";
  chartCtx.fillText("log10(f)", 7, 15);
  chartCtx.fillText("iter", w - 32, h - 5);
}

function refreshStats() {
  controls.iterVal.textContent = `${state.iter}`;
  controls.bestVal.textContent = state.best ? formatNum(state.best.fitness, 6) : "-";
  controls.bestPos.textContent = state.best ? formatPoint(state.best) : "-";

  const maxIter = Math.max(1, state.progressMax);
  const iterRatio = clamp(state.iter / maxIter, 0, 1);
  controls.iterBar.style.width = `${iterRatio * 100}%`;
  controls.iterProgressText.textContent = `${state.iter} / ${maxIter} (${Math.round(iterRatio * 100)}%)`;

  if (!state.best || state.initialBestFitness === null) {
    controls.qualityText.textContent = "-";
    controls.qualityBar.style.width = "0%";
    return;
  }

  const target = objectives[state.params.objectiveKey].target;
  const denom = Math.max(Math.abs(state.initialBestFitness - target), 1e-12);
  const raw = (state.initialBestFitness - state.best.fitness) / denom;
  const ratio = clamp(raw, 0, 1);
  controls.qualityBar.style.width = `${ratio * 100}%`;

  if (state.best.fitness <= target) controls.qualityText.textContent = "цель достигнута";
  else if (ratio <= 0) controls.qualityText.textContent = "без улучшения";
  else controls.qualityText.textContent = `улучшение ${Math.round(ratio * 100)}%`;
}

function refreshAll() {
  refreshStats();
  drawSearchCanvas();
  drawChartCanvas();
}

function setInputsDisabled(disabled) {
  controls.algorithm.disabled = disabled;
  controls.nests.disabled = disabled;
  controls.pa.disabled = disabled;
  controls.maxIter.disabled = disabled;
  controls.alpha.disabled = disabled;
  controls.beta.disabled = disabled;
  controls.objective.disabled = disabled;
  controls.startBtn.disabled = disabled;
  controls.stepBtn.disabled = disabled;
  controls.pauseBtn.disabled = !disabled;
}

function restartTimerIfRunning() {
  if (!state.running) return;
  if (state.timer) clearInterval(state.timer);
  state.timer = setInterval(() => stepMachine(), state.stepDelayMs);
}

function finishSimulation(reason) {
  stopAuto(false);
  setPhase("done");
  setStopReason(reason);
  setStatus("алгоритм завершен");

  if (state.best) {
    logEntry(
      `Завершение: ${reason}. Лучшее <strong>X_best=${formatPoint(state.best)}</strong>, f=<strong>${formatNum(state.best.fitness, 8)}</strong>.`
    );
  } else {
    logEntry(`Завершение: ${reason}.`);
  }

  refreshAll();
}
function initGaTabu() {
  const population = [];
  for (let i = 0; i < state.params.nests; i += 1) population.push(randomSolution());

  const best = getBest(population);
  const restartCount = clamp(Math.round(Math.sqrt(state.params.nests)), 2, 16);
  const tabuIters = Math.max(1, state.params.beta);
  const tabuTenure = clamp(Math.round(Math.sqrt(state.params.nests) * 1.7), 4, 25);

  state.algorithmState = {
    population,
    generation: 0,
    noImprove: 0,
    stallLimit: Math.max(10, Math.floor(state.params.maxIter * 0.2)),
    restartCount,
    tabuIters,
    tabuTenure,
    neighborCount: 24,
    neighborRadius: 0.9,
    seeds: [],
    seedIndex: 0,
    tabu: null,
    tabuResults: [],
    totalTabuIters: 0
  };

  state.points = population.map((item) => cloneSolution(item));
  state.candidates = [];
  state.best = best;
  state.iter = 0;
  state.progressMax = state.params.maxIter + restartCount * tabuIters;
  state.history = [state.best.fitness];
  state.initialBestFitness = state.best.fitness;
  state.machinePhase = "ga_check";
  setPhase("init");

  setStatus(`ГА init: N=${state.params.nests}, maxGen=${state.params.maxIter}, L=${restartCount}, tabuIter=${tabuIters}.`);
  logEntry(`Init GA+Tabu: N=${state.params.nests}, p_m=${state.params.pa}, p_c=${state.params.alpha}, maxGen=${state.params.maxIter}.`);
}

function initAnnealing() {
  const pool = [];
  for (let i = 0; i < state.params.nests; i += 1) pool.push(randomSolution());

  const start = getBest(pool);
  const stepSigma = Math.max(0.02, state.params.beta);
  const t0 = estimateInitialTemperature(start, stepSigma);

  state.algorithmState = {
    current: cloneSolution(start),
    best: cloneSolution(start),
    candidate: null,
    delta: 0,
    t: 0,
    temperature: t0,
    tMin: state.params.pa,
    alpha: state.params.alpha,
    interval: 100,
    acceptedWindow: 0,
    stepSigma
  };

  state.points = [cloneSolution(start)];
  state.candidates = [];
  state.best = cloneSolution(start);
  state.iter = 0;
  state.progressMax = state.params.maxIter;
  state.history = [state.best.fitness];
  state.initialBestFitness = state.best.fitness;
  state.machinePhase = "sa_check";
  setPhase("init");

  setStatus(`Отжиг init: T0=${formatNum(t0, 4)}, Tmin=${state.params.pa}, alpha=${state.params.alpha}.`);
  logEntry(`Init Annealing: pool=${state.params.nests}, maxIter=${state.params.maxIter}, radius=${state.params.beta}.`);
}

function initScatter() {
  const population = [];
  for (let i = 0; i < state.params.nests; i += 1) population.push(randomSolution());

  const refSize = clamp(Math.round(state.params.pa * state.params.nests), 6, Math.min(40, state.params.nests));
  let refSet = buildRefSet(population, refSize);
  while (refSet.length < refSize) {
    refSet.push(randomSolution());
    refSet = buildRefSet(refSet, refSize);
  }
  const best = getBest(refSet);

  state.algorithmState = {
    refSet,
    refSize,
    iter: 0,
    noImprove: 0,
    maxNoImprove: Math.max(5, Math.floor(state.params.maxIter * 0.25)),
    subsets: [],
    subsetIndex: 0,
    currentSubset: null,
    currentChildren: [],
    roundImproved: false,
    mutationSigma: Math.max(0.01, state.params.alpha),
    localSteps: Math.max(1, Math.round(state.params.beta))
  };

  state.points = refSet.map((item) => cloneSolution(item));
  state.candidates = [];
  state.best = cloneSolution(best);
  state.iter = 0;
  state.progressMax = state.params.maxIter;
  state.history = [state.best.fitness];
  state.initialBestFitness = state.best.fitness;
  state.machinePhase = "ss_check";
  setPhase("init");

  setStatus(`Scatter init: N=${state.params.nests}, b=${refSize}, maxIter=${state.params.maxIter}.`);
  logEntry(`Init Scatter: N=${state.params.nests}, b=${refSize}, sigma=${state.params.alpha}, localSteps=${state.algorithmState.localSteps}.`);
}

function initCuckoo() {
  const nests = [];
  for (let i = 0; i < state.params.nests; i += 1) nests.push(randomSolution());

  const best = getBest(nests);

  state.algorithmState = {
    nests,
    iter: 0,
    currentIndex: 0,
    targetIndex: 0,
    candidate: null,
    discoveryRate: state.params.pa,
    flightScale: Math.max(0.05, state.params.alpha),
    levyLambda: clamp(state.params.beta, 1.1, 2),
    localSigma: Math.max(0.04, state.params.alpha * 0.65)
  };

  state.points = nests.map((item) => cloneSolution(item));
  state.candidates = [];
  state.best = cloneSolution(best);
  state.iter = 0;
  state.progressMax = state.params.maxIter;
  state.history = [state.best.fitness];
  state.initialBestFitness = state.best.fitness;
  state.machinePhase = "cs_check";
  setPhase("init");

  setStatus(`Cuckoo init: N=${state.params.nests}, p_a=${state.params.pa}, alpha=${state.params.alpha}, lambda=${formatNum(state.algorithmState.levyLambda, 2)}.`);
  logEntry(`Init Cuckoo: N=${state.params.nests}, p_a=${state.params.pa}, alpha=${state.params.alpha}, lambda=${formatNum(state.algorithmState.levyLambda, 2)}.`);
}

function stepGaTabu() {
  const algo = state.algorithmState;

  switch (state.machinePhase) {
    case "ga_check": {
      setPhase("ga_check");
      if (algo.generation >= state.params.maxIter || algo.noImprove >= algo.stallLimit) {
        state.machinePhase = "seed_select";
        setStatus("ГА завершен, выбираем перспективные области.");
      } else {
        state.machinePhase = "ga_evolve";
      }
      break;
    }
    case "ga_evolve": {
      setPhase("ga_evolve");
      const prevBest = state.best.fitness;
      algo.population = evolvePopulation(algo.population);
      algo.generation += 1;
      state.iter = algo.generation + algo.totalTabuIters;

      const genBest = getBest(algo.population);
      if (genBest.fitness < state.best.fitness - EPS) {
        state.best = cloneSolution(genBest);
        algo.noImprove = 0;
      } else {
        algo.noImprove += 1;
      }

      state.points = algo.population.map((item) => cloneSolution(item));
      state.candidates = [];
      state.history.push(state.best.fitness);
      setStatus(`ГА поколение ${algo.generation}, best=${formatNum(state.best.fitness, 7)}.`);

      if (algo.generation % 5 === 0 || state.best.fitness < prevBest - EPS) {
        logEntry(`[GA gen ${algo.generation}] best=${formatNum(state.best.fitness, 7)}, noImprove=${algo.noImprove}/${algo.stallLimit}.`);
      }
      state.machinePhase = "ga_check";
      break;
    }
    case "seed_select": {
      setPhase("seed_select");
      algo.seeds = selectPromisingSeeds(algo.population, algo.restartCount);
      algo.seedIndex = 0;
      algo.tabuResults = [];
      state.points = algo.population.map((item) => cloneSolution(item));
      state.candidates = algo.seeds.map((seed) => cloneSolution(seed));
      state.machinePhase = "tabu_init";
      setStatus(`Выбрано ${algo.seeds.length} стартов для Tabu.`);
      break;
    }
    case "tabu_init": {
      setPhase("tabu_init");
      state.candidates = [];
      if (algo.seedIndex >= algo.seeds.length) {
        state.machinePhase = "finalize";
        break;
      }

      const seed = cloneSolution(algo.seeds[algo.seedIndex]);
      algo.tabu = {
        current: cloneSolution(seed),
        best: cloneSolution(seed),
        iter: 0,
        noImprove: 0,
        noImproveLimit: Math.max(12, Math.floor(algo.tabuIters * 0.3)),
        tabuMoves: []
      };
      state.points = [cloneSolution(seed)];
      setStatus(`Tabu запуск ${algo.seedIndex + 1}/${algo.seeds.length}.`);
      state.machinePhase = "tabu_neighbor";
      break;
    }
    case "tabu_neighbor": {
      setPhase("tabu_neighbor");
      const tabu = algo.tabu;

      if (tabu.iter >= algo.tabuIters || tabu.noImprove >= tabu.noImproveLimit) {
        algo.tabuResults.push(cloneSolution(tabu.best));
        if (tabu.best.fitness < state.best.fitness - EPS) state.best = cloneSolution(tabu.best);
        algo.seedIndex += 1;
        state.history.push(state.best.fitness);
        logEntry(`[Tabu ${algo.seedIndex}/${algo.seeds.length}] local best=${formatNum(tabu.best.fitness, 7)}.`);
        state.machinePhase = "tabu_init";
        break;
      }

      const radius = Math.max(0.08, algo.neighborRadius * (1 - tabu.iter / Math.max(1, algo.tabuIters)));
      const neighborhood = generateTabuNeighborhood(tabu.current, algo.neighborCount, radius);
      const chosen = pickBestAllowedNeighbor(neighborhood, tabu.tabuMoves, tabu.best.fitness);

      decayTabuList(tabu.tabuMoves);
      tabu.iter += 1;
      algo.totalTabuIters += 1;
      state.iter = algo.generation + algo.totalTabuIters;
      state.candidates = neighborhood.map((item) => cloneSolution(item.point));

      if (chosen) {
        tabu.current = cloneSolution(chosen.point);
        addTabuMove(tabu.tabuMoves, chosen.moveKey, algo.tabuTenure);
        if (chosen.point.fitness < tabu.best.fitness - EPS) {
          tabu.best = cloneSolution(chosen.point);
          tabu.noImprove = 0;
        } else {
          tabu.noImprove += 1;
        }
        if (tabu.best.fitness < state.best.fitness - EPS) state.best = cloneSolution(tabu.best);
      } else {
        tabu.noImprove += 1;
      }

      state.points = [cloneSolution(tabu.current)];
      state.history.push(state.best.fitness);
      setStatus(`Tabu ${algo.seedIndex + 1}/${algo.seeds.length}, iter ${tabu.iter}/${algo.tabuIters}.`);
      break;
    }
    case "finalize": {
      setPhase("finalize");
      const combined = [...algo.tabuResults];
      if (algo.tabu && algo.tabu.best) combined.push(cloneSolution(algo.tabu.best));
      if (combined.length) {
        const finalBest = getBest(combined);
        if (finalBest.fitness < state.best.fitness - EPS) state.best = cloneSolution(finalBest);
      }
      finishSimulation(`GA+Tabu: gen=${algo.generation}, starts=${algo.seeds.length}, tabuIters=${algo.totalTabuIters}`);
      return true;
    }
    default:
      state.machinePhase = "ga_check";
      break;
  }

  if (state.best.fitness <= objectives[state.params.objectiveKey].target) {
    finishSimulation("достигнута целевая точность");
    return true;
  }
  return false;
}

function stepAnnealing() {
  const algo = state.algorithmState;
  const objectiveTarget = objectives[state.params.objectiveKey].target;

  switch (state.machinePhase) {
    case "sa_check": {
      setPhase("sa_check");
      if (algo.t >= state.params.maxIter) {
        finishSimulation(`достигнут лимит t=${state.params.maxIter}`);
        return true;
      }
      if (algo.temperature <= algo.tMin) {
        finishSimulation(`температура <= Tmin (${formatNum(algo.tMin, 6)})`);
        return true;
      }
      if (state.best.fitness <= objectiveTarget) {
        finishSimulation("достигнута целевая точность");
        return true;
      }
      state.machinePhase = "sa_propose";
      break;
    }
    case "sa_propose": {
      setPhase("sa_propose");
      algo.t += 1;
      state.iter = algo.t;
      algo.candidate = randomNeighbor(algo.current, algo.stepSigma);
      algo.delta = algo.candidate.fitness - algo.current.fitness;
      state.candidates = [cloneSolution(algo.candidate)];
      state.points = [cloneSolution(algo.current)];
      state.machinePhase = "sa_accept";
      break;
    }
    case "sa_accept": {
      setPhase("sa_accept");
      let accepted = false;
      if (algo.delta < 0) accepted = true;
      else {
        const probability = Math.exp(-algo.delta / Math.max(algo.temperature, 1e-12));
        accepted = Math.random() < probability;
      }

      if (accepted) {
        algo.current = cloneSolution(algo.candidate);
        algo.acceptedWindow += 1;
      }
      if (algo.current.fitness < algo.best.fitness - EPS) algo.best = cloneSolution(algo.current);

      state.best = cloneSolution(algo.best);
      state.points = [cloneSolution(algo.current)];
      setStatus(`Отжиг: t=${algo.t}, Delta=${formatNum(algo.delta, 6)}, ${accepted ? "accept" : "reject"}.`);
      state.machinePhase = "sa_adapt";
      break;
    }
    case "sa_adapt": {
      setPhase("sa_adapt");
      if (algo.t % algo.interval === 0) {
        const ratio = algo.acceptedWindow / algo.interval;
        if (ratio > 0.5) algo.alpha = clamp(algo.alpha * 0.95, 0.8, 0.999);
        else if (ratio < 0.1) algo.alpha = clamp(algo.alpha * 1.05, 0.8, 0.999);
        algo.acceptedWindow = 0;
        logEntry(`[Annealing t=${algo.t}] ratio=${formatNum(ratio, 4)}, alpha=${formatNum(algo.alpha, 5)}.`);
      }
      state.machinePhase = "sa_cool";
      break;
    }
    case "sa_cool": {
      setPhase("sa_cool");
      algo.temperature = algo.alpha * algo.temperature;
      state.history.push(state.best.fitness);
      state.candidates = [];
      state.points = [cloneSolution(algo.current)];
      state.machinePhase = "sa_check";

      if (algo.t % 50 === 0) logEntry(`[Annealing] t=${algo.t}, T=${formatNum(algo.temperature, 6)}, best=${formatNum(state.best.fitness, 7)}.`);
      break;
    }
    default:
      state.machinePhase = "sa_check";
      break;
  }

  return false;
}

function stepScatter() {
  const algo = state.algorithmState;
  const objectiveTarget = objectives[state.params.objectiveKey].target;

  switch (state.machinePhase) {
    case "ss_check": {
      setPhase("ss_check");
      if (algo.iter >= state.params.maxIter) {
        finishSimulation(`достигнут лимит iter=${state.params.maxIter}`);
        return true;
      }
      if (algo.noImprove >= algo.maxNoImprove) {
        finishSimulation(`нет улучшений ${algo.noImprove} итераций подряд`);
        return true;
      }
      if (state.best.fitness <= objectiveTarget) {
        finishSimulation("достигнута целевая точность");
        return true;
      }

      algo.subsets = generateSubsets(algo.refSet);
      algo.subsetIndex = 0;
      algo.roundImproved = false;
      state.machinePhase = "ss_pick_subset";
      setStatus(`Scatter iter ${algo.iter + 1}: subsets=${algo.subsets.length}.`);
      break;
    }
    case "ss_pick_subset": {
      setPhase("ss_pick_subset");
      if (algo.subsetIndex >= algo.subsets.length) {
        algo.iter += 1;
        state.iter = algo.iter;
        if (algo.roundImproved) algo.noImprove = 0;
        else algo.noImprove += 1;
        state.history.push(state.best.fitness);
        logEntry(`[Scatter iter ${algo.iter}] best=${formatNum(state.best.fitness, 7)}, noImpr=${algo.noImprove}/${algo.maxNoImprove}.`);
        state.machinePhase = "ss_check";
        break;
      }

      algo.currentSubset = algo.subsets[algo.subsetIndex];
      const [i, j] = algo.currentSubset;
      state.candidates = [cloneSolution(algo.refSet[i]), cloneSolution(algo.refSet[j])];
      state.machinePhase = "ss_combine";
      break;
    }
    case "ss_combine": {
      setPhase("ss_combine");
      const [i, j] = algo.currentSubset;
      algo.currentChildren = combinePair(algo.refSet[i], algo.refSet[j], Math.max(0.01, algo.mutationSigma));
      algo.currentChildren.sort((a, b) => a.fitness - b.fitness);
      state.candidates = algo.currentChildren.map((item) => cloneSolution(item));
      state.machinePhase = "ss_improve";
      break;
    }
    case "ss_improve": {
      setPhase("ss_improve");
      const top = algo.currentChildren.slice(0, Math.min(3, algo.currentChildren.length));
      algo.currentChildren = top.map((child) => localImprove(child, algo.localSteps, Math.max(0.03, algo.mutationSigma)));
      algo.currentChildren.sort((a, b) => a.fitness - b.fitness);
      state.candidates = algo.currentChildren.map((item) => cloneSolution(item));
      state.machinePhase = "ss_update_refset";
      break;
    }
    case "ss_update_refset": {
      setPhase("ss_update_refset");
      const merged = mergeRefSet(algo.refSet, algo.currentChildren, algo.refSize);
      algo.refSet = merged.refSet;
      state.points = algo.refSet.map((item) => cloneSolution(item));

      const bestRef = getBest(algo.refSet);
      if (bestRef.fitness < state.best.fitness - EPS) {
        state.best = cloneSolution(bestRef);
        algo.roundImproved = true;
      }

      setStatus(merged.replacements > 0 ? `RefSet updated: ${merged.replacements}` : "RefSet unchanged");
      algo.subsetIndex += 1;
      state.candidates = [];
      state.machinePhase = "ss_pick_subset";
      break;
    }
    default:
      state.machinePhase = "ss_check";
      break;
  }

  return false;
}

function stepCuckoo() {
  const algo = state.algorithmState;
  const objectiveTarget = objectives[state.params.objectiveKey].target;

  switch (state.machinePhase) {
    case "cs_check": {
      setPhase("cs_check");
      if (algo.iter >= state.params.maxIter) {
        finishSimulation(`достигнут лимит iter=${state.params.maxIter}`);
        return true;
      }
      if (state.best.fitness <= objectiveTarget) {
        finishSimulation("достигнута целевая точность");
        return true;
      }

      algo.currentIndex = randomIndex(algo.nests.length);
      algo.targetIndex = randomIndex(algo.nests.length, algo.currentIndex);
      state.candidates = [];
      state.points = algo.nests.map((item) => cloneSolution(item));
      setStatus(`Cuckoo iter ${algo.iter + 1}: flight from nest ${algo.currentIndex + 1}.`);
      state.machinePhase = "cs_flight";
      break;
    }
    case "cs_flight": {
      setPhase("cs_flight");
      const source = algo.nests[algo.currentIndex];
      algo.candidate = levyFlightCandidate(source, state.best, algo.flightScale, algo.levyLambda);
      state.points = algo.nests.map((item) => cloneSolution(item));
      state.candidates = [cloneSolution(algo.candidate)];
      state.machinePhase = "cs_compare";
      break;
    }
    case "cs_compare": {
      setPhase("cs_compare");
      const target = algo.nests[algo.targetIndex];
      if (algo.candidate.fitness < target.fitness - EPS) {
        algo.nests[algo.targetIndex] = cloneSolution(algo.candidate);
      }

      const bestNest = getBest(algo.nests);
      if (bestNest.fitness < state.best.fitness - EPS) state.best = cloneSolution(bestNest);

      state.points = algo.nests.map((item) => cloneSolution(item));
      state.candidates = [cloneSolution(algo.candidate)];
      setStatus(`Cuckoo compare: nest ${algo.targetIndex + 1} ${algo.candidate.fitness < target.fitness - EPS ? "updated" : "kept"}.`);
      state.machinePhase = "cs_abandon";
      break;
    }
    case "cs_abandon": {
      setPhase("cs_abandon");
      const replaced = abandonWorstNests(algo.nests, algo.discoveryRate, algo.localSigma, state.best);
      algo.nests = replaced.nests;
      algo.iter += 1;

      const bestNest = getBest(algo.nests);
      if (bestNest.fitness < state.best.fitness - EPS) state.best = cloneSolution(bestNest);

      state.iter = algo.iter;
      state.points = algo.nests.map((item) => cloneSolution(item));
      state.candidates = replaced.replacements.map((item) => cloneSolution(item));
      state.history.push(state.best.fitness);
      setStatus(`Cuckoo iter ${algo.iter}: replaced ${replaced.replacements.length} nests.`);
      if (algo.iter % 10 === 0 || replaced.replacements.length) {
        logEntry(`[Cuckoo iter ${algo.iter}] best=${formatNum(state.best.fitness, 7)}, replaced=${replaced.replacements.length}.`);
      }
      state.machinePhase = "cs_check";
      break;
    }
    default:
      state.machinePhase = "cs_check";
      break;
  }

  return false;
}

function stepMachine() {
  if (!state.params) return;

  let finished = false;
  if (state.params.algorithmKey === "ga_tabu") finished = stepGaTabu();
  else if (state.params.algorithmKey === "annealing") finished = stepAnnealing();
  else if (state.params.algorithmKey === "scatter") finished = stepScatter();
  else if (state.params.algorithmKey === "cuckoo") finished = stepCuckoo();

  if (!finished) refreshAll();
}

function startAuto() {
  if (state.running) return;
  state.running = true;
  setInputsDisabled(true);
  setStatus("автоматический режим запущен");
  state.timer = setInterval(() => stepMachine(), state.stepDelayMs);
}

function stopAuto(byUser = true) {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
  if (state.running || byUser) {
    state.running = false;
    setInputsDisabled(false);
    if (byUser) setStatus("пауза");
  }
}

function resetSimulation() {
  stopAuto(false);
  state.params = readParams();
  state.stepDelayMs = clamp(parseInt(controls.speed.value, 10) || 340, MIN_STEP_MS, MAX_STEP_MS);
  controls.speedVal.textContent = formatSpeed(state.stepDelayMs);
  controls.logBox.innerHTML = "";

  state.points = [];
  state.candidates = [];
  state.best = null;
  state.iter = 0;
  state.progressMax = 1;
  state.history = [];
  state.machinePhase = "init";
  state.flowPhase = "init";
  state.initialBestFitness = null;
  state.algorithmState = null;

  renderFlowList(state.params.algorithmKey);
  setPhase("init");

  if (state.params.algorithmKey === "ga_tabu") initGaTabu();
  else if (state.params.algorithmKey === "annealing") initAnnealing();
  else if (state.params.algorithmKey === "scatter") initScatter();
  else if (state.params.algorithmKey === "cuckoo") initCuckoo();

  rebuildFieldImage();
  setStopReason("пока не завершено");
  refreshAll();
}

controls.startBtn.addEventListener("click", () => {
  if (!state.params) resetSimulation();
  startAuto();
});

controls.pauseBtn.addEventListener("click", () => stopAuto(true));

controls.stepBtn.addEventListener("click", () => {
  if (!state.params) resetSimulation();
  if (state.running) stopAuto(true);
  stepMachine();
});

controls.resetBtn.addEventListener("click", () => resetSimulation());

controls.speed.addEventListener("input", () => {
  state.stepDelayMs = clamp(parseInt(controls.speed.value, 10) || 340, MIN_STEP_MS, MAX_STEP_MS);
  controls.speedVal.textContent = formatSpeed(state.stepDelayMs);
  restartTimerIfRunning();
});

controls.algorithm.addEventListener("change", () => {
  applyAlgorithmProfile(controls.algorithm.value, true);
  if (!state.running) resetSimulation();
});

[controls.nests, controls.pa, controls.maxIter, controls.alpha, controls.beta, controls.objective].forEach((el) => {
  el.addEventListener("change", () => {
    if (!state.running) setStatus('параметры изменены, нажмите "Сброс"');
  });
});

searchCanvas.addEventListener("mousemove", (event) => {
  const rect = searchCanvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (searchCanvas.width / rect.width);
  const y = (event.clientY - rect.top) * (searchCanvas.height / rect.height);
  if (x < 0 || y < 0 || x > searchCanvas.width || y > searchCanvas.height) return;

  const world = screenToWorld(x, y);
  const objectiveKey = state.params ? state.params.objectiveKey : controls.objective.value;
  const value = evaluateByKey(objectiveKey, world);
  controls.hoverInfo.textContent = `Курсор: x=${formatNum(world.x, 3)}, y=${formatNum(world.y, 3)}, f(x,y)=${formatNum(value, 6)}`;
});

searchCanvas.addEventListener("mouseleave", () => {
  controls.hoverInfo.textContent = "Курсор: наведите мышь на поле";
});

applyAlgorithmProfile(controls.algorithm.value, true);
resetSimulation();
