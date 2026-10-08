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
    const notJoined = active.filter((opportunity) => !isJoined(opportunity));
    const entryCandidates = notJoined
      .filter((opportunity) => opportunity.is_entry === true
        || String(opportunity.is_entry).toLowerCase() === "true")
      .slice()
      .sort((a, b) =>
        numericOrder(a.priority) - numericOrder(b.priority)
        || numericOrder(a.position) - numericOrder(b.position)
        || String(a.id || "").localeCompare(String(b.id || ""))
      );
    const nextOpportunity = joinedCount === 0
      ? (entryCandidates[0] || notJoined[0] || null)
      : (notJoined[0] || null);

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

  async function getContinueAction({ token, fetchImpl = fetch } = {}) {
    if (!token) {
      throw new Error("Session absente");
    }

    const headers = {
      Authorization: "Bearer " + token,
      Accept: "application/json"
    };
    const progressResponse = await fetchImpl(
      "https://point-focal.onrender.com/api/opportunities/my-progress",
      { headers }
    );
    if (!progressResponse.ok) {
      throw new Error("Impossible de charger le parcours (HTTP " + progressResponse.status + ")");
    }

    const progressPayload = await progressResponse.json();
    const opportunities = progressPayload?.data?.opportunities;
    if (!Array.isArray(opportunities)) {
      throw new Error("Réponse de progression invalide");
    }

    const model = getProgressModel(opportunities);
    if (!model.nextOpportunity) {
      return { status: "complete" };
    }

    const joined = model.opportunities.filter((opportunity) =>
      String(opportunity.user_opportunity_status || "").toLowerCase() === "active"
    );
    const isEntry = joined.length === 0;
    const endpoint = isEntry
      ? "entry"
      : "next?currentOpportunityId=" + encodeURIComponent(joined[joined.length - 1].id);
    const nextResponse = await fetchImpl(
      "https://point-focal.onrender.com/api/opportunities/" + endpoint,
      { headers }
    );
    if (!nextResponse.ok) {
      throw new Error("Impossible de charger l’étape suivante (HTTP " + nextResponse.status + ")");
    }

    const nextPayload = await nextResponse.json();
    const opportunity = nextPayload?.data;
    if (!opportunity || String(opportunity.id) !== String(model.nextOpportunity.id)) {
      throw new Error("Le parcours a changé. Rechargez le dashboard avant de continuer.");
    }

    const configuredUrls = isEntry
      ? [opportunity.entry_url, opportunity.entryUrl, opportunity.opportunity_url, opportunity.opportunityUrl]
      : [opportunity.opportunity_url, opportunity.opportunityUrl, opportunity.entry_url, opportunity.entryUrl];
    const configuredUrl = configuredUrls.find((value) =>
      typeof value === "string" && value.trim()
    );
    if (!configuredUrl) {
      return { status: "unconfigured", opportunity };
    }

    let url;
    try {
      url = new URL(configuredUrl.trim(), "https://pointfocalapp.com");
    } catch {
      return { status: "unconfigured", opportunity };
    }
    if (url.protocol !== "https:") {
      return { status: "unconfigured", opportunity };
    }

    return { status: "ready", opportunity, url: url.href };
  }

  return { getProgressModel, getContinueAction };
});
