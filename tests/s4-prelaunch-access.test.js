const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { canAccessDashboard } = require("../js/prelaunch-access");

test("le compte racine garde accès au dashboard sans code", () => {
  assert.equal(canAccessDashboard({ isRoot: true }), true);
  assert.equal(canAccessDashboard({ is_root: true }), true);
});

test("un lien PF actif donne accès au dashboard", () => {
  assert.equal(canAccessDashboard({
    invitationCode: "ABCD1234",
    isLeader: false,
    isPrelaunchLeader: false,
    linkActive: true
  }), true);
});

test("un leader pré-lancement avec lien inactif accède au dashboard", () => {
  assert.equal(canAccessDashboard({
    invitation_code: "EFGH5678",
    is_leader: true,
    is_prelaunch_leader: true,
    link_active: false
  }), true);
});

test("un compte non leader avec code et lien inactif est refusé", () => {
  assert.equal(canAccessDashboard({
    invitationCode: "IJKL9012",
    isLeader: false,
    isPrelaunchLeader: false,
    linkActive: false
  }), false);
});

test("un leader hors prélancement avec lien inactif est refusé", () => {
  assert.equal(canAccessDashboard({
    invitationCode: "MNOP3456",
    isLeader: true,
    isPrelaunchLeader: false,
    linkActive: false
  }), false);
});

test("le marqueur seul ne suffit pas sans rôle leader", () => {
  assert.equal(canAccessDashboard({
    invitationCode: "QRST7890",
    isLeader: false,
    isPrelaunchLeader: true,
    linkActive: false
  }), false);
});

test("après transition, le lien actif autorise l'accès même sans marqueur", () => {
  assert.equal(canAccessDashboard({
    invitationCode: "UVWX1234",
    isLeader: true,
    isPrelaunchLeader: false,
    linkActive: true
  }), true);
});

test("les anciennes entrées d’administration redirigent vers le site Admin dédié", () => {
  const root = path.join(__dirname, "..");
  for (const file of ["admin.html", "prelaunch-invites.html"]) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(html, /https:\/\/admin\.pointfocalapp\.com\/dashboard-admin(?:-20261009-v3)?\.html(?:\?release=)?/);
    assert.doesNotMatch(html, /Cette page est réservée au compte racine/);
  }
});

test("login et dashboard utilisent la même règle d'accès", () => {
  const root = path.join(__dirname, "..");
  const login = fs.readFileSync(path.join(root, "login.html"), "utf8");
  const dashboard = fs.readFileSync(path.join(root, "dashboard.html"), "utf8");

  for (const html of [login, dashboard]) {
    assert.match(html, /<script src=["']js\/prelaunch-access\.js["']><\/script>/);
    assert.match(html, /PointFocalAccess\??\.canAccessDashboard\(currentUser\)/);
  }
});
