(function initializePointFocalPwa() {
  "use strict";
  const lang = (navigator.language || "fr").slice(0, 2).toLowerCase();
  const translations = {
    fr: ["Installer POINT FOCAL", "Nouvelle version disponible", "Recharger", "Connexion interrompue. Les actions et validations nécessitent Internet."],
    en: ["Install POINT FOCAL", "A new version is available", "Reload", "Connection lost. Actions and validations require Internet."],
    es: ["Instalar POINT FOCAL", "Hay una nueva versión", "Recargar", "Sin conexión. Las acciones y validaciones requieren Internet."],
    pt: ["Instalar POINT FOCAL", "Há uma nova versão", "Recarregar", "Sem conexão. Ações e validações exigem Internet."],
    ar: ["تثبيت POINT FOCAL", "يتوفر إصدار جديد", "إعادة التحميل", "انقطع الاتصال. تتطلب الإجراءات والتحققات اتصالاً بالإنترنت."],
    hi: ["POINT FOCAL इंस्टॉल करें", "नया संस्करण उपलब्ध है", "रीलोड करें", "कनेक्शन नहीं है। कार्रवाइयों और सत्यापन के लिए इंटरनेट आवश्यक है."]
  };
  const text = translations[lang] || translations.fr;

  function notice(message, buttonLabel, action, id) {
    const box = document.createElement("div");
    if (id) box.id = id;
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    Object.assign(box.style, {
      position: "fixed", zIndex: "2147483647", left: "12px", right: "12px",
      bottom: "12px", maxWidth: "560px", margin: "0 auto", padding: "12px 14px",
      border: "1px solid #F0B90B", borderRadius: "8px", background: "#0B0E11",
      color: "#EAECEF", font: "14px/1.4 Arial,sans-serif",
      boxShadow: "0 4px 18px rgba(0,0,0,.4)"
    });
    const label = document.createElement("span");
    label.textContent = message;
    box.appendChild(label);
    if (buttonLabel && action) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = buttonLabel;
      Object.assign(button.style, {
        marginInlineStart: "12px", padding: "8px 10px", border: "0",
        borderRadius: "6px", background: "#F0B90B", color: "#0B0E11", fontWeight: "700"
      });
      button.addEventListener("click", action);
      box.appendChild(button);
    }
    document.body.appendChild(box);
    return box;
  }

  if (!navigator.onLine) notice(text[3], null, null, "pf-offline-notice");
  window.addEventListener("offline", () => {
    if (!document.getElementById("pf-offline-notice")) {
      notice(text[3], null, null, "pf-offline-notice");
    }
  });
  window.addEventListener("online", () => document.getElementById("pf-offline-notice")?.remove());

  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  let installPrompt = null;
  let installNotice = null;
  window.addEventListener("beforeinstallprompt", (event) => {
    if (standalone) return;
    event.preventDefault();
    installPrompt = event;
    installNotice = notice(text[0], text[0], async () => {
      if (!installPrompt) return;
      const prompt = installPrompt;
      installPrompt = null;
      await prompt.prompt();
      await prompt.userChoice;
      installNotice?.remove();
      installNotice = null;
    }, "pf-install-notice");
  });
  window.addEventListener("appinstalled", () => {
    installNotice?.remove();
    installNotice = null;
    installPrompt = null;
  });

  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
  let reloadAfterUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadAfterUpdate) window.location.reload();
  });
  navigator.serviceWorker.register("/service-worker.js", { scope: "/", updateViaCache: "none" })
    .then((registration) => {
      const showUpdate = () => {
        if (!registration.waiting || !navigator.serviceWorker.controller ||
            document.getElementById("pf-update-notice")) return;
        notice(text[1], text[2], () => {
          reloadAfterUpdate = true;
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }, "pf-update-notice");
      };
      showUpdate();
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed") showUpdate();
        });
      });
      registration.update().catch(() => {});
    })
    .catch((error) => console.warn("PWA Service Worker indisponible:", error));
})();
