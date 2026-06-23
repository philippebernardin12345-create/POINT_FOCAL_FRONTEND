// ============================================================
// POINT FOCAL — APPLICATION PRINCIPALE (SPA)
// ============================================================

// ----- IMPORTS -----
import { initI18n, loadLocale, applyTranslations, $t } from './i18n.js';
import { apiCall, setAuthToken, clearAuthToken } from './api.js';
import { initPopup, cleanupPopup } from './popup.js';
import { initVideo, cleanupVideo } from './video.js';

// ----- ÉTAT GLOBAL -----
let currentUser = null;
let currentToken = null;
let currentLang = localStorage.getItem('pointfocal_lang') || 'fr';
let currentPage = '';

// ----- ÉLÉMENTS DOM -----
const appContainer = document.getElementById('app');

// ----- FONCTIONS DE NAVIGATION -----
export function navigateTo(path, replace = false) {
  // Nettoyer les composants de la page précédente
  cleanupPage();

  // Mettre à jour l'URL
  if (replace) {
    window.history.replaceState({ path }, '', path);
  } else {
    window.history.pushState({ path }, '', path);
  }

  // Charger la nouvelle page
  loadPage(path);
}

function loadPage(path) {
  // Déterminer la page à charger
  let pageFile = '';
  let isProtected = false;

  switch (path) {
    case '/login':
      pageFile = 'login.html';
      break;
    case '/register':
      pageFile = 'register.html';
      break;
    case '/popup':
      pageFile = 'popup-youtube.html';
      isProtected = true;
      break;
    case '/video':
      pageFile = 'video.html';
      isProtected = true;
      break;
    case '/dashboard':
      pageFile = 'dashboard.html';
      isProtected = true;
      break;
    case '/victory':
      pageFile = 'victory-link.html';
      isProtected = true;
      break;
    case '/follow-me':
      pageFile = 'follow-me.html';
      isProtected = true;
      break;
    case '/support':
      pageFile = 'support.html';
      isProtected = true;
      break;
    case '/admin':
      pageFile = 'admin.html';
      isProtected = true;
      break;
    default:
      pageFile = 'dashboard.html';
      isProtected = true;
      break;
  }

  // Vérifier l'authentification si page protégée
  if (isProtected && !currentToken) {
    navigateTo('/login');
    return;
  }

  // Charger le fichier HTML
  fetch(`/pages/${pageFile}`)
    .then(response => {
      if (!response.ok) throw new Error(`Page ${pageFile} introuvable`);
      return response.text();
    })
    .then(html => {
      appContainer.innerHTML = html;
      currentPage = path;

      // Appliquer les traductions
      applyTranslations();

      // Initialiser la page spécifique
      initPage(path);
    })
    .catch(error => {
      console.error('Erreur chargement page:', error);
      appContainer.innerHTML = `<h1>Erreur 404</h1><p>Page introuvable</p>`;
    });
}

function initPage(path) {
  // Nettoyer l'ancienne page avant d'initialiser la nouvelle
  cleanupPage();

  switch (path) {
    case '/login':
      initLogin();
      break;
    case '/register':
      initRegister();
      break;
    case '/popup':
      initPopup();
      break;
    case '/video':
      initVideo();
      break;
    case '/dashboard':
      initDashboard();
      break;
    case '/victory':
      initVictory();
      break;
    case '/follow-me':
      initFollowMe();
      break;
    case '/support':
      initSupport();
      break;
    case '/admin':
      initAdmin();
      break;
    default:
      break;
  }
}

function cleanupPage() {
  // Nettoyer les composants actifs
  cleanupPopup();
  cleanupVideo();
  // Ajouter d'autres nettoyages si besoin
}

// ----- GESTION DE L'AUTHENTIFICATION -----
function initLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const response = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.token) {
        currentToken = response.token;
        currentUser = response.user;
        setAuthToken(currentToken);
        localStorage.setItem('pointfocal_token', currentToken);
        localStorage.setItem('pointfocal_user', JSON.stringify(currentUser));

        // Rediriger après connexion
        checkPostLoginRedirect();
      }
    } catch (error) {
      alert(error.message || 'Erreur de connexion');
    }
  });
}

