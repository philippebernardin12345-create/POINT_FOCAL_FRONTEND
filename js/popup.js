// js/popup.js
import { apiCall } from './api.js';
import { navigateTo } from './app.js';
import { applyTranslations } from './i18n.js';

let countdown = 10;
let timerInterval = null;
let isProcessing = false;

export function initPopup() {
  const btn = document.getElementById('popup-validate-btn');
  const display = document.getElementById('countdown-display');

  // 1. Notifier le backend que le popup est affiché
  apiCall('/api/popup/start', { method: 'POST' })
    .then(res => console.log('Popup démarré:', res))
    .catch(err => console.warn('Erreur popup start:', err));

  // 2. Démarrer le chronomètre
  timerInterval = setInterval(() => {
    countdown -= 1;
    if (display) display.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(timerInterval);
      btn.disabled = false;
      btn.innerHTML = '<span data-i18n="validate">Continuer vers la vidéo</span>';
      applyTranslations(); // Re-traduit le bouton si besoin
    }
  }, 1000);

  // 3. Gestion du clic sur le bouton
  btn.addEventListener('click', handlePopupValidation);
}

async function handlePopupValidation() {
  const btn = document.getElementById('popup-validate-btn');
  if (btn.disabled || isProcessing) return;

  isProcessing = true;
  btn.disabled = true;
  btn.innerHTML = '<span data-i18n="waiting">Validation...</span>';

  try {
    // Appel backend pour valider le timer (10s)
    const response = await apiCall('/api/popup/validate', {
      method: 'POST',
      body: JSON.stringify({ clientTimestamp: Date.now() })
    });

    if (response.success) {
      // ✅ Popup validé. Vérifier si l'utilisateur a déjà vu la vidéo
      const status = await apiCall('/api/user/status');
      
      if (status.videoWatched) {
        // 🔥 RÈGLE : Skip la vidéo si déjà visionnée
        navigateTo('/dashboard');
      } else {
        navigateTo('/video');
      }
    }
  } catch (error) {
    console.error('Popup validation failed:', error);
    alert(error.message || 'Erreur lors de la validation.');
    // Réactiver le bouton si erreur (sauf si le timer est fini)
    if (countdown <= 0) {
      btn.disabled = false;
      btn.innerHTML = '<span data-i18n="validate">Continuer vers la vidéo</span>';
    } else {
      btn.disabled = true;
      btn.innerHTML = `<span data-i18n="waiting">Attendez ${countdown}s</span>`;
    }
    applyTranslations();
  } finally {
    isProcessing = false;
  }
}

// Nettoyage si l'utilisateur quitte la page avant la fin
export function cleanupPopup() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}