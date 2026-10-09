(async function addRootInviteShortcut() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch(
      "https://point-focal.onrender.com/api/auth/me",
      { headers: { Authorization: "Bearer " + token, Accept: "application/json" } }
    );
    if (!response.ok) return;

    const payload = await response.json();
    const user = payload.data?.user || payload.data || payload.user || payload;
    const isRoot =
      user.isRoot === true ||
      user.is_root === true ||
      String(user.is_root).toLowerCase() === "true";
    if (!isRoot) return;

    const language = String(user.language || localStorage.getItem("pointfocal-language") || "fr")
      .toLowerCase().split(/[-_]/)[0];
    const labels = {
      fr: ["Invitations de prélancement", "Créer un lien individuel pour le prochain leader invité."],
      en: ["Prelaunch invitations", "Create a personal link for the next invited leader."],
      es: ["Invitaciones de prelanzamiento", "Cree un enlace personal para el próximo líder invitado."],
      pt: ["Convites de pré-lançamento", "Crie um link pessoal para o próximo líder convidado."],
      ar: ["دعوات ما قبل الإطلاق", "أنشئ رابطًا شخصيًا للقائد المدعو التالي."],
      hi: ["प्रीलॉन्च आमंत्रण", "अगले आमंत्रित लीडर के लिए निजी लिंक बनाएं।"]
    };
    const [titleText, descriptionText] = labels[language] || labels.fr;

    const card = document.createElement("section");
    card.className = "card";
    const title = document.createElement("h2");
    title.className = "card-title";
    title.textContent = titleText;
    const description = document.createElement("p");
    description.className = "card-subtitle";
    description.textContent = descriptionText;
    description.style.margin = "8px 0 12px";
    const link = document.createElement("a");
    link.className = "btn btn-primary";
    link.href = "prelaunch-invites.html";
    link.textContent = titleText;
    card.append(title, description, link);

    const main = document.querySelector("main.main");
    if (main) main.prepend(card);
  } catch (error) {
    console.error("Lien de gestion des invitations indisponible :", error);
  }
})();
