/**
 * MoneyNest — js/install-prompt.js
 * PWA install prompt: Android/Chrome FAB + iOS Safari banner.
 */
;(function () {
  'use strict';

  const DISMISS_KEY    = 'mn_install_dismissed';  // count of user dismissals
  const IOS_KEY        = 'mn_ios_banner_dismissed'; // timestamp of last iOS dismiss
  const MAX_DISMISSALS = 2;
  const IOS_COOLDOWN   = 7 * 24 * 60 * 60 * 1000; // 1 week

  let deferredPrompt = null;

  // ─── Detection helpers ────────────────────────────────────────────
  function isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  }

  function isAlreadyInstalled() {
    return localStorage.getItem('mn_app_installed') === 'true' || isStandalone();
  }

  function dismissCount() {
    return parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
  }

  function incrementDismiss() {
    localStorage.setItem(DISMISS_KEY, String(dismissCount() + 1));
  }

  // ─── Inject styles (once) ─────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('mn-install-styles')) return;
    const s = document.createElement('style');
    s.id = 'mn-install-styles';
    s.textContent = `
      /* ── Install FAB ── */
      #mnInstallFab {
        position: fixed;
        bottom: 80px;
        right: 16px;
        z-index: 8500;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 11px 18px 11px 14px;
        background: rgba(10, 14, 23, 0.88);
        border: 1.5px solid #00D4AA;
        border-radius: 99px;
        cursor: pointer;
        font-family: inherit;
        font-size: .82rem;
        font-weight: 700;
        color: #fff;
        box-shadow: 0 8px 32px rgba(0,212,170,.2), 0 2px 8px rgba(0,0,0,.4);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        animation: mnInstallIn .35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        transition: transform .15s ease, box-shadow .15s ease;
        -webkit-tap-highlight-color: transparent;
      }
      #mnInstallFab:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(0,212,170,.3), 0 4px 12px rgba(0,0,0,.4);
      }
      #mnInstallFab:active { transform: scale(.97); }
      #mnInstallFab .mn-install-icon {
        font-size: 1.1rem;
        line-height: 1;
      }
      #mnInstallFab .mn-install-dismiss {
        margin-left: 6px;
        font-size: .75rem;
        color: rgba(255,255,255,.35);
        padding: 2px 4px;
        border-radius: 4px;
        transition: color .15s;
        line-height: 1;
      }
      #mnInstallFab .mn-install-dismiss:hover { color: rgba(255,255,255,.7); }

      /* ── iOS banner ── */
      #mnIOSBanner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: rgba(10, 14, 23, 0.96);
        border-bottom: 1.5px solid rgba(0,212,170,.3);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        animation: mnInstallIn .3s ease forwards;
      }
      #mnIOSBanner .mn-ios-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: rgba(0,212,170,.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3rem;
        flex-shrink: 0;
      }
      #mnIOSBanner .mn-ios-text {
        flex: 1;
        font-size: .78rem;
        color: rgba(255,255,255,.75);
        line-height: 1.45;
      }
      #mnIOSBanner .mn-ios-text strong {
        color: #fff;
        display: block;
        font-size: .82rem;
        margin-bottom: 1px;
      }
      #mnIOSBanner .mn-ios-share {
        color: #00D4AA;
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-weight: 700;
      }
      #mnIOSBanner .mn-ios-close {
        background: none;
        border: none;
        color: rgba(255,255,255,.35);
        font-size: 1rem;
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 6px;
        flex-shrink: 0;
        font-family: inherit;
        transition: color .15s;
      }
      #mnIOSBanner .mn-ios-close:hover { color: rgba(255,255,255,.7); }

      @keyframes mnInstallIn {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes mnInstallOut {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to   { opacity: 0; transform: translateY(16px) scale(.95); }
      }
      @keyframes mnIOSOut {
        from { opacity: 1; transform: translateY(0); }
        to   { opacity: 0; transform: translateY(-100%); }
      }
    `;
    document.head.appendChild(s);
  }

  // ─── Install FAB (Android / Chrome / Edge) ────────────────────────
  function showInstallButton() {
    if (isAlreadyInstalled())            return;
    if (dismissCount() >= MAX_DISMISSALS) return;
    if (document.getElementById('mnInstallFab')) return;

    _injectStyles();

    const fab = document.createElement('button');
    fab.id = 'mnInstallFab';
    fab.setAttribute('aria-label', 'Instalar MoneyNest como app');
    fab.innerHTML = `
      <span class="mn-install-icon">⬇</span>
      <span>Instalar app</span>
      <span class="mn-install-dismiss" role="button" aria-label="Cerrar" id="mnInstallDismiss">✕</span>
    `;

    fab.addEventListener('click', async e => {
      // If user clicked the dismiss X
      if (e.target.id === 'mnInstallDismiss' || e.target.closest('#mnInstallDismiss')) {
        e.stopPropagation();
        _hideFab();
        incrementDismiss();
        return;
      }
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (outcome === 'dismissed') {
        incrementDismiss();
        _hideFab();
      }
      // If 'accepted', appinstalled event fires and calls hideInstallButton()
    });

    document.body.appendChild(fab);
  }

  function hideInstallButton() {
    _hideFab();
  }

  function _hideFab() {
    const fab = document.getElementById('mnInstallFab');
    if (!fab) return;
    fab.style.animation = 'mnInstallOut .25s ease forwards';
    setTimeout(() => fab.remove(), 260);
  }

  // ─── iOS Safari banner ────────────────────────────────────────────
  function _showIOSBanner() {
    if (!isIOS())          return;
    if (isStandalone())    return;

    const lastDismissed = parseInt(localStorage.getItem(IOS_KEY) || '0', 10);
    if (Date.now() - lastDismissed < IOS_COOLDOWN) return;

    if (document.getElementById('mnIOSBanner')) return;

    _injectStyles();

    const shareIcon = `<svg width="14" height="16" viewBox="0 0 14 16" fill="none" style="display:inline;vertical-align:middle;margin:0 2px" aria-hidden="true">
      <path d="M7 1v9M4 3.5L7 1l3 2.5M1 7v7h12V7" stroke="#00D4AA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    const banner = document.createElement('div');
    banner.id = 'mnIOSBanner';
    banner.setAttribute('role', 'banner');
    banner.innerHTML = `
      <div class="mn-ios-icon">💚</div>
      <div class="mn-ios-text">
        <strong>Instala MoneyNest</strong>
        Toca ${shareIcon} <span class="mn-ios-share">Compartir</span> → <strong style="color:#fff;font-weight:700">Añadir a pantalla de inicio</strong>
      </div>
      <button class="mn-ios-close" id="mnIOSClose" aria-label="Cerrar">✕</button>
    `;

    document.getElementById('mnIOSClose')?.remove(); // safety
    document.body.prepend(banner);

    document.getElementById('mnIOSClose').addEventListener('click', () => {
      banner.style.animation = 'mnIOSOut .25s ease forwards';
      setTimeout(() => banner.remove(), 260);
      localStorage.setItem(IOS_KEY, String(Date.now()));
    });
  }

  // ─── Event listeners ─────────────────────────────────────────────
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    // Small delay so the app has rendered before showing the prompt
    setTimeout(showInstallButton, 3000);
  });

  window.addEventListener('appinstalled', () => {
    hideInstallButton();
    localStorage.setItem('mn_app_installed', 'true');
  });

  // ─── Init ─────────────────────────────────────────────────────────
  function _init() {
    if (isAlreadyInstalled()) return;
    // iOS: show banner immediately (no beforeinstallprompt on Safari)
    if (isIOS()) setTimeout(_showIOSBanner, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

  // ─── Public API ──────────────────────────────────────────────────
  window.MNInstall = { showInstallButton, hideInstallButton, isStandalone };
})();