function initRegister() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const invitationCode = document.getElementById('invitation-code').value;

    if (password !== confirmPassword) {
      alert($t('password_mismatch') || 'Les mots de passe ne correspondent pas');
      return;
    }

    try {
      const response = await apiCall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, whatsapp, password, invitationCode })
      });

      if (response.token) {
        currentToken = response.token;
        currentUser = response.user;
        setAuthToken(currentToken);
        localStorage.setItem('pointfocal_token', currentToken);
        localStorage.setItem('pointfocal_user', JSON.stringify(currentUser));

        // Après inscription → popup
        navigateTo('/popup');
      }
    } catch (error) {
      alert(error.message || 'Erreur d\'inscription');
    }
  });
}

async function checkPostLoginRedirect() {
  try {
    const status = await apiCall('/api/user/status');
    
    if (!status.isEmailVerified) {
      navigateTo('/verify-email');
      return;
    }

    if (!status.popupValidated) {
      navigateTo('/popup');
      return;
    }

    if (!status.videoWatched) {
      navigateTo('/video');
      return;
    }

    if (!status.hasPaid) {
      navigateTo('/victory');
      return;
    }

    navigateTo('/dashboard');
  } catch (error) {
    console.error('Erreur statut:', error);
    navigateTo('/dashboard');
  }
}

// ----- FONCTIONS DES PAGES PROTÉGÉES -----
async function initDashboard() {
  try {
    const data = await apiCall('/api/dashboard/stats');
    // Remplir le dashboard avec les données réelles
    document.getElementById('user-name').textContent = data.name || currentUser?.email;
    document.getElementById('invitation-code').textContent = data.invitationCode || 'N/A';
    document.getElementById('referral-count').textContent = data.referralCount || 0;
    document.getElementById('victory-link').textContent = data.victoryLink || 'Non attribué';
    document.getElementById('expires-at').textContent = data.expiresAt ? new Date(data.expiresAt).toLocaleString() : 'N/A';
  } catch (error) {
    console.error('Erreur dashboard:', error);
  }

  // Bouton déconnexion
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearAuthToken();
      localStorage.removeItem('pointfocal_token');
      localStorage.removeItem('pointfocal_user');
      currentToken = null;
      currentUser = null;
      navigateTo('/login');
    });
  }
}

function initVictory() {
  // Logique pour la page Victory
  // (sera complétée dans le Sprint 6)
}

function initFollowMe() {
  // Logique pour Follow Me
  // (sera complétée dans le Sprint 11)
}

function initSupport() {
  // Logique pour le support IA
  // (sera complétée dans le Sprint 12)
}

function initAdmin() {
  // Logique pour l'admin
  // (sera complétée dans le Sprint 12)
}

// ----- GESTION DE LA LANGUE -----
export function setLanguage(lang) {
  loadLocale(lang);
  currentLang = lang;
  applyTranslations();

  // Mettre à jour le sélecteur de langue
  document.querySelectorAll('[data-lang-selector]').forEach(el => {
    el.classList.toggle('active', el.dataset.lang === lang);
  });
}

// ----- INITIALISATION DE L'APPLICATION -----
export async function initApp() {
  // 1. Récupérer le token et l'utilisateur depuis localStorage
  const token = localStorage.getItem('pointfocal_token');
  const userJson = localStorage.getItem('pointfocal_user');

  if (token && userJson) {
    currentToken = token;
    currentUser = JSON.parse(userJson);
    setAuthToken(token);
  }

  // 2. Initialiser la langue
  await initI18n();

  // 3. Gérer la route initiale
  const path = window.location.pathname || '/';
  if (currentToken && currentUser) {
    // Rediriger selon l'étape du parcours
    await checkPostLoginRedirect();
  } else {
    navigateTo('/login', true);
  }

  // 4. Écouter les changements d'URL (back/forward)
  window.addEventListener('popstate', (event) => {
    const path = event.state?.path || '/';
    loadPage(path);
  });
}

// ----- EXPOSITION GLOBALE (pour les appels depuis HTML) -----
window.navigateTo = navigateTo;
window.setLanguage = setLanguage;
window.$t = $t;

// ----- DÉMARRAGE -----
document.addEventListener('DOMContentLoaded', initApp);