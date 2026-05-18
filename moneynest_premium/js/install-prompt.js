/**
 * MoneyNest — js/install-prompt.js
 * PWA install prompts for Android (top banner), Desktop (modal), iOS (bottom banner).
 */
;(function () {
  'use strict';

  const ANDROID_DISMISS_KEY = 'mn_install_dismissed_at';
  const IOS_DISMISS_KEY     = 'mn_ios_dismissed_at';
  const INSTALLED_KEY       = 'mn_app_installed';
  const COOLDOWN_7D  = 7  * 24 * 60 * 60 * 1000;
  const COOLDOWN_14D = 14 * 24 * 60 * 60 * 1000;

  let deferredPrompt = null;

  // ─── Guards ───────────────────────────────────────────────────────
  function isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }

  function isInstalled() {
    return isStandalone() || localStorage.getItem(INSTALLED_KEY) === 'true';
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  }

  function isDesktop() {
    return !isIOS() && !/android/i.test(navigator.userAgent) && window.innerWidth >= 768;
  }

  // ─── Inject styles (once) ─────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('mn-install-css')) return;
    const s = document.createElement('style');
    s.id = 'mn-install-css';
    s.textContent = `
      /* ══ Android top banner ══════════════════════════════════════ */
      #mnAndroidBanner {
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 9500;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        background: #0A0E17;
        border-bottom: 1px solid rgba(0,212,170,0.3);
        box-shadow: 0 4px 24px rgba(0,0,0,.5);
        animation: mnSlideDown .3s ease forwards;
        font-family: inherit;
      }
      #mnAndroidBanner .mn-ab-icon {
        width: 38px; height: 38px;
        border-radius: 10px;
        overflow: hidden;
        flex-shrink: 0;
        background: rgba(0,212,170,.1);
        display: flex; align-items: center; justify-content: center;
      }
      #mnAndroidBanner .mn-ab-icon img { width: 100%; height: 100%; object-fit: cover; }
      #mnAndroidBanner .mn-ab-text { flex: 1; min-width: 0; }
      #mnAndroidBanner .mn-ab-title {
        font-size: .85rem; font-weight: 700; color: #fff;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      #mnAndroidBanner .mn-ab-sub {
        font-size: .72rem; color: rgba(255,255,255,.45); margin-top: 1px;
      }
      #mnAndroidBanner .mn-ab-install {
        flex-shrink: 0;
        padding: 7px 16px;
        background: #00D4AA;
        color: #0A0E17;
        font-size: .8rem; font-weight: 800;
        border: none; border-radius: 8px;
        cursor: pointer; font-family: inherit;
        transition: opacity .15s;
      }
      #mnAndroidBanner .mn-ab-install:hover { opacity: .88; }
      #mnAndroidBanner .mn-ab-close {
        background: none; border: none;
        color: rgba(255,255,255,.35); font-size: 1.1rem;
        cursor: pointer; padding: 4px 6px;
        border-radius: 6px; font-family: inherit;
        flex-shrink: 0; transition: color .15s;
      }
      #mnAndroidBanner .mn-ab-close:hover { color: rgba(255,255,255,.7); }

      /* ══ Desktop install button (header) ════════════════════════ */
      #mnDesktopInstallBtn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 13px;
        background: rgba(0,212,170,.08);
        border: 1px solid rgba(0,212,170,.35);
        border-radius: 8px;
        color: #00D4AA;
        font-size: .78rem; font-weight: 700;
        cursor: pointer; font-family: inherit;
        transition: background .15s, border-color .15s;
        white-space: nowrap;
      }
      #mnDesktopInstallBtn:hover {
        background: rgba(0,212,170,.15);
        border-color: rgba(0,212,170,.6);
      }

      /* ══ Desktop modal ══════════════════════════════════════════ */
      #mnDesktopModalOverlay {
        position: fixed; inset: 0;
        z-index: 9800;
        background: rgba(0,0,0,.65);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex; align-items: center; justify-content: center;
        animation: mnFadeIn .2s ease forwards;
      }
      #mnDesktopModal {
        background: #0F172A;
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 20px;
        width: min(400px, calc(100vw - 32px));
        padding: 32px 28px 28px;
        box-shadow: 0 40px 100px rgba(0,0,0,.7);
        animation: mnScaleIn .3s cubic-bezier(0.22,1,0.36,1) forwards;
        font-family: inherit;
        text-align: center;
      }
      #mnDesktopModal .mn-dm-icon {
        width: 72px; height: 72px;
        border-radius: 18px;
        margin: 0 auto 16px;
        overflow: hidden;
        background: rgba(0,212,170,.08);
        border: 1px solid rgba(0,212,170,.2);
        display: flex; align-items: center; justify-content: center;
      }
      #mnDesktopModal .mn-dm-icon img { width: 100%; height: 100%; object-fit: cover; }
      #mnDesktopModal .mn-dm-name {
        font-size: 1.15rem; font-weight: 800; color: #fff; margin-bottom: 4px;
      }
      #mnDesktopModal .mn-dm-url {
        font-size: .72rem; color: rgba(255,255,255,.3); margin-bottom: 20px;
      }
      #mnDesktopModal .mn-dm-features {
        display: flex; justify-content: center; gap: 20px;
        margin-bottom: 24px;
      }
      #mnDesktopModal .mn-dm-feature {
        display: flex; flex-direction: column; align-items: center; gap: 6px;
        font-size: .72rem; color: rgba(255,255,255,.5);
      }
      #mnDesktopModal .mn-dm-feature-icon {
        width: 40px; height: 40px;
        background: rgba(255,255,255,.04);
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.1rem;
      }
      #mnDesktopModal .mn-dm-btn-install {
        width: 100%; padding: 13px;
        background: linear-gradient(135deg,#00D4AA,#059669);
        border: none; border-radius: 12px;
        color: #fff; font-size: .9rem; font-weight: 800;
        cursor: pointer; font-family: inherit;
        margin-bottom: 10px;
        transition: opacity .15s;
      }
      #mnDesktopModal .mn-dm-btn-install:hover { opacity: .9; }
      #mnDesktopModal .mn-dm-btn-cancel {
        background: none; border: none;
        color: rgba(255,255,255,.35); font-size: .8rem;
        cursor: pointer; font-family: inherit;
        transition: color .15s;
      }
      #mnDesktopModal .mn-dm-btn-cancel:hover { color: rgba(255,255,255,.6); }

      /* ══ iOS bottom banner ══════════════════════════════════════ */
      #mnIOSBanner {
        position: fixed;
        bottom: 0; left: 0; right: 0;
        z-index: 9500;
        padding: 16px 18px 24px;
        background: rgba(10,14,23,.97);
        border-top: 1.5px solid rgba(0,212,170,.35);
        box-shadow: 0 -8px 32px rgba(0,0,0,.5);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        animation: mnSlideUp .3s ease forwards;
        font-family: inherit;
      }
      #mnIOSBanner .mn-ios-head {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 14px;
      }
      #mnIOSBanner .mn-ios-title {
        font-size: .9rem; font-weight: 700; color: #00D4AA;
      }
      #mnIOSBanner .mn-ios-close {
        background: none; border: none;
        color: rgba(255,255,255,.35); font-size: 1.1rem;
        cursor: pointer; padding: 2px 6px;
        border-radius: 6px; font-family: inherit;
        transition: color .15s;
      }
      #mnIOSBanner .mn-ios-close:hover { color: rgba(255,255,255,.7); }
      #mnIOSBanner .mn-ios-steps {
        display: flex; flex-direction: column; gap: 10px;
      }
      #mnIOSBanner .mn-ios-step {
        display: flex; align-items: center; gap: 10px;
      }
      #mnIOSBanner .mn-ios-num {
        width: 24px; height: 24px; border-radius: 50%;
        background: rgba(0,212,170,.12);
        border: 1px solid rgba(0,212,170,.3);
        color: #00D4AA; font-size: .72rem; font-weight: 800;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      #mnIOSBanner .mn-ios-step-text {
        font-size: .8rem; color: rgba(255,255,255,.65); line-height: 1.4;
      }
      #mnIOSBanner .mn-ios-step-text strong { color: #fff; }

      /* ══ Keyframes ══════════════════════════════════════════════ */
      @keyframes mnSlideDown {
        from { opacity:0; transform: translateY(-100%); }
        to   { opacity:1; transform: translateY(0); }
      }
      @keyframes mnSlideUp {
        from { opacity:0; transform: translateY(40px); }
        to   { opacity:1; transform: translateY(0); }
      }
      @keyframes mnSlideOutUp {
        from { opacity:1; transform: translateY(0); }
        to   { opacity:0; transform: translateY(-100%); }
      }
      @keyframes mnSlideOutDown {
        from { opacity:1; transform: translateY(0); }
        to   { opacity:0; transform: translateY(40px); }
      }
      @keyframes mnFadeIn {
        from { opacity:0; } to { opacity:1; }
      }
      @keyframes mnFadeOut {
        from { opacity:1; } to { opacity:0; }
      }
      @keyframes mnScaleIn {
        from { opacity:0; transform: scale(.94); }
        to   { opacity:1; transform: scale(1); }
      }
    `;
    document.head.appendChild(s);
  }

  // ─── 1. Android / Chrome — top banner ────────────────────────────
  function _showAndroidBanner() {
    if (isInstalled()) return;
    if (!deferredPrompt) return;

    const dismissed = parseInt(localStorage.getItem(ANDROID_DISMISS_KEY) || '0', 10);
    if (Date.now() - dismissed < COOLDOWN_7D) return;
    if (document.getElementById('mnAndroidBanner')) return;

    _injectStyles();

    const banner = document.createElement('div');
    banner.id = 'mnAndroidBanner';
    banner.innerHTML = `
      <div class="mn-ab-icon">
        <img src="./assets/icon-192.png" alt="MoneyNest" onerror="this.parentNode.textContent='💚'">
      </div>
      <div class="mn-ab-text">
        <div class="mn-ab-title">Instala MoneyNest</div>
        <div class="mn-ab-sub">Accede más rápido desde tu pantalla de inicio</div>
      </div>
      <button class="mn-ab-install" id="mnAbInstallBtn">Instalar</button>
      <button class="mn-ab-close"   id="mnAbCloseBtn"   aria-label="Cerrar">✕</button>
    `;
    document.body.prepend(banner);

    document.getElementById('mnAbInstallBtn').addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      _removeAndroidBanner();
      if (outcome === 'accepted') {
        localStorage.setItem(INSTALLED_KEY, 'true');
      } else {
        localStorage.setItem(ANDROID_DISMISS_KEY, String(Date.now()));
      }
    });

    document.getElementById('mnAbCloseBtn').addEventListener('click', () => {
      _removeAndroidBanner();
      localStorage.setItem(ANDROID_DISMISS_KEY, String(Date.now()));
    });
  }

  function _removeAndroidBanner() {
    const el = document.getElementById('mnAndroidBanner');
    if (!el) return;
    el.style.animation = 'mnSlideOutUp .25s ease forwards';
    setTimeout(() => el.remove(), 260);
  }

  // ─── 2. Desktop — header button + modal ──────────────────────────
  function _injectDesktopButton() {
    if (isInstalled()) return;
    if (!deferredPrompt) return;
    if (document.getElementById('mnDesktopInstallBtn')) return;

    const topbarRight = document.querySelector('.topbar-right');
    if (!topbarRight) return;

    const btn = document.createElement('button');
    btn.id = 'mnDesktopInstallBtn';
    btn.innerHTML = `<span style="font-size:.9rem">⬇</span> Instalar app`;
    btn.addEventListener('click', _showDesktopModal);

    // Insert before the first child of topbar-right
    topbarRight.insertBefore(btn, topbarRight.firstChild);
  }

  function _showDesktopModal() {
    if (document.getElementById('mnDesktopModalOverlay')) return;
    _injectStyles();

    const overlay = document.createElement('div');
    overlay.id = 'mnDesktopModalOverlay';
    overlay.innerHTML = `
      <div id="mnDesktopModal" role="dialog" aria-modal="true" aria-label="Instalar MoneyNest">
        <div class="mn-dm-icon">
          <img src="./assets/icon-192.png" alt="MoneyNest" onerror="this.parentNode.textContent='💚'">
        </div>
        <div class="mn-dm-name">MoneyNest</div>
        <div class="mn-dm-url">${location.hostname || 'moneynest.app'}</div>
        <div class="mn-dm-features">
          <div class="mn-dm-feature">
            <div class="mn-dm-feature-icon">🖥</div>
            <span>En el escritorio</span>
          </div>
          <div class="mn-dm-feature">
            <div class="mn-dm-feature-icon">📶</div>
            <span>Funciona offline</span>
          </div>
          <div class="mn-dm-feature">
            <div class="mn-dm-feature-icon">🚀</div>
            <span>Sin navegador</span>
          </div>
        </div>
        <button class="mn-dm-btn-install" id="mnDmInstallBtn">Instalar app</button>
        <br>
        <button class="mn-dm-btn-cancel" id="mnDmCancelBtn">Ahora no</button>
      </div>
    `;

    overlay.addEventListener('click', e => {
      if (e.target === overlay) _closeDesktopModal();
    });
    document.body.appendChild(overlay);

    document.getElementById('mnDmInstallBtn').addEventListener('click', async () => {
      if (!deferredPrompt) { _closeDesktopModal(); return; }
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      _closeDesktopModal();
      if (outcome === 'accepted') {
        localStorage.setItem(INSTALLED_KEY, 'true');
        document.getElementById('mnDesktopInstallBtn')?.remove();
      }
    });

    document.getElementById('mnDmCancelBtn').addEventListener('click', _closeDesktopModal);
  }

  function _closeDesktopModal() {
    const el = document.getElementById('mnDesktopModalOverlay');
    if (!el) return;
    el.style.animation = 'mnFadeOut .2s ease forwards';
    setTimeout(() => el.remove(), 210);
  }

  // ─── 3. iOS Safari — bottom banner ───────────────────────────────
  function _showIOSBanner() {
    if (!isIOS())       return;
    if (isInstalled())  return;

    const dismissed = parseInt(localStorage.getItem(IOS_DISMISS_KEY) || '0', 10);
    if (Date.now() - dismissed < COOLDOWN_14D) return;
    if (document.getElementById('mnIOSBanner')) return;

    _injectStyles();

    // iOS share icon SVG
    const shareIcon = `<svg width="13" height="16" viewBox="0 0 13 16" fill="none" style="display:inline;vertical-align:middle;position:relative;top:-1px" aria-hidden="true">
      <path d="M6.5 1v9M3.5 3.5L6.5 1l3 2.5" stroke="#00D4AA" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="1" y="6" width="11" height="9" rx="2" stroke="rgba(255,255,255,0.4)" stroke-width="1.3" fill="none"/>
    </svg>`;

    const banner = document.createElement('div');
    banner.id = 'mnIOSBanner';
    banner.setAttribute('role', 'complementary');
    banner.innerHTML = `
      <div class="mn-ios-head">
        <span class="mn-ios-title">Añade MoneyNest a tu pantalla de inicio</span>
        <button class="mn-ios-close" id="mnIosCloseBtn" aria-label="Cerrar">✕</button>
      </div>
      <div class="mn-ios-steps">
        <div class="mn-ios-step">
          <div class="mn-ios-num">1</div>
          <div class="mn-ios-step-text">
            Toca el botón <strong>Compartir</strong> ${shareIcon} en la barra de Safari
          </div>
        </div>
        <div class="mn-ios-step">
          <div class="mn-ios-num">2</div>
          <div class="mn-ios-step-text">
            Pulsa <strong>Añadir a pantalla de inicio</strong>
          </div>
        </div>
        <div class="mn-ios-step">
          <div class="mn-ios-num">3</div>
          <div class="mn-ios-step-text">
            Toca <strong>Añadir</strong> para confirmar
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('mnIosCloseBtn').addEventListener('click', () => {
      banner.style.animation = 'mnSlideOutDown .25s ease forwards';
      setTimeout(() => banner.remove(), 260);
      localStorage.setItem(IOS_DISMISS_KEY, String(Date.now()));
    });
  }

  // ─── PWA events ───────────────────────────────────────────────────
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;

    setTimeout(() => {
      if (isInstalled()) return;
      if (isDesktop()) {
        _injectDesktopButton();
      } else {
        _showAndroidBanner();
      }
    }, 2500);
  });

  window.addEventListener('appinstalled', () => {
    localStorage.setItem(INSTALLED_KEY, 'true');
    _removeAndroidBanner();
    document.getElementById('mnDesktopInstallBtn')?.remove();
  });

  // ─── Init ─────────────────────────────────────────────────────────
  function init() {
    if (isInstalled()) return;
    // iOS never fires beforeinstallprompt — show banner directly
    if (isIOS()) setTimeout(_showIOSBanner, 2500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.MNInstall = { init, isStandalone };
})();
