// js/i18n.js
// Moteur de traduction pour Point Focal

let currentLang = localStorage.getItem('pointfocal_lang') || 'fr';
let translations = {};

// 1. Charge les traductions pour une langue donnée
export async function loadLocale(lang) {
    currentLang = lang;
    localStorage.setItem('pointfocal_lang', lang); // Sauvegarde le choix

    try {
        const response = await fetch(`/locales/${lang}.json`);
        if (!response.ok) throw new Error(`Langue ${lang} non trouvée`);
        translations = await response.json();
        applyTranslations(); // Applique immédiatement à la page
        return translations;
    } catch (error) {
        console.error('Erreur chargement langue:', error);
        // Fallback sur l'anglais si le fichier manque
        if (lang !== 'en') return loadLocale('en');
    }
}

// 2. Récupère une traduction par sa clé (ex: $t('welcome'))
export function $t(key) {
    return translations[key] || key; // Si clé absente, affiche la clé elle-même
}

// 3. Parcourt le DOM et remplace tous les textes avec data-i18n
export function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        // Garde le HTML à l'intérieur (pour les <strong> ou <br>)
        el.innerHTML = $t(key);
    });

    // Met à jour aussi le placeholder des inputs
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = $t(key);
    });
}

// 4. Initialise la langue au chargement de la page
export function initI18n() {
    return loadLocale(currentLang);
}