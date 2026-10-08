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


test("continue action opens the configured entry URL from the generic entry route", async () => {
  const calls = [];
  const result = await getContinueAction({
    token: "token",
    fetchImpl: async (url) => {
      calls.push(url);
      return {
        ok: true,
        async json() {
          return url.endsWith("/my-progress")
            ? { data: { opportunities: [
                { id: "entry", status: "active", position: 2, is_entry: true }
              ] } }
            : { data: { id: "entry", entry_url: "https://entry.example/start" } };
        }
      };
    }
  });

  assert.deepEqual(calls, [
    "https://point-focal.onrender.com/api/opportunities/my-progress",
    "https://point-focal.onrender.com/api/opportunities/entry"
  ]);
  assert.equal(result.status, "ready");
  assert.equal(result.url, "https://entry.example/start");
});

test("continue action requests the step after the user's latest joined opportunity", async () => {
  const calls = [];
  const result = await getContinueAction({
    token: "token",
    fetchImpl: async (url) => {
      calls.push(url);
      return {
        ok: true,
        async json() {
          return url.endsWith("/my-progress")
            ? { data: { opportunities: [
                { id: "first", status: "active", position: 1, user_opportunity_status: "active" },
                { id: "second", status: "active", position: 2, opportunity_url: "https://step.example/join" }
              ] } }
            : { data: { id: "second", opportunity_url: "https://step.example/join" } };
        }
      };
    }
  });

  assert.equal(calls[1],
    "https://point-focal.onrender.com/api/opportunities/next?currentOpportunityId=first");
  assert.equal(result.status, "ready");
  assert.equal(result.url, "https://step.example/join");
});

test("continue action refuses to redirect when backend selection differs from the dashboard", async () => {
  await assert.rejects(
    getContinueAction({
      token: "token",
      fetchImpl: async (url) => ({
        ok: true,
        async json() {
          return url.endsWith("/my-progress")
            ? { data: { opportunities: [
                { id: "entry", status: "active", position: 1, is_entry: true }
              ] } }
            : { data: { id: "different-entry", entry_url: "https://entry.example/start" } };
        }
      })
    }),
    /parcours a changé/
  );
});

test("continue action does not redirect to an unconfigured or non-HTTPS URL", async () => {
  for (const entryUrl of [null, "javascript:alert(1)", "http://entry.example/start"]) {
    const result = await getContinueAction({
      token: "token",
      fetchImpl: async (url) => ({
        ok: true,
        async json() {
          return url.endsWith("/my-progress")
            ? { data: { opportunities: [
                { id: "entry", status: "active", position: 1, is_entry: true }
              ] } }
            : { data: { id: "entry", entry_url: entryUrl } };
        }
      })
    });
    assert.equal(result.status, "unconfigured");
  }
});
