(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PointFocalOpportunityDashboard = api;
  }
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  function numericOrder(value) {
    if (value === null || value === undefined || value === "") {
      return Number.POSITIVE_INFINITY;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : Number.POSITIVE_INFINITY;
  }

  function getProgressModel(opportunities) {
    const active = (Array.isArray(opportunities) ? opportunities : [])
      .filter((opportunity) =>
        String(opportunity.status || "").toLowerCase() === "active"
      )
      .slice()
      .sort((a, b) =>
        numericOrder(a.position) - numericOrder(b.position)
        || numericOrder(a.priority) - numericOrder(b.priority)
        || String(a.id || "").localeCompare(String(b.id || ""))
      );

    const isJoined = (opportunity) =>
      String(opportunity.user_opportunity_status || "").toLowerCase() === "active";

    const joinedCount = active.filter(isJoined).length;
    const nextOpportunity = active.find((opportunity) => !isJoined(opportunity)) || null;

    return {
      opportunities: active,
      joinedCount,
      totalCount: active.length,
      progressPercent: active.length
        ? Math.round((joinedCount / active.length) * 100)
        : 0,
      nextOpportunity
    };
  }

  return { getProgressModel };
});
