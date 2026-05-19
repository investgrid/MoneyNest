/**
 * MoneyNest — js/install-prompt.js
 * PWA install prompts — diseño premium dark.
 */
;(function () {
  'use strict';

  const ANDROID_DISMISS_KEY = 'mn_install_dismissed_at';
  const IOS_DISMISS_KEY     = 'mn_ios_dismissed_at';
  const INSTALLED_KEY       = 'mn_app_installed';
  const COOLDOWN_7D  = 7  * 24 * 60 * 60 * 1000;
  const COOLDOWN_14D = 14 * 24 * 60 * 60 * 1000;

  let deferredPrompt = null;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
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
  function _t(k, fb) {
    return (typeof window.t === 'function' ? window.t(k) || fb : fb);
  }

  // ── Estilos ────────────────────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('mn-install-css')) return;
    const s = document.createElement('style');
    s.id = 'mn-install-css';
    s.textContent = `
      /* ── Android banner ─────────────────────────────────────── */
      #mnAndroidBanner {
        position: fixed; top: 0; left: 0; right: 0; z-index: 9500;
        display: flex; align-items: center; gap: 12px; padding: 12px 16px;
        background: linear-gradient(135deg, #0D1424 0%, #111827 100%);
        border-bottom: 1px solid rgba(0,212,170,0.25);
        box-shadow: 0 4px 32px rgba(0,0,0,.6);
        animation: mnSlideDown .3s cubic-bezier(0.16,1,0.3,1) forwards;
        font-family: inherit;
      }
      #mnAndroidBanner .mn-ab-icon {
        width: 42px; height: 42px; border-radius: 11px; overflow: hidden;
        flex-shrink: 0; border: 1px solid rgba(0,212,170,.2);
        box-shadow: 0 0 12px rgba(0,212,170,.15);
      }
      #mnAndroidBanner .mn-ab-icon img { width: 100%; height: 100%; object-fit: cover; }
      #mnAndroidBanner .mn-ab-text { flex: 1; min-width: 0; }
      #mnAndroidBanner .mn-ab-title {
        font-size: .88rem; font-weight: 800; color: #fff; letter-spacing: -.01em;
      }
      #mnAndroidBanner .mn-ab-sub {
        font-size: .71rem; color: rgba(255,255,255,.4); margin-top: 1px;
      }
      #mnAndroidBanner .mn-ab-install {
        flex-shrink: 0; padding: 8px 18px;
        background: linear-gradient(135deg, #00D4AA, #00A882);
        color: #0A0E17; font-size: .8rem; font-weight: 800;
        border: none; border-radius: 9px; cursor: pointer; font-family: inherit;
        box-shadow: 0 4px 16px rgba(0,212,170,.3);
        transition: opacity .15s;
      }
      #mnAndroidBanner .mn-ab-install:hover { opacity: .88; }
      #mnAndroidBanner .mn-ab-close {
        background: none; border: none; color: rgba(255,255,255,.3);
        font-size: 1rem; cursor: pointer; padding: 6px; border-radius: 6px;
        flex-shrink: 0; transition: color .15s; font-family: inherit;
      }
      #mnAndroidBanner .mn-ab-close:hover { color: rgba(255,255,255,.6); }

      /* ── Desktop button ─────────────────────────────────────── */
      #mnDesktopInstallBtn {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 6px 13px;
        background: rgba(0,212,170,.08);
        border: 1px solid rgba(0,212,170,.3);
        border-radius: 8px; color: #00D4AA;
        font-size: .78rem; font-weight: 700;
        cursor: pointer; font-family: inherit;
        transition: background .15s, border-color .15s;
        white-space: nowrap;
      }
      #mnDesktopInstallBtn:hover {
        background: rgba(0,212,170,.15); border-color: rgba(0,212,170,.55);
      }

      /* ── Desktop modal ──────────────────────────────────────── */
      #mnDesktopModalOverlay {
        position: fixed; inset: 0; z-index: 9800;
        background: rgba(0,0,0,.7); backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        display: flex; align-items: center; justify-content: center; padding: 24px;
        animation: mnFadeIn .22s ease forwards;
      }
      #mnDesktopModal {
        background: #0D1424;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 24px;
        width: min(420px, 100%);
        padding: 36px 32px 28px;
        box-shadow: 0 40px 100px rgba(0,0,0,.75), 0 0 0 1px rgba(0,212,170,.06);
        animation: mnScaleIn .3s cubic-bezier(0.22,1,0.36,1) forwards;
        font-family: inherit; text-align: center; position: relative; overflow: hidden;
      }
      #mnDesktopModal::before {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
        background: linear-gradient(90deg, transparent, #00D4AA, transparent);
      }
      #mnDesktopModal::after {
        content: ''; position: absolute; top: -80px; left: 50%; transform: translateX(-50%);
        width: 300px; height: 300px; border-radius: 50%;
        background: radial-gradient(circle, rgba(0,212,170,.06) 0%, transparent 70%);
        pointer-events: none;
      }
      .mn-dm-icon-wrap {
        position: relative; width: 80px; height: 80px; margin: 0 auto 18px;
      }
      .mn-dm-icon-wrap::before {
        content: ''; position: absolute; inset: -6px; border-radius: 22px;
        background: rgba(0,212,170,.08); border: 1px solid rgba(0,212,170,.18);
      }
      .mn-dm-icon {
        position: relative; width: 80px; height: 80px; border-radius: 18px;
        overflow: hidden; border: 1px solid rgba(0,212,170,.15);
      }
      .mn-dm-icon img { width: 100%; height: 100%; object-fit: cover; }
      .mn-dm-name {
        font-size: 1.25rem; font-weight: 900; color: #fff;
        letter-spacing: -.04em; margin-bottom: 3px;
      }
      .mn-dm-tagline {
        font-size: .78rem; color: rgba(255,255,255,.35); margin-bottom: 22px;
      }
      .mn-dm-features {
        display: grid; grid-template-columns: repeat(3,1fr);
        gap: 10px; margin-bottom: 24px;
      }
      .mn-dm-feat {
        background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06);
        border-radius: 12px; padding: 12px 8px;
        display: flex; flex-direction: column; align-items: center; gap: 7px;
        transition: border-color .2s, background .2s;
      }
      .mn-dm-feat:hover { background: rgba(0,212,170,.05); border-color: rgba(0,212,170,.2); }
      .mn-dm-feat-icon {
        width: 38px; height: 38px; border-radius: 10px;
        background: rgba(0,212,170,.08); border: 1px solid rgba(0,212,170,.15);
        display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
        box-shadow: 0 0 10px rgba(0,212,170,.1);
      }
      .mn-dm-feat-label {
        font-size: .68rem; color: rgba(255,255,255,.45); font-weight: 600;
        text-align: center; line-height: 1.3;
      }
      .mn-dm-btn-install {
        width: 100%; padding: 14px;
        background: linear-gradient(135deg, #00D4AA, #059669);
        border: none; border-radius: 13px;
        color: #042b20; font-size: .92rem; font-weight: 900;
        cursor: pointer; font-family: inherit; margin-bottom: 10px;
        box-shadow: 0 6px 24px rgba(0,212,170,.35), 0 2px 8px rgba(0,0,0,.3);
        letter-spacing: -.01em;
        transition: opacity .15s, box-shadow .15s;
      }
      .mn-dm-btn-install:hover {
        opacity: .92;
        box-shadow: 0 8px 32px rgba(0,212,170,.45);
      }
      .mn-dm-btn-cancel {
        background: none; border: none; color: rgba(255,255,255,.25);
        font-size: .78rem; cursor: pointer; font-family: inherit; transition: color .15s;
      }
      .mn-dm-btn-cancel:hover { color: rgba(255,255,255,.5); }
      .mn-dm-close-btn {
        position: absolute; top: 14px; right: 14px;
        width: 28px; height: 28px; border-radius: 50%;
        background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08);
        color: rgba(255,255,255,.35); font-size: .75rem;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: all .15s; font-family: inherit;
      }
      .mn-dm-close-btn:hover { background: rgba(255,255,255,.1); color: #fff; }

      /* ── iOS banner ─────────────────────────────────────────── */
      #mnIOSBanner {
        position: fixed; bottom: 0; left: 0; right: 0; z-index: 9500;
        padding: 18px 20px calc(18px + env(safe-area-inset-bottom, 0px));
        background: rgba(10,14,23,.96);
        border-top: 1px solid rgba(0,212,170,.25);
        box-shadow: 0 -8px 40px rgba(0,0,0,.5);
        backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
        animation: mnSlideUp .3s cubic-bezier(0.16,1,0.3,1) forwards;
        font-family: inherit;
      }
      #mnIOSBanner .mn-ios-head {
        display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
      }
      #mnIOSBanner .mn-ios-title-row {
        display: flex; align-items: center; gap: 10px;
      }
      #mnIOSBanner .mn-ios-icon {
        width: 36px; height: 36px; border-radius: 9px; overflow: hidden;
        border: 1px solid rgba(0,212,170,.2); flex-shrink: 0;
      }
      #mnIOSBanner .mn-ios-icon img { width: 100%; height: 100%; object-fit: cover; }
      #mnIOSBanner .mn-ios-title { font-size: .88rem; font-weight: 800; color: #fff; }
      #mnIOSBanner .mn-ios-sub { font-size: .7rem; color: rgba(255,255,255,.35); margin-top: 1px; }
      #mnIOSBanner .mn-ios-close {
        background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08);
        color: rgba(255,255,255,.35); font-size: .75rem;
        width: 26px; height: 26px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; flex-shrink: 0; transition: all .15s; font-family: inherit;
      }
      #mnIOSBanner .mn-ios-close:hover { background: rgba(255,255,255,.1); color: #fff; }
      #mnIOSBanner .mn-ios-steps { display: flex; flex-direction: column; gap: 10px; }
      #mnIOSBanner .mn-ios-step {
        display: flex; align-items: flex-start; gap: 10px;
      }
      #mnIOSBanner .mn-ios-num {
        width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
        background: rgba(0,212,170,.1); border: 1px solid rgba(0,212,170,.25);
        color: #00D4AA; font-size: .68rem; font-weight: 800;
        display: flex; align-items: center; justify-content: center; margin-top: 1px;
      }
      #mnIOSBanner .mn-ios-step-text {
        font-size: .79rem; color: rgba(255,255,255,.6); line-height: 1.45;
      }
      #mnIOSBanner .mn-ios-step-text strong { color: #fff; font-weight: 700; }

      /* ── Keyframes ─────────────────────────────────────────── */
      @keyframes mnSlideDown {
        from { opacity:0; transform:translateY(-100%); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes mnSlideUp {
        from { opacity:0; transform:translateY(40px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes mnSlideOutUp {
        from { opacity:1; transform:translateY(0); }
        to   { opacity:0; transform:translateY(-100%); }
      }
      @keyframes mnSlideOutDown {
        from { opacity:1; transform:translateY(0); }
        to   { opacity:0; transform:translateY(40px); }
      }
      @keyframes mnFadeIn  { from{opacity:0} to{opacity:1} }
      @keyframes mnFadeOut { from{opacity:1} to{opacity:0} }
      @keyframes mnScaleIn {
        from { opacity:0; transform:scale(.94) translateY(8px); }
        to   { opacity:1; transform:scale(1)  translateY(0); }
      }
    `;
    document.head.appendChild(s);
  }

  // ── 1. Android / Chrome — banner superior ─────────────────────────
  function _showAndroidBanner() {
    if (isInstalled() || !deferredPrompt) return;
    const dismissed = parseInt(localStorage.getItem(ANDROID_DISMISS_KEY) || '0', 10);
    if (Date.now() - dismissed < COOLDOWN_7D) return;
    if (document.getElementById('mnAndroidBanner')) return;
    _injectStyles();

    const banner = document.createElement('div');
    banner.id = 'mnAndroidBanner';
    banner.innerHTML = `
      <div class="mn-ab-icon">
        <img src="./assets/icon-192.png" alt="MoneyNest" onerror="this.parentNode.innerHTML='💚'">
      </div>
      <div class="mn-ab-text">
        <div class="mn-ab-title">${_t('install_app_title', 'Instala MoneyNest')}</div>
        <div class="mn-ab-sub">${_t('install_app_sub', 'Acceso rápido desde tu pantalla de inicio')}</div>
      </div>
      <button class="mn-ab-install" id="mnAbInstallBtn">${_t('instalar', 'Instalar')}</button>
      <button class="mn-ab-close"   id="mnAbCloseBtn" aria-label="Cerrar">✕</button>
    `;
    document.body.prepend(banner);

    document.getElementById('mnAbInstallBtn').addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      _removeAndroidBanner();
      if (outcome === 'accepted') localStorage.setItem(INSTALLED_KEY, 'true');
      else localStorage.setItem(ANDROID_DISMISS_KEY, String(Date.now()));
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

  // ── 2. Desktop — botón en topbar + modal premium ──────────────────
  function _injectDesktopButton() {
    if (isInstalled() || !deferredPrompt) return;
    if (document.getElementById('mnDesktopInstallBtn')) return;
    const topbarRight = document.querySelector('.topbar-right');
    if (!topbarRight) return;
    const btn = document.createElement('button');
    btn.id = 'mnDesktopInstallBtn';
    btn.innerHTML = `<span style="font-size:.85rem">⬇</span> ${_t('install_app_title', 'Instalar app')}`;
    btn.addEventListener('click', _showDesktopModal);
    topbarRight.insertBefore(btn, topbarRight.firstChild);
  }

  function _showDesktopModal() {
    if (document.getElementById('mnDesktopModalOverlay')) return;
    _injectStyles();

    const overlay = document.createElement('div');
    overlay.id = 'mnDesktopModalOverlay';
    overlay.innerHTML = `
      <div id="mnDesktopModal" role="dialog" aria-modal="true">
        <button class="mn-dm-close-btn" id="mnDmCloseX" aria-label="Cerrar">✕</button>

        <div class="mn-dm-icon-wrap">
          <div class="mn-dm-icon">
            <img src="./assets/icon-with-text.png" alt="MoneyNest" onerror="this.src='./assets/icon-192.png'">
          </div>
        </div>

        <div class="mn-dm-name">MoneyNest</div>
        <div class="mn-dm-tagline">${_t('install_tagline', 'Tu gestor financiero personal')} · ${location.hostname || 'moneynest.app'}</div>

        <div class="mn-dm-features">
          <div class="mn-dm-feat">
            <div class="mn-dm-feat-icon">⚡</div>
            <div class="mn-dm-feat-label">${_t('install_feat1', 'Acceso\ninstantáneo')}</div>
          </div>
          <div class="mn-dm-feat">
            <div class="mn-dm-feat-icon">📶</div>
            <div class="mn-dm-feat-label">${_t('install_feat2', 'Funciona\noffline')}</div>
          </div>
          <div class="mn-dm-feat">
            <div class="mn-dm-feat-icon">🔒</div>
            <div class="mn-dm-feat-label">${_t('install_feat3', 'Datos\nprivados')}</div>
          </div>
        </div>

        <button class="mn-dm-btn-install" id="mnDmInstallBtn">
          ⬇ ${_t('install_btn', 'Instalar MoneyNest')}
        </button>
        <br>
        <button class="mn-dm-btn-cancel" id="mnDmCancelBtn">${_t('install_cancel', 'Ahora no')}</button>
      </div>
    `;

    overlay.addEventListener('click', e => { if (e.target === overlay) _closeDesktopModal(); });
    document.body.appendChild(overlay);

    document.getElementById('mnDmCloseX').addEventListener('click', _closeDesktopModal);
    document.getElementById('mnDmCancelBtn').addEventListener('click', _closeDesktopModal);
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
  }

  function _closeDesktopModal() {
    const el = document.getElementById('mnDesktopModalOverlay');
    if (!el) return;
    el.style.animation = 'mnFadeOut .2s ease forwards';
    setTimeout(() => el.remove(), 210);
  }

  // ── 3. iOS Safari — banner inferior ──────────────────────────────
  function _showIOSBanner() {
    if (!isIOS() || isInstalled()) return;
    const dismissed = parseInt(localStorage.getItem(IOS_DISMISS_KEY) || '0', 10);
    if (Date.now() - dismissed < COOLDOWN_14D) return;
    if (document.getElementById('mnIOSBanner')) return;
    _injectStyles();

    const shareIcon = `<svg width="13" height="16" viewBox="0 0 13 16" fill="none" style="display:inline;vertical-align:middle;margin:0 1px;position:relative;top:-1px">
      <path d="M6.5 1v9M3.5 3.5L6.5 1l3 2.5" stroke="#00D4AA" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="1" y="6" width="11" height="9" rx="2" stroke="rgba(255,255,255,0.4)" stroke-width="1.3" fill="none"/>
    </svg>`;

    const banner = document.createElement('div');
    banner.id = 'mnIOSBanner';
    banner.innerHTML = `
      <div class="mn-ios-head">
        <div class="mn-ios-title-row">
          <div class="mn-ios-icon">
            <img src="./assets/icon-with-text.png" alt="" onerror="this.src='./assets/icon-192.png'">
          </div>
          <div>
            <div class="mn-ios-title">${_t('install_app_title', 'Instala MoneyNest')}</div>
            <div class="mn-ios-sub">${_t('install_ios_sub', 'Añade a pantalla de inicio')}</div>
          </div>
        </div>
        <button class="mn-ios-close" id="mnIosCloseBtn" aria-label="Cerrar">✕</button>
      </div>
      <div class="mn-ios-steps">
        <div class="mn-ios-step">
          <div class="mn-ios-num">1</div>
          <div class="mn-ios-step-text">${_t('install_ios_step1', 'Toca el botón')} <strong>${_t('install_ios_share', 'Compartir')}</strong> ${shareIcon} ${_t('install_ios_step1b', 'en la barra de Safari')}</div>
        </div>
        <div class="mn-ios-step">
          <div class="mn-ios-num">2</div>
          <div class="mn-ios-step-text">${_t('install_ios_step2', 'Selecciona')} <strong>${_t('install_ios_add', 'Añadir a pantalla de inicio')}</strong></div>
        </div>
        <div class="mn-ios-step">
          <div class="mn-ios-num">3</div>
          <div class="mn-ios-step-text">${_t('install_ios_step3', 'Toca')} <strong>${_t('install_ios_confirm', 'Añadir')}</strong> ${_t('install_ios_step3b', 'para confirmar')}</div>
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

  // ── Modal post-onboarding (aparece 15s después de completar el onboarding) ───
  const ONBOARDING_MODAL_KEY = 'mn_install_onb_shown';

  function showOnboardingInstallModal() {
    if (isInstalled()) return;
    if (localStorage.getItem(ONBOARDING_MODAL_KEY)) return;
    localStorage.setItem(ONBOARDING_MODAL_KEY, '1');
    _injectStyles();

    const overlay = document.createElement('div');
    overlay.id = 'mnOnbInstallOverlay';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9850;
      background:rgba(0,0,0,.65);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
      display:flex;align-items:center;justify-content:center;padding:24px;
      animation:mnFadeIn .25s ease forwards;
    `;

    const isIosDevice = isIOS();
    const shareIcon = `<svg width="12" height="15" viewBox="0 0 13 16" fill="none" style="display:inline;vertical-align:middle;margin:0 2px">
      <path d="M6.5 1v9M3.5 3.5L6.5 1l3 2.5" stroke="#00D4AA" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="1" y="6" width="11" height="9" rx="2" stroke="rgba(255,255,255,0.4)" stroke-width="1.3" fill="none"/>
    </svg>`;

    overlay.innerHTML = `
      <div style="
        background:#0D1424;border:1px solid rgba(255,255,255,.08);border-radius:24px;
        width:min(400px,100%);padding:32px 28px 24px;
        box-shadow:0 40px 100px rgba(0,0,0,.75);
        animation:mnScaleIn .3s cubic-bezier(0.22,1,0.36,1) forwards;
        position:relative;overflow:hidden;text-align:center;font-family:inherit;
      ">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,#00D4AA,transparent)"></div>

        <!-- Icono -->
        <div style="width:72px;height:72px;border-radius:18px;margin:0 auto 16px;
          overflow:hidden;border:1px solid rgba(0,212,170,.2);
          box-shadow:0 0 24px rgba(0,212,170,.15)">
          <img src="./assets/icon-with-text.png" style="width:100%;height:100%;object-fit:cover"
            onerror="this.src='./assets/icon-192.png'">
        </div>

        <div style="font-size:1.15rem;font-weight:900;color:#fff;letter-spacing:-.03em;margin-bottom:6px">
          ${_t('install_onb_title', '¡Instala MoneyNest!')}
        </div>
        <div style="font-size:.82rem;color:rgba(255,255,255,.5);line-height:1.6;margin-bottom:22px">
          ${_t('install_onb_desc', 'Accede más rápido, funciona sin conexión y sin abrir el navegador.')}
        </div>

        ${isIosDevice ? `
        <!-- iOS: instrucciones inline -->
        <div style="text-align:left;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:14px 16px;margin-bottom:18px">
          <div style="font-size:.72rem;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Cómo instalar en iOS</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;gap:8px;font-size:.78rem;color:rgba(255,255,255,.65)">
              <span style="width:20px;height:20px;border-radius:50%;background:rgba(0,212,170,.1);border:1px solid rgba(0,212,170,.25);color:#00D4AA;font-size:.65rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">1</span>
              ${_t('install_ios_step1','Toca el botón')} <strong style="color:#fff"> ${_t('install_ios_share','Compartir')}</strong> ${shareIcon}
            </div>
            <div style="display:flex;align-items:center;gap:8px;font-size:.78rem;color:rgba(255,255,255,.65)">
              <span style="width:20px;height:20px;border-radius:50%;background:rgba(0,212,170,.1);border:1px solid rgba(0,212,170,.25);color:#00D4AA;font-size:.65rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">2</span>
              ${_t('install_ios_step2','Selecciona')} <strong style="color:#fff"> ${_t('install_ios_add','Añadir a pantalla de inicio')}</strong>
            </div>
          </div>
        </div>
        <button onclick="document.getElementById('mnOnbInstallOverlay').remove()"
          style="width:100%;padding:13px;border-radius:12px;border:none;background:linear-gradient(135deg,#00D4AA,#059669);color:#042b20;font-size:.9rem;font-weight:900;cursor:pointer;font-family:inherit;margin-bottom:10px;letter-spacing:-.01em">
          ${_t('install_understood', 'Entendido 👍')}
        </button>` : `
        <!-- Android / Desktop: botón nativo -->
        <button id="mnOnbInstallBtn"
          style="width:100%;padding:13px;border-radius:12px;border:none;background:linear-gradient(135deg,#00D4AA,#059669);color:#042b20;font-size:.9rem;font-weight:900;cursor:pointer;font-family:inherit;margin-bottom:10px;letter-spacing:-.01em;box-shadow:0 6px 24px rgba(0,212,170,.3)">
          ⬇ ${_t('install_btn', 'Instalar MoneyNest')}
        </button>`}

        <button onclick="document.getElementById('mnOnbInstallOverlay').remove()"
          style="background:none;border:none;color:rgba(255,255,255,.3);font-size:.78rem;cursor:pointer;font-family:inherit;transition:color .15s"
          onmouseover="this.style.color='rgba(255,255,255,.6)'" onmouseout="this.style.color='rgba(255,255,255,.3)'">
          ${_t('install_later', 'Ahora no — puedo instalarlo desde Configuración')}
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    if (!isIosDevice) {
      const btn = document.getElementById('mnOnbInstallBtn');
      if (btn) {
        btn.addEventListener('click', async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            if (outcome === 'accepted') localStorage.setItem(INSTALLED_KEY, 'true');
          }
          overlay.remove();
        });
        // Si no hay prompt disponible (Chrome ya instalado o no soportado), cambia el texto
        if (!deferredPrompt) {
          btn.textContent = _t('install_understood', 'Entendido 👍');
          btn.onclick = () => overlay.remove();
        }
      }
    }
  }

  // ── Botón de instalación para la sección Configuración ──────────────
  function renderInstallCard() {
    if (isInstalled()) {
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(0,212,170,.06);border:1px solid rgba(0,212,170,.2);border-radius:10px">
          <span style="font-size:1.2rem">✅</span>
          <div style="font-size:.82rem;color:var(--text2)">${_t('install_already_done', 'App instalada — acceso rápido desde tu pantalla de inicio')}</div>
        </div>`;
    }

    const isIosDevice = isIOS();
    const shareIcon = `<svg width="11" height="13" viewBox="0 0 13 16" fill="none" style="display:inline;vertical-align:middle">
      <path d="M6.5 1v9M3.5 3.5L6.5 1l3 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="1" y="6" width="11" height="9" rx="2" stroke="currentColor" stroke-width="1.3" fill="none"/>
    </svg>`;

    if (isIosDevice) {
      return `
        <div style="font-size:.78rem;color:var(--text2);line-height:1.6;margin-bottom:10px">
          1. ${_t('install_ios_step1','Toca')} <strong style="color:var(--text)">${_t('install_ios_share','Compartir')}</strong> ${shareIcon}
          &nbsp;·&nbsp;
          2. <strong style="color:var(--text)">${_t('install_ios_add','Añadir a pantalla de inicio')}</strong>
          &nbsp;·&nbsp;
          3. <strong style="color:var(--text)">${_t('install_ios_confirm','Añadir')}</strong>
        </div>`;
    }

    return `
      <button onclick="window.MNInstall.triggerInstall()"
        style="width:100%;padding:12px;border-radius:11px;border:none;
        background:linear-gradient(135deg,#00D4AA,#059669);
        color:#042b20;font-size:.88rem;font-weight:800;cursor:pointer;font-family:inherit;
        box-shadow:0 4px 16px rgba(0,212,170,.28);letter-spacing:-.01em;
        transition:opacity .15s"
        onmouseover="this.style.opacity='.9'" onmouseout="this.style.opacity='1'">
        ⬇ ${_t('install_btn', 'Instalar MoneyNest')}
      </button>`;
  }

  async function triggerInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (outcome === 'accepted') {
        localStorage.setItem(INSTALLED_KEY, 'true');
        if (typeof renderConfiguracion === 'function') renderConfiguracion();
      }
    } else {
      // Prompt no disponible — mostrar modal con instrucciones
      _showDesktopModal();
    }
  }

  // ── PWA events ────────────────────────────────────────────────────
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    // Ya no inyectamos nada automáticamente — solo guardamos el prompt
  });

  window.addEventListener('appinstalled', () => {
    localStorage.setItem(INSTALLED_KEY, 'true');
    _removeAndroidBanner();
    // Refrescar configuración si está abierta
    if (typeof renderConfiguracion === 'function' && typeof currentPage !== 'undefined' && currentPage === 'configuracion') {
      renderConfiguracion();
    }
  });

  function init() {
    if (isInstalled()) return;
    if (isIOS()) setTimeout(_showIOSBanner, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.MNInstall = {
    init,
    isStandalone,
    isInstalled,
    showModal: _showDesktopModal,
    showOnboardingModal: showOnboardingInstallModal,
    renderInstallCard,
    triggerInstall,
  };
})();
