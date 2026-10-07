const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const pages = ["aide.html","blog.html","confirm-otp.html","dashboard.html","faq.html","index.html","login.html","payment.html","popup-youtube.html","provision.html","register.html","reset-password.html","victory-link.html","victory-world.html","video.html"];

test("manifest declares standalone install mode and required PNG icons", () => {
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

test("service worker excludes authenticated, API and page responses from cache", () => {
  const sw = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
  assert.match(sw, /request\.headers\.has\("authorization"\)/);
  assert.match(sw, /url\.origin !== self\.location\.origin/);
  assert.match(sw, /api\(\?:/);
  assert.match(sw, /request\.mode === "navigate"/);
  assert.match(sw, /Authenticated or personalized HTML is network-only/);
  assert.match(sw, /const STATIC_ASSETS = new Set/);
  assert.doesNotMatch(sw, /localStorage|sessionStorage|indexedDB/);
});
