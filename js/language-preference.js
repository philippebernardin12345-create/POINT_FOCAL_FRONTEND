(function persistPointFocalLanguage() {
  "use strict";
  const key = "pointfocal-language";
  const supported = ["fr", "en", "es", "pt", "ar", "hi"];

  function normalize(value) {
    const language = String(value || "").toLowerCase().split(/[-_]/)[0];
    return supported.includes(language) ? language : null;
  }

  function readPreference() {
    try {
      const saved = normalize(localStorage.getItem(key));
      if (saved) return saved;
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const fromAccount = normalize(user && (user.language || user.preferredLanguage || user.locale));
      if (fromAccount) {
        localStorage.setItem(key, fromAccount);
        return fromAccount;
      }
    } catch (error) {}
    return "fr";
  }

  function savePreference(value) {
    const language = normalize(value);
    if (!language) return;
    try { localStorage.setItem(key, language); } catch (error) {}
    document.dispatchEvent(new CustomEvent("pointfocal:language-change", { detail: { language: language } }));
  }

  const selector = document.querySelector("[data-language-preference]");
  if (selector) {
    selector.value = readPreference();
    selector.addEventListener("change", function () {
      savePreference(selector.value);
    });
  } else {
    readPreference();
  }

  window.pointFocalLanguage = { get: readPreference, set: savePreference };
})();
