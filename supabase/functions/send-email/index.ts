/**
 * MoneyNest — send-email Edge Function v2
 * Envía emails usando Resend (resend.com).
 *
 * Tipos:
 *   - confirmacion  → email de bienvenida al registrarse
 *   - otp           → código de verificación de 6 dígitos
 *   - sugerencia    → feedback de usuarios → soporte
 *
 * Variables de entorno requeridas en Supabase:
 *   RESEND_API_KEY   → tu API key de resend.com
 *   FROM_EMAIL       → email verificado en Resend (ej: noreply@moneynest.app)
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL')     ?? 'noreply@moneynest.app';
const SUPPORT_EMAIL  = 'invest.grid.main@gmail.com';

// ── Rate limiting por IP ───────────────────────────────────────────
const _sent: Record<string, { count: number; firstAt: number }> = {};
function rateCheck(ip: string, max = 5, windowMs = 10 * 60 * 1000): boolean {
  const now   = Date.now();
  const entry = _sent[ip] || { count: 0, firstAt: now };
  if (now - entry.firstAt > windowMs) { _sent[ip] = { count: 1, firstAt: now }; return true; }
  if (entry.count >= max) return false;
  entry.count++;
  _sent[ip] = entry;
  return true;
}

// ── Shared styles ──────────────────────────────────────────────────
const BASE_WRAPPER = `
  <!DOCTYPE html>
  <html lang="es">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#060B14;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060B14;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
        <!-- LOGO -->
        <tr><td align="center" style="padding-bottom:28px">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:linear-gradient(135deg,#00D4AA,#6366F1);border-radius:14px;padding:10px 20px">
              <span style="font-size:1.2rem;font-weight:900;color:#fff;letter-spacing:-.04em">💸 MoneyNest</span>
            </td>
          </tr></table>
        </td></tr>
        <!-- CARD -->
        {{CARD}}
        <!-- FOOTER -->
        <tr><td align="center" style="padding-top:24px">
          <p style="margin:0;font-size:.68rem;color:#334155;line-height:1.7;text-align:center">
            MoneyNest · InvestGrid · 2026<br>
            Si no realizaste esta acción, puedes ignorar este email con total seguridad.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
  </body></html>`;

function wrapCard(cardHtml: string): string {
  return BASE_WRAPPER.replace('{{CARD}}', cardHtml);
}

// ════════════════════════════════════════════════════════════════
//  TEMPLATE — BIENVENIDA
// ════════════════════════════════════════════════════════════════

function templateConfirmacion(nombre: string): { subject: string; html: string } {
  const firstName = nombre ? nombre.split(' ')[0] : '';
  return {
    subject: '¡Bienvenido a MoneyNest! 🎉 Tu prueba gratuita ha empezado',
    html: wrapCard(`
      <tr><td style="background:#0D1424;border:1px solid rgba(255,255,255,.07);border-radius:24px;overflow:hidden">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="background:linear-gradient(90deg,#00D4AA,#6366F1,#00D4AA);height:3px;font-size:0;line-height:0">&nbsp;</td></tr>
          <tr><td style="padding:40px 36px 32px">
            <p style="margin:0 0 8px;font-size:.72rem;font-weight:700;color:#00D4AA;text-transform:uppercase;letter-spacing:.12em">Bienvenido/a a MoneyNest</p>
            <h1 style="margin:0 0 16px;font-size:1.9rem;font-weight:900;color:#F1F5F9;letter-spacing:-.05em;line-height:1.15">
              Hola${firstName ? ', ' + firstName : ''}! 👋
            </h1>
            <p style="margin:0 0 28px;font-size:.92rem;color:#94A3B8;line-height:1.75">
              Tu cuenta está lista. Tienes
              <strong style="color:#F1F5F9;background:rgba(0,212,170,.12);padding:2px 8px;border-radius:6px;border:1px solid rgba(0,212,170,.25)">24 horas de prueba gratuita</strong>
              para descubrir todo lo que MoneyNest puede hacer por tus finanzas.
            </p>
            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px">
              <tr><td style="background:linear-gradient(135deg,#00D4AA,#00A882);border-radius:13px;box-shadow:0 8px 28px rgba(0,212,170,.35)">
                <a href="https://moneynest.app" style="display:inline-block;padding:15px 36px;font-size:.92rem;font-weight:800;color:#0A0E17;text-decoration:none;letter-spacing:-.02em">
                  Abrir MoneyNest →
                </a>
              </td></tr>
            </table>
            <!-- Features 2x2 -->
            <p style="margin:0 0 12px;font-size:.68rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.1em">Qué puedes hacer ahora mismo</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              <tr>
                <td width="50%" style="padding:0 5px 10px 0">
                  <table width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td style="background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:14px">
                      <div style="font-size:1.2rem;margin-bottom:5px">💰</div>
                      <div style="font-size:.8rem;font-weight:700;color:#E2E8F0">Ingresos y gastos</div>
                      <div style="font-size:.7rem;color:#64748B;margin-top:2px">Registra y categoriza</div>
                    </td>
                  </tr></table>
                </td>
                <td width="50%" style="padding:0 0 10px 5px">
                  <table width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td style="background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:14px">
                      <div style="font-size:1.2rem;margin-bottom:5px">📈</div>
                      <div style="font-size:.8rem;font-weight:700;color:#E2E8F0">Inversiones</div>
                      <div style="font-size:.7rem;color:#64748B;margin-top:2px">Cartera y rendimiento</div>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding:0 5px 0 0">
                  <table width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td style="background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:14px">
                      <div style="font-size:1.2rem;margin-bottom:5px">🎯</div>
                      <div style="font-size:.8rem;font-weight:700;color:#E2E8F0">Objetivos</div>
                      <div style="font-size:.7rem;color:#64748B;margin-top:2px">Metas de ahorro</div>
                    </td>
                  </tr></table>
                </td>
                <td width="50%" style="padding:0 0 0 5px">
                  <table width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td style="background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:14px">
                      <div style="font-size:1.2rem;margin-bottom:5px">📊</div>
                      <div style="font-size:.8rem;font-weight:700;color:#E2E8F0">Análisis</div>
                      <div style="font-size:.7rem;color:#64748B;margin-top:2px">Tendencias y reportes</div>
                    </td>
                  </tr></table>
                </td>
              </tr>
            </table>
            <!-- Trial reminder -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);border-radius:12px;padding:14px 18px">
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="font-size:1.3rem;vertical-align:middle;padding-right:12px">⏳</td>
                  <td>
                    <div style="font-size:.8rem;font-weight:700;color:#A5B4FC">Tu prueba gratuita · 24 horas</div>
                    <div style="font-size:.72rem;color:#64748B;margin-top:2px">Después puedes continuar con el Plan Local por solo 5€ único</div>
                  </td>
                </tr></table>
              </td></tr>
            </table>
          </td></tr>
          <!-- card footer -->
          <tr><td style="background:#080E1A;padding:18px 36px;border-top:1px solid rgba(255,255,255,.05)">
            <p style="margin:0;font-size:.68rem;color:#334155;text-align:center">MoneyNest · InvestGrid · 2026 · Si no creaste esta cuenta, ignora este email.</p>
          </td></tr>
        </table>
      </td></tr>`),
  };
}


// ════════════════════════════════════════════════════════════════
//  TEMPLATE — VERIFICACIÓN OTP (código 6 dígitos)
// ════════════════════════════════════════════════════════════════

function templateOtp(nombre: string, codigo: string): { subject: string; html: string } {
  const firstName = nombre ? nombre.split(' ')[0] : '';
  // Split code into individual digit spans for big display
  const digits = codigo.split('').map(d =>
    `<td style="padding:0 4px"><div style="background:#111827;border:1.5px solid rgba(99,102,241,.35);border-radius:10px;width:44px;height:56px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;font-weight:900;color:#A5B4FC;letter-spacing:0;text-align:center;line-height:56px">${d}</div></td>`
  ).join('');

  return {
    subject: `${codigo} — Tu código de verificación MoneyNest`,
    html: wrapCard(`
      <tr><td style="background:#0D1424;border:1px solid rgba(255,255,255,.07);border-radius:24px;overflow:hidden">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="background:linear-gradient(90deg,#6366F1,#00D4AA,#6366F1);height:3px;font-size:0;line-height:0">&nbsp;</td></tr>
          <tr><td style="padding:40px 36px 36px;text-align:center">
            <!-- Lock icon -->
            <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:rgba(99,102,241,.12);border:1.5px solid rgba(99,102,241,.3);border-radius:18px;font-size:2rem;margin-bottom:20px">🔐</div>
            <p style="margin:0 0 6px;font-size:.72rem;font-weight:700;color:#6366F1;text-transform:uppercase;letter-spacing:.12em">Verificación de email</p>
            <h1 style="margin:0 0 12px;font-size:1.7rem;font-weight:900;color:#F1F5F9;letter-spacing:-.04em;line-height:1.2">
              ${firstName ? 'Hola, ' + firstName + '!' : '¡Un paso más!'}
            </h1>
            <p style="margin:0 0 28px;font-size:.88rem;color:#94A3B8;line-height:1.7;max-width:380px;display:inline-block">
              Introduce este código en MoneyNest para verificar tu email y activar tu cuenta.
            </p>
            <!-- OTP CODE -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 10px">
              <tr>${digits}</tr>
            </table>
            <p style="margin:0 0 28px;font-size:.7rem;color:#475569">Caduca en <strong style="color:#94A3B8">15 minutos</strong></p>
            <!-- Divider -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr><td style="border-top:1px solid rgba(255,255,255,.06);font-size:0">&nbsp;</td></tr>
            </table>
            <!-- Security note -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="background:rgba(244,63,94,.06);border:1px solid rgba(244,63,94,.15);border-radius:10px;padding:12px 16px">
                <p style="margin:0;font-size:.75rem;color:#94A3B8;line-height:1.6;text-align:left">
                  🛡️ <strong style="color:#E2E8F0">Nunca te pediremos este código</strong> por teléfono, chat o email. Si no solicitaste esto, ignora este mensaje.
                </p>
              </td></tr>
            </table>
          </td></tr>
          <tr><td style="background:#080E1A;padding:18px 36px;border-top:1px solid rgba(255,255,255,.05)">
            <p style="margin:0;font-size:.68rem;color:#334155;text-align:center">MoneyNest · InvestGrid · 2026</p>
          </td></tr>
        </table>
      </td></tr>`),
  };
}


// ════════════════════════════════════════════════════════════════
//  TEMPLATE — SUGERENCIA (rediseñado)
// ════════════════════════════════════════════════════════════════

function templateSugerencia(tipo: string, categoria: string, mensaje: string, userEmail: string): { subject: string; html: string } {
  const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const hora  = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return {
    subject: `[MoneyNest] ${tipo}: ${categoria}`,
    html: wrapCard(`
      <tr><td style="background:#0D1424;border:1px solid rgba(255,255,255,.07);border-radius:24px;overflow:hidden">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="background:linear-gradient(90deg,#6366F1,#00D4AA);height:3px;font-size:0;line-height:0">&nbsp;</td></tr>
          <tr><td style="padding:36px">
            <!-- Header -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:.7rem;font-weight:700;color:#6366F1;text-transform:uppercase;letter-spacing:.1em">Nueva ${tipo.toLowerCase()}</p>
                  <h1 style="margin:0;font-size:1.5rem;font-weight:900;color:#F1F5F9;letter-spacing:-.04em">${categoria}</h1>
                </td>
                <td align="right" style="vertical-align:top">
                  <div style="background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2);border-radius:8px;padding:6px 12px;font-size:.7rem;color:#A5B4FC;white-space:nowrap">${fecha}</div>
                </td>
              </tr>
            </table>
            <!-- Meta -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background:#111827;border:1px solid rgba(255,255,255,.06);border-radius:12px;overflow:hidden">
              <tr>
                <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.05)">
                  <table cellpadding="0" cellspacing="0"><tr>
                    <td style="font-size:.68rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.08em;width:90px">Tipo</td>
                    <td style="font-size:.85rem;font-weight:600;color:#E2E8F0">${tipo}</td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.05)">
                  <table cellpadding="0" cellspacing="0"><tr>
                    <td style="font-size:.68rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.08em;width:90px">Categoría</td>
                    <td style="font-size:.85rem;font-weight:600;color:#E2E8F0">${categoria}</td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px">
                  <table cellpadding="0" cellspacing="0"><tr>
                    <td style="font-size:.68rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.08em;width:90px">De</td>
                    <td style="font-size:.85rem;font-weight:600;color:#00D4AA">${userEmail || 'Anónimo'}</td>
                  </tr></table>
                </td>
              </tr>
            </table>
            <!-- Message -->
            <p style="margin:0 0 8px;font-size:.68rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.1em">Mensaje</p>
            <div style="background:#111827;border:1px solid rgba(255,255,255,.07);border-left:3px solid #6366F1;border-radius:12px;padding:20px;font-size:.88rem;line-height:1.75;color:#CBD5E1;white-space:pre-wrap">${mensaje}</div>
            <!-- Timestamp -->
            <p style="margin:20px 0 0;font-size:.7rem;color:#334155;text-align:right">${fecha} · ${hora}</p>
          </td></tr>
          <tr><td style="background:#080E1A;padding:18px 36px;border-top:1px solid rgba(255,255,255,.05)">
            <p style="margin:0;font-size:.68rem;color:#334155;text-align:center">MoneyNest · InvestGrid · Panel de soporte</p>
          </td></tr>
        </table>
      </td></tr>`),
  };
}


// ════════════════════════════════════════════════════════════════
//  HANDLER PRINCIPAL
// ════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST')    return json({ error: 'method_not_allowed' }, 405);
  if (!RESEND_API_KEY)          return json({ error: 'RESEND_API_KEY not configured' }, 500);

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? 'unknown';
  if (!rateCheck(ip)) return json({ error: 'rate_limited' }, 429);

  let body: Record<string, string>;
  try { body = await req.json(); }
  catch { return json({ error: 'invalid_json' }, 400); }

  const { type, to, nombre, tipo, categoria, mensaje, userEmail, codigo } = body;

  let template: { subject: string; html: string };
  let recipient: string;

  if (type === 'confirmacion') {
    if (!to) return json({ error: 'to_required' }, 400);
    template  = templateConfirmacion(nombre || '');
    recipient = to;

  } else if (type === 'otp') {
    if (!to || !codigo) return json({ error: 'to_and_codigo_required' }, 400);
    template  = templateOtp(nombre || '', codigo);
    recipient = to;

  } else if (type === 'sugerencia') {
    if (!mensaje?.trim()) return json({ error: 'mensaje_required' }, 400);
    template  = templateSugerencia(tipo || 'Sugerencia', categoria || 'General', mensaje, userEmail || '');
    recipient = SUPPORT_EMAIL;

  } else {
    return json({ error: 'invalid_type' }, 400);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    FROM_EMAIL,
      to:      [recipient],
      subject: template.subject,
      html:    template.html,
      ...(type === 'sugerencia' && userEmail ? { reply_to: userEmail } : {}),
    }),
  });

  const result = await res.json();
  if (!res.ok) return json({ error: result?.message ?? 'resend_error' }, 502);

  return json({ ok: true, id: result.id });
});
