(function attachPointFocalAccess(root) {
  function isTrue(value) {
    return value === true
      || value === 1
      || String(value).toLowerCase() === "true";
  }

  function canAccessDashboard(user) {
    if (!user) {
      return false;
    }

    const invitationCode = String(
      user.invitationCode || user.invitation_code || ""
    ).trim();

    if (!invitationCode) {
      return false;
    }

    const linkActive = isTrue(
      user.linkActive !== undefined ? user.linkActive : user.link_active
    );

    if (linkActive) {
      return true;
    }

    const isLeader = isTrue(
      user.isLeader !== undefined ? user.isLeader : user.is_leader
    );
    const isPrelaunchLeader = isTrue(
      user.isPrelaunchLeader !== undefined
        ? user.isPrelaunchLeader
        : user.is_prelaunch_leader
    );

    /*
     * /auth/me is the source of truth. The backend sets this marker only
     * for a qualified launch leader and clears it after NORMAL_OPERATION.
     */
    return isLeader && isPrelaunchLeader;
  }

  root.PointFocalAccess = { canAccessDashboard };

  if (typeof module === "object" && module.exports) {
    module.exports = { canAccessDashboard };
  }
})(typeof window !== "undefined" ? window : globalThis);
