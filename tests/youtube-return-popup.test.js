const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "popup-youtube.html"), "utf8");
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(inlineScript, "popup inline script must exist");

function createElement() {
  const listeners = {};
  const classes = new Set();

  return {
    disabled: true,
    innerText: "",
    style: {},
    listeners,
    classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      contains(name) { return classes.has(name); }
    },
    addEventListener(name, callback) {
      listeners[name] = callback;
    }
  };
}

function createHarness(videoStates) {
  const elements = {
    timer: createElement(),
    btnWatch: createElement(),
    btnContinue: createElement()
  };
  const windowListeners = {};
  const documentListeners = {};
  let intervalCallback = null;
  let intervalCleared = false;
  let requestIndex = 0;
  let currentState = false;

  const window = {
    location: {
      href: "",
      replace(url) { this.replaced = url; }
    },
    addEventListener(name, callback) {
      windowListeners[name] = callback;
    }
  };

  const document = {
    hidden: false,
    getElementById(id) { return elements[id]; },
    addEventListener(name, callback) {
      documentListeners[name] = callback;
    }
  };

  const localStorage = {
    getItem(key) {
      return key === "token" ? "test-token" : null;
    }
  };
  const sessionValues = {};
  const sessionStorage = {
    setItem(key, value) { sessionValues[key] = value; }
  };

  const context = {
    document,
    window,
    localStorage,
    sessionStorage,
    console,
    fetch: async () => {
      currentState = videoStates[Math.min(requestIndex, videoStates.length - 1)];
      requestIndex++;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: { isCompleted: currentState }
        })
      };
    },
    setInterval(callback) {
      intervalCallback = callback;
      return 1;
    },
    clearInterval() {
      intervalCleared = true;
    }
  };

  vm.runInNewContext(inlineScript[1], context, {
    filename: "popup-youtube-inline.js"
  });

  return {
    elements,
    window,
    windowListeners,
    documentListeners,
    sessionValues,
    init: () => vm.runInContext("popupInitPromise", context),
    tickCountdown(times) {
      for (let index = 0; index < times; index++) intervalCallback();
    },
    intervalWasCleared: () => intervalCleared
  };
}

test("avant la validation, le compte à rebours débloque uniquement le bouton vidéo", async () => {
  const app = createHarness([false]);
  await app.init();

  assert.equal(app.elements.btnWatch.disabled, true);
  assert.equal(app.elements.btnContinue.disabled, true);
  assert.match(app.elements.timer.innerText, /10 secondes|10s/);

  app.tickCountdown(10);

  assert.equal(app.elements.btnWatch.disabled, false);
  assert.equal(app.elements.btnWatch.classList.contains("active"), true);
  assert.equal(app.elements.btnContinue.disabled, true);

  app.elements.btnWatch.listeners.click({ preventDefault() {} });
  assert.equal(app.window.location.href, "./video.html");
  assert.equal(app.sessionValues.popupYoutubeOk, "true");
});

test("si la séance est déjà validée, pas de compte à rebours et continuer ouvre la provision", async () => {
  const app = createHarness([true, true]);
  await app.init();

  assert.doesNotMatch(app.elements.timer.innerText, /10s|10 secondes|Attente obligatoire/);
  assert.equal(app.elements.btnWatch.disabled, true);
  assert.equal(app.elements.btnContinue.disabled, false);
  assert.equal(app.elements.btnContinue.classList.contains("active"), true);

  await app.elements.btnContinue.listeners.click({ preventDefault() {} });

  assert.equal(app.window.location.href, "./provision.html");
});

test("au retour sur le pop-up, la validation serveur active Continuer et désactive la vidéo", async () => {
  const app = createHarness([false, true, true]);
  await app.init();

  assert.equal(app.elements.btnContinue.disabled, true);

  await app.windowListeners.focus();

  assert.equal(app.intervalWasCleared(), true);
  assert.doesNotMatch(app.elements.timer.innerText, /10s|Attente obligatoire/);
  assert.equal(app.elements.btnWatch.disabled, true);
  assert.equal(app.elements.btnContinue.disabled, false);

  await app.elements.btnContinue.listeners.click({ preventDefault() {} });

  assert.equal(app.window.location.href, "./provision.html");
});
