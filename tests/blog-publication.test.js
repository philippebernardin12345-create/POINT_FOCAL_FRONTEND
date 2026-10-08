const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const blog = fs.readFileSync(path.join(root, "blog.html"), "utf8");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");

test("blog has valid publication metadata and no malformed CSS separator", () => {
  assert.match(blog, /<html lang="fr">/);
  assert.match(blog, /<title>Blog Point Focal/);
  assert.match(blog, /name="description"/);
  assert.match(blog, /rel="canonical" href="https:\/\/www\.pointfocalapp\.com\/blog\.html"/);
  assert.doesNotMatch(blog, /^~{10,}$/m);
  assert.match(blog, /application\/ld\+json/);
});

test("blog cards lead to complete, dated articles", () => {
  const articles = [
    "pourquoi-point-focal",
    "lien-unique",
    "suivre-progression"
  ];

  for (const id of articles) {
    assert.match(blog, new RegExp('href="#' + id + '"'));
    assert.match(blog, new RegExp('<article class="post" id="' + id + '">'));
    assert.match(blog, new RegExp('<time datetime="2026-10-09">'));
  }
  assert.match(blog, /Aucune adresse|adresse de démarrage/);
  assert.match(blog, /ne constitue pas une promesse de gain/);
});

test("the public home page links to the blog and crawlers can find it", () => {
  assert.match(home, /href="blog\.html">Découvrir le blog Point Focal/);
  assert.match(sitemap, /https:\/\/www\.pointfocalapp\.com\/blog\.html/);
  assert.match(robots, /Sitemap: https:\/\/www\.pointfocalapp\.com\/sitemap\.xml/);
});
