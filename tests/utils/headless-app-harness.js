const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const APP_PATH = path.resolve(__dirname, "..", "..", "app.js");

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

function createSeededMath(seed) {
  const seededMath = {};
  for (const key of Object.getOwnPropertyNames(Math)) seededMath[key] = Math[key];
  seededMath.random = createSeededRandom(seed);
  return seededMath;
}

class MockClassList {
  constructor() {
    this.flags = new Set();
  }

  add(name) {
    this.flags.add(name);
  }

  remove(name) {
    this.flags.delete(name);
  }

  toggle(name, force) {
    const enabled = force === undefined ? !this.flags.has(name) : Boolean(force);
    if (enabled) this.flags.add(name);
    else this.flags.delete(name);
    return enabled;
  }

  contains(name) {
    return this.flags.has(name);
  }
}

class MockElement {
  constructor(id = "") {
    this.id = id;
    this.value = "";
    this.disabled = false;
    this.style = {};
    this.dataset = {};
    this.listeners = new Map();
    this.classList = new MockClassList();
    this.children = [];
    this._textContent = "";
    this._innerHTML = "";
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }

  dispatch(type, event = {}) {
    const handlers = this.listeners.get(type) || [];
    for (const handler of handlers) handler(event);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  prepend(child) {
    this.children.unshift(child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) this.children.splice(index, 1);
    return child;
  }

  querySelectorAll() {
    return [];
  }

  getBoundingClientRect() {
    return {
      left: 0,
      top: 0,
      width: this.width || 1,
      height: this.height || 1
    };
  }

  get lastChild() {
    return this.children[this.children.length - 1] || null;
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(value) {
    this._textContent = String(value);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
  }
}

class FlowListElement extends MockElement {
  constructor(id) {
    super(id);
    this.items = [];
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
    const matches = [...this._innerHTML.matchAll(/data-step="([^"]+)"/g)];
    this.items = matches.map((match) => {
      const item = new MockElement("li");
      item.dataset.step = match[1];
      item.classList = new MockClassList();
      return item;
    });
  }

  querySelectorAll(selector) {
    return selector === "li" ? this.items : [];
  }
}

class LogBoxElement extends MockElement {
  set innerHTML(value) {
    this._innerHTML = String(value);
    if (this._innerHTML === "") this.children = [];
  }
}

function createCanvasContext() {
  const base = {
    createImageData(width, height) {
      return { width, height, data: new Uint8ClampedArray(width * height * 4) };
    },
    createLinearGradient() {
      return {
        addColorStop() {}
      };
    },
    measureText(text) {
      return { width: String(text).length * 7 };
    }
  };

  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return () => {};
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    }
  });
}

class CanvasElement extends MockElement {
  constructor(id, width, height) {
    super(id);
    this.width = width;
    this.height = height;
    this.context = createCanvasContext();
  }

  getContext() {
    return this.context;
  }
}

function createDocument(searchWidth, searchHeight) {
  const elements = new Map();
  const defaults = {
    algorithm: "ga_tabu",
    objective: "sphere",
    speed: "340"
  };

  function createElementById(id) {
    if (id === "searchCanvas") return new CanvasElement(id, searchWidth, searchHeight);
    if (id === "chartCanvas") return new CanvasElement(id, Math.max(searchWidth, 160), 120);
    if (id === "flowList") return new FlowListElement(id);
    if (id === "logBox") return new LogBoxElement(id);
    const element = new MockElement(id);
    if (id in defaults) element.value = defaults[id];
    return element;
  }

  return {
    elements,
    createElement(tag) {
      return new MockElement(tag);
    },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, createElementById(id));
      return elements.get(id);
    }
  };
}

function clonePoint(point) {
  return point ? { x: point.x, y: point.y, fitness: point.fitness } : null;
}

function captureSnapshot(app) {
  const { controls, state } = app;
  return {
    flowPhase: state.flowPhase,
    machinePhase: state.machinePhase,
    iter: state.iter,
    best: clonePoint(state.best),
    points: state.points.map(clonePoint),
    candidates: state.candidates.map(clonePoint),
    history: [...state.history],
    algorithmState: state.algorithmState ? JSON.parse(JSON.stringify(state.algorithmState)) : null,
    statusLine: controls.statusLine.textContent,
    stopReason: controls.stopReason.textContent
  };
}

function createHarness(options = {}) {
  const {
    seed = 12345,
    searchWidth = 96,
    searchHeight = 64
  } = options;

  const document = createDocument(searchWidth, searchHeight);
  const context = {
    console,
    Float32Array,
    Uint8ClampedArray,
    Math: createSeededMath(seed),
    document,
    window: null,
    setInterval() {
      return 1;
    },
    clearInterval() {},
    Date,
    performance: { now: () => 0 }
  };
  context.window = context;
  context.globalThis = context;

  const source = `${fs.readFileSync(APP_PATH, "utf8")}
globalThis.__appExports = {
  resetSimulation,
  stepMachine,
  state,
  controls,
  objectives,
  algorithmProfiles,
  applyAlgorithmProfile,
  readParams,
  BOUNDS
};`;

  vm.createContext(context);
  vm.runInContext(source, context, { filename: "app.js" });

  const app = context.__appExports;

  function configure(params) {
    app.controls.algorithm.value = params.algorithmKey;
    app.applyAlgorithmProfile(params.algorithmKey, true);
    app.controls.objective.value = params.objectiveKey;

    if (params.nests !== undefined) app.controls.nests.value = String(params.nests);
    if (params.pa !== undefined) app.controls.pa.value = String(params.pa);
    if (params.maxIter !== undefined) app.controls.maxIter.value = String(params.maxIter);
    if (params.alpha !== undefined) app.controls.alpha.value = String(params.alpha);
    if (params.beta !== undefined) app.controls.beta.value = String(params.beta);
    if (params.speed !== undefined) app.controls.speed.value = String(params.speed);

    app.resetSimulation();
    return captureSnapshot(app);
  }

  function step() {
    app.stepMachine();
    return captureSnapshot(app);
  }

  function runUntilDone(runOptions = {}) {
    const { maxSteps = 20000, onStep } = runOptions;
    const snapshots = [captureSnapshot(app)];
    let steps = 0;

    while (app.state.flowPhase !== "done" && steps < maxSteps) {
      const snapshot = step();
      steps += 1;
      snapshots.push(snapshot);
      if (onStep) onStep(snapshot, steps);
    }

    return {
      done: app.state.flowPhase === "done",
      steps,
      snapshots,
      final: captureSnapshot(app)
    };
  }

  return {
    app,
    configure,
    step,
    runUntilDone,
    captureSnapshot: () => captureSnapshot(app)
  };
}

module.exports = {
  createHarness
};
