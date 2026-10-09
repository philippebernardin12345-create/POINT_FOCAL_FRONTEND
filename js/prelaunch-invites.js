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
      fr: ["Espace Administrateur", "Gérer les invitations de prélancement.", "Gérer les invitations"],
      en: ["Administrator area", "Manage prelaunch invitations.", "Manage invitations"],
      es: ["Espacio de administración", "Gestionar las invitaciones de prelanzamiento.", "Gestionar invitaciones"],
      pt: ["Área de administração", "Gerir os convites de pré-lançamento.", "Gerir convites"],
      ar: ["مساحة الإدارة", "إدارة دعوات ما قبل الإطلاق.", "إدارة الدعوات"],
      hi: ["प्रशासक क्षेत्र", "प्रीलॉन्च आमंत्रण प्रबंधित करें।", "आमंत्रण प्रबंधित करें"]
    };
    const [titleText, descriptionText, actionText] = labels[language] || labels.fr;

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
    link.href = "admin.html";
    link.textContent = actionText;
    card.append(title, description, link);

    const main = document.querySelector("main.main");
    if (main) main.prepend(card);
  } catch (error) {
    console.error("Lien de gestion des invitations indisponible :", error);
  }
})();
