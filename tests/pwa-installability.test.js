const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const pages = ["aide.html", "blog.html", "confirm-otp.html", "dashboard.html", "faq.html",
  "index.html", "login.html", "payment.html", "popup-youtube.html", "provision.html",
  "register.html", "reset-password.html", "victory-link.html", "victory-world.html", "video.html"];

test("manifest declares standalone install mode and valid PNG icons", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
  assert.equal(manifest.name, "POINT FOCAL");
  assert.equal(manifest.start_url, "/?source=pwa");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  for (const [file, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["icon-maskable-512.png", 512]]) {
    const icon = manifest.icons.find((item) => item.src === `/icons/${file}`);
    assert.ok(icon, `missing manifest icon ${file}`);
    assert.equal(icon.sizes, `${size}x${size}`);
    const bytes = fs.readFileSync(path.join(root, "icons", file));
    assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    assert.equal(bytes.readUInt32BE(16), size);
    assert.equal(bytes.readUInt32BE(20), size);
  }
  assert.equal(manifest.icons.find((item) => item.src.endsWith("icon-maskable-512.png")).purpose, "maskable");
});

test("every top-level page links the manifest and PWA installer", () => {
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    assert.match(html, /<link rel="manifest" href="\/manifest\.webmanifest">/, page);
    assert.match(html, /<meta name="theme-color" content="#0B0E11">/, page);
    assert.match(html, /<script src="\/js\/pwa\.js" defer><\/script>/, page);
  }
});

function loadWorker(networkFetch, offlineResponse = { offline: true }) {
  const listeners = {};
  const entries = new Map([["https://www.pointfocalapp.com/offline.html", offlineResponse]]);
  const cachedPaths = [];
  const cache = {
    addAll: async () => {},
    put: async (request, response) => {
      cachedPaths.push(new URL(request.url).pathname);
      entries.set(request.url, response);
    },
    match: async (request) => entries.get(typeof request === "string"
      ? new URL(request, "https://www.pointfocalapp.com").toString()
      : request.url) || null
  };
  const caches = {
    open: async () => cache,
    match: cache.match,
    keys: async () => ["point-focal-public-v1"],
    delete: async () => true
  };
  const self = {
    location: { origin: "https://www.pointfocalapp.com" },
    clients: { claim: async () => {} },
    addEventListener: (name, callback) => { listeners[name] = callback; },
    skipWaiting: () => {}
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, "service-worker.js"), "utf8"), {
    self, caches, URL, fetch: networkFetch, Response: { error: () => ({ error: true }) }
  });
  return { listeners, cachedPaths };
}

function request(url, { method = "GET", mode = "cors", authorization = false } = {}) {
  return {
    url: new URL(url, "https://www.pointfocalapp.com").toString(),
    method,
    mode,
    headers: { has: (name) => name.toLowerCase() === "authorization" && authorization }
  };
}

async function dispatchFetch(worker, req) {
  let responsePromise;
  worker.listeners.fetch({
    request: req,
    respondWith: (response) => { responsePromise = Promise.resolve(response); }
  });
  return responsePromise === undefined
    ? { intercepted: false }
    : { intercepted: true, response: await responsePromise };
}

test("service worker bypasses authenticated, API, POST and cross-origin requests", async () => {
  const worker = loadWorker(async () => ({ ok: true, clone() { return this; } }));
  const requests = [
    request("/dashboard.html", { mode: "navigate", authorization: true }),
    request("/api/auth/me"),
    request("https://point-focal.onrender.com/api/auth/me"),
    request("/api/video/session"),
    request("/login", { method: "POST" })
  ];
  for (const req of requests) {
    assert.equal((await dispatchFetch(worker, req)).intercepted, false);
  }
  assert.deepEqual(worker.cachedPaths, []);
});

test("online page navigation is fetched but never stored in the cache", async () => {
  const networkPage = { ok: true, page: "server response", clone() { return this; } };
  const worker = loadWorker(async () => networkPage);
  const result = await dispatchFetch(worker, request("/dashboard.html", { mode: "navigate" }));
  assert.equal(result.intercepted, true);
  assert.equal(result.response, networkPage);
  assert.deepEqual(worker.cachedPaths, []);
});

test("offline navigation returns only the generic offline page", async () => {
  const offlinePage = { offline: true };
  const worker = loadWorker(async () => { throw new Error("offline"); }, offlinePage);
  const result = await dispatchFetch(worker, request("/dashboard.html", { mode: "navigate" }));
  assert.equal(result.intercepted, true);
  assert.equal(result.response, offlinePage);
  assert.deepEqual(worker.cachedPaths, []);
});

test("only explicitly listed public icons are cached", async () => {
  const iconResponse = { ok: true, clone() { return this; } };
  const worker = loadWorker(async () => iconResponse);
  const result = await dispatchFetch(worker, request("/icons/icon-192.png"));
  assert.equal(result.intercepted, true);
  assert.equal(result.response, iconResponse);
  assert.deepEqual(worker.cachedPaths, ["/icons/icon-192.png"]);
  assert.equal((await dispatchFetch(worker, request("/js/pwa.js"))).intercepted, false);
});
