window.MNPayment = (() => {
  const ENDPOINT = 'https://jwddciqqhmfkbqhdrfre.supabase.co/functions/v1/create-payment-intent';

  let _stripe   = null;
  let _elements = null;
  let _overlay  = null;

  function _getStripe() {
    if (!_stripe) _stripe = Stripe(MNStripeConfig.publishableKey);
    return _stripe;
  }

  // ── Overlay DOM ────────────────────────────────────────────────

  function _buildOverlay() {
    if (document.getElementById('mnPaymentOverlay')) return;

    const el = document.createElement('div');
    el.id = 'mnPaymentOverlay';
    el.innerHTML = `
      <div class="mnpo-backdrop"></div>
      <div class="mnpo-sheet" id="mnPaymentSheet" role="dialog" aria-modal="true" aria-label="Pago seguro">
        <div class="mnpo-handle"></div>
        <div class="mnpo-header">
          <div class="mnpo-title" id="mnPoTitle">Activar plan</div>
          <button class="mnpo-close" id="mnPoClose" aria-label="Cerrar">✕</button>
        </div>
        <div class="mnpo-body" id="mnPoBody">
          <div class="mnpo-plan-summary" id="mnPoPlanSummary"></div>
          <div id="mnPoElement"></div>
          <div class="mnpo-error" id="mnPoError" style="display:none"></div>
          <button class="mnpo-pay-btn" id="mnPoPayBtn">
            <span id="mnPoPayBtnText">Pagar ahora</span>
            <span class="mnpo-pay-spinner" id="mnPoSpinner" style="display:none"></span>
          </button>
          <div class="mnpo-secure-note">🔒 Pago 100% seguro con Stripe · No almacenamos tu tarjeta</div>
        </div>
        <div class="mnpo-success" id="mnPoSuccess" style="display:none">
          <div class="mnpo-success-icon">✓</div>
          <div class="mnpo-success-title" id="mnPoSuccessTitle">¡Plan activado!</div>
          <div class="mnpo-success-sub" id="mnPoSuccessSub"></div>
          <button class="mnpo-success-btn" id="mnPoSuccessBtn">Continuar</button>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    _overlay = el;

    document.getElementById('mnPoClose').addEventListener('click', close);
    el.querySelector('.mnpo-backdrop').addEventListener('click', close);
    document.getElementById('mnPoPayBtn').addEventListener('click', _handlePay);
    document.getElementById('mnPoSuccessBtn').addEventListener('click', close);
  }

  function _setPlanSummary(priceId) {
    const isLocal = priceId === MNStripeConfig.prices.local;
    document.getElementById('mnPoTitle').textContent = isLocal
      ? 'Activar Local — 5€'
      : 'Activar Pro — 5€/año';

    document.getElementById('mnPoPlanSummary').innerHTML = isLocal
      ? `<div class="mnpo-plan-tag mnpo-plan-tag--local">💾 Local Lifetime</div>
         <div class="mnpo-plan-price"><span class="mnpo-price-big">5€</span> <span class="mnpo-price-period">pago único</span></div>
         <div class="mnpo-plan-desc">Acceso ilimitado · Sin suscripción · Sin cloud</div>`
      : `<div class="mnpo-plan-tag mnpo-plan-tag--pro">⚡ Pro Annual</div>
         <div class="mnpo-plan-price"><span class="mnpo-price-big">5€</span> <span class="mnpo-price-period">/año</span></div>
         <div class="mnpo-plan-desc">7 días gratis · Cloud sync · Cancela cuando quieras</div>`;
  }

  function _setLoading(on) {
    const btn     = document.getElementById('mnPoPayBtn');
    const txt     = document.getElementById('mnPoPayBtnText');
    const spinner = document.getElementById('mnPoSpinner');
    btn.disabled       = on;
    txt.style.opacity  = on ? '0.5' : '1';
    spinner.style.display = on ? 'inline-block' : 'none';
  }

  function _showError(msg) {
    const el = document.getElementById('mnPoError');
    el.textContent    = msg;
    el.style.display  = 'block';
    _setLoading(false);
  }

  function _hideError() {
    document.getElementById('mnPoError').style.display = 'none';
  }

  function _showSuccess(priceId) {
    const isLocal = priceId === MNStripeConfig.prices.local;
    document.getElementById('mnPoBody').style.display    = 'none';
    document.getElementById('mnPoSuccess').style.display = 'flex';
    document.getElementById('mnPoSuccessTitle').textContent = isLocal
      ? '¡Plan Local activado!'
      : '¡Pro activado!';
    document.getElementById('mnPoSuccessSub').textContent = isLocal
      ? 'Acceso ilimitado desbloqueado sin suscripción.'
      : '7 días de prueba gratuita iniciados. Disfruta de MoneyNest Pro.';

    if (!isLocal) {
      // Store pro trial end date
      if (window.MNAuth) {
        const proTrialEndsAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
        window.MNAuth.patchUser({ plan: 'pro', cloudEnabled: true, proTrialEndsAt, proTrialUsed: true });
      }
      // Inject 7-day trial badge
      const successEl = document.getElementById('mnPoSuccess');
      const existingBadge = document.getElementById('mnPoProTrialBadge');
      if (successEl && !existingBadge) {
        const badge = document.createElement('div');
        badge.id = 'mnPoProTrialBadge';
        badge.innerHTML = `
          <div style="margin-top:16px;padding:16px 20px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.25);border-radius:14px;text-align:center">
            <div style="font-size:2rem;font-weight:900;color:#6366F1;letter-spacing:-.05em;line-height:1">7 días</div>
            <div style="font-size:.75rem;font-weight:700;color:#94A3B8;margin-top:4px">de prueba gratuita incluidos</div>
            <div style="font-size:.7rem;color:#64748B;margin-top:6px;line-height:1.5">
              Tu tarjeta no será cobrada hasta el día 8.<br>Cancela cuando quieras.
            </div>
            <div style="margin-top:10px;display:flex;justify-content:center;gap:8px;flex-wrap:wrap">
              <span style="background:rgba(0,212,170,.1);border:1px solid rgba(0,212,170,.2);color:#00D4AA;padding:4px 10px;border-radius:99px;font-size:.68rem;font-weight:700">☁️ Cloud sync</span>
              <span style="background:rgba(0,212,170,.1);border:1px solid rgba(0,212,170,.2);color:#00D4AA;padding:4px 10px;border-radius:99px;font-size:.68rem;font-weight:700">🔄 Backups</span>
              <span style="background:rgba(0,212,170,.1);border:1px solid rgba(0,212,170,.2);color:#00D4AA;padding:4px 10px;border-radius:99px;font-size:.68rem;font-weight:700">⚡ Prioritario</span>
            </div>
          </div>`;
        successEl.appendChild(badge);
      }
    }
  }

  // ── Payment flow ───────────────────────────────────────────────

  let _activePriceId = null;
  let _activeEmail   = null;

  async function _handlePay() {
    _hideError();
    _setLoading(true);

    const stripe = _getStripe();
    const returnUrl = `${location.origin}${location.pathname}?checkout=success&plan=${
      _activePriceId === MNStripeConfig.prices.local ? 'local' : 'pro'
    }`;

    const { error } = await stripe.confirmPayment({
      elements: _elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });

    if (error) {
      _showError(error.message ?? 'Error al procesar el pago. Inténtalo de nuevo.');
      return;
    }

    // Payment succeeded without redirect
    _onPaymentSuccess(_activePriceId, _activeEmail);
  }

  function _onPaymentSuccess(priceId, email) {
    const isLocal = priceId === MNStripeConfig.prices.local;
    if (isLocal) {
      MNAuth.buyLocal(email);
    } else {
      MNAuth.activatePro(email);
    }
    if (typeof updateSidebarLogo === 'function') updateSidebarLogo();
    _showSuccess(priceId);
    document.dispatchEvent(new CustomEvent('mn:paymentSuccess', {
      detail: { plan: isLocal ? 'local_lifetime' : 'pro_annual', email },
    }));
  }

  // ── Handle return from 3DS redirect ───────────────────────────

  async function _checkReturnParams() {
    const params   = new URLSearchParams(location.search);
    const checkout = params.get('checkout');
    const plan     = params.get('plan');

    if (checkout === 'success' && plan) {
      const pi = params.get('payment_intent');
      const si = params.get('setup_intent');

      if (pi || si) {
        const stripe = _getStripe();
        if (pi) await stripe.retrievePaymentIntent(params.get('payment_intent_client_secret') ?? '');
        const email = MNAuth.getUser()?.email ?? '';
        _onPaymentSuccess(
          plan === 'local' ? MNStripeConfig.prices.local : MNStripeConfig.prices.pro,
          email,
        );
      }

      // Clean URL
      const clean = location.pathname;
      history.replaceState({}, '', clean);
    }
  }

  // ── Public API ─────────────────────────────────────────────────

  async function open(priceId, email) {
    _buildOverlay();
    _activePriceId = priceId;
    _activeEmail   = email ?? '';

    // Reset state
    document.getElementById('mnPoBody').style.display    = 'block';
    document.getElementById('mnPoSuccess').style.display = 'none';
    document.getElementById('mnPoElement').innerHTML     = '';
    _hideError();
    _setLoading(true);
    _setPlanSummary(priceId);

    // Open overlay
    _overlay.classList.add('mnpo--open');
    document.body.style.overflow = 'hidden';

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'server_error');

      const stripe   = _getStripe();
      const appearance = {
        theme: 'night',
        variables: {
          colorPrimary:        '#00D4AA',
          colorBackground:     '#0F172A',
          colorText:           '#E8EFF7',
          colorTextSecondary:  '#94A3B8',
          colorDanger:         '#FB7185',
          fontFamily:          'Inter, system-ui, sans-serif',
          borderRadius:        '10px',
          spacingUnit:         '4px',
        },
        rules: {
          '.Input': {
            backgroundColor: 'rgba(255,255,255,0.05)',
            border:          '1px solid rgba(255,255,255,0.1)',
            color:           '#E8EFF7',
          },
          '.Input:focus': {
            border:    '1px solid #00D4AA',
            boxShadow: '0 0 0 3px rgba(0,212,170,0.15)',
          },
          '.Label': { color: '#94A3B8', fontWeight: '600' },
          '.Tab':   { backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' },
          '.Tab--selected': { borderColor: '#00D4AA', backgroundColor: 'rgba(0,212,170,0.06)' },
        },
      };

      _elements = stripe.elements({
        clientSecret: data.clientSecret,
        appearance,
      });

      const paymentElement = _elements.create('payment');
      paymentElement.mount('#mnPoElement');
      paymentElement.on('ready', () => _setLoading(false));

    } catch (err) {
      _showError(err.message ?? 'No se pudo iniciar el pago. Inténtalo de nuevo.');
    }
  }

  function close() {
    if (!_overlay) return;
    _overlay.classList.remove('mnpo--open');
    document.body.style.overflow = '';
    // Small delay so close animation plays before cleanup
    setTimeout(() => {
      if (_elements) {
        try { _elements.getElement('payment')?.unmount(); } catch (_) { /* ignore */ }
      }
      _elements = null;
    }, 300);
  }

  function init() {
    _checkReturnParams();
  }

  return { open, close, init };
})();
