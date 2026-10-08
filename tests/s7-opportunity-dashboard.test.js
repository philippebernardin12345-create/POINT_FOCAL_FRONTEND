const test = require("node:test");
const assert = require("node:assert/strict");
const { getProgressModel } = require("../js/opportunity-dashboard");

test("dashboard progress uses active opportunities in configured position order", () => {
  const model = getProgressModel([
    { id: "later", name: "Later", status: "ACTIVE", position: 3, priority: 1 },
    { id: "first", name: "First", status: "ACTIVE", position: 1, priority: 8,
      user_opportunity_status: "active" },
    { id: "paused", name: "Paused", status: "INACTIVE", position: 2 },
    { id: "second", name: "Second", status: "active", position: 2, priority: 3 }
  ]);

  assert.deepEqual(model.opportunities.map((item) => item.id), ["first", "second", "later"]);
  assert.equal(model.joinedCount, 1);
  assert.equal(model.totalCount, 3);
  assert.equal(model.progressPercent, 33);
  assert.equal(model.nextOpportunity.id, "second");
});

test("before enrollment, entry opportunity priority selects the common starting point", () => {
  const model = getProgressModel([
    { id: "later", name: "Later", status: "active", position: 1, priority: 9 },
    { id: "entry-low", name: "Entry low priority", status: "active", position: 2,
      priority: 5, is_entry: true },
    { id: "entry-high", name: "Entry high priority", status: "active", position: 3,
      priority: 1, is_entry: true }
  ]);

  assert.equal(model.joinedCount, 0);
  assert.equal(model.nextOpportunity.id, "entry-high");
});

test("dashboard progress shows no next opportunity after all active steps are joined", () => {
  const model = getProgressModel([
    { id: "one", status: "active", position: 1, user_opportunity_status: "active" },
    { id: "two", status: "active", position: 2, user_opportunity_status: "active" }
  ]);

  assert.equal(model.progressPercent, 100);
  assert.equal(model.nextOpportunity, null);
});

test("empty opportunity configuration does not invent a step or progress", () => {
  const model = getProgressModel([]);

  assert.deepEqual(model.opportunities, []);
  assert.equal(model.joinedCount, 0);
  assert.equal(model.totalCount, 0);
  assert.equal(model.progressPercent, 0);
  assert.equal(model.nextOpportunity, null);
});

test("dashboard markup has no hardcoded Victory opportunity or progress values", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const html = fs.readFileSync(
    path.join(__dirname, "..", "dashboard.html"),
    "utf8"
  );

  assert.doesNotMatch(html, /Victory Automatic|Victory World/);
  assert.match(html, /api\/opportunities\/my-progress/);
  assert.match(html, /js\/opportunity-dashboard\.js/);
  assert.match(html, /id="joinedOpportunities">—/);
  assert.match(html, /id="progressPercent">—/);
});
