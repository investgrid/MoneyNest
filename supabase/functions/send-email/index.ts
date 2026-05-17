/**
 * MoneyNest — send-email Edge Function
 * Envía emails usando Resend (resend.com).
 * Usos:
 *   - Sugerencias de usuarios → invest.grid.main@gmail.com
 *   - Confirmación de registro
 *   - Notificación de pago
 *
 * Variables de entorno requeridas en Supabase:
 *   RESEND_API_KEY   → tu API key de resend.com
 *   FROM_EMAIL       → el email verificado en Resend (ej: noreply@moneynest.app)
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

// ── Rate limiting básico por IP ────────────────────────────────────
const _sent: Record<string, { count: number; firstAt: number }> = {};
function rateCheck(ip: string): boolean {
  const now    = Date.now();
  const window = 10 * 60 * 1000; // 10 min
  const entry  = _sent[ip] || { count: 0, firstAt: now };
  if (now - entry.firstAt > window) { _sent[ip] = { count: 1, firstAt: now }; return true; }
  if (entry.count >= 5) return false;
  entry.count++;
  _sent[ip] = entry;
  return true;
}

// ── Email templates ────────────────────────────────────────────────

function templateSugerencia(tipo: string, categoria: string, mensaje: string, userEmail: string): { subject: string; html: string } {
  return {
    subject: `[MoneyNest] ${tipo}: ${categoria}`,
    html: `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0A0E17;color:#E8EFF7;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#00D4AA,#6366F1);padding:3px"></div>
        <div style="padding:32px">
          <div style="font-size:1.4rem;font-weight:800;letter-spacing:-.03em;margin-bottom:6px">MoneyNest</div>
          <div style="font-size:.8rem;color:#64748B;margin-bottom:28px">Nueva ${tipo.toLowerCase()} recibida</div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <tr><td style="padding:8px 0;font-size:.78rem;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.06em;width:100px">Tipo</td><td style="padding:8px 0;font-size:.88rem;color:#E8EFF7;font-weight:600">${tipo}</td></tr>
            <tr><td style="padding:8px 0;font-size:.78rem;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.06em">Categoría</td><td style="padding:8px 0;font-size:.88rem;color:#E8EFF7;font-weight:600">${categoria}</td></tr>
            <tr><td style="padding:8px 0;font-size:.78rem;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.06em">De</td><td style="padding:8px 0;font-size:.88rem;color:#00D4AA;font-weight:600">${userEmail || 'Anónimo'}</td></tr>
          </table>
          <div style="background:#111827;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:20px;font-size:.9rem;line-height:1.7;color:#CBD5E1;white-space:pre-wrap">${mensaje}</div>
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,.06);font-size:.72rem;color:#475569">MoneyNest · InvestGrid · ${new Date().toLocaleDateString('es-ES')}</div>
        </div>
      </div>`,
  };
}

function templateConfirmacion(nombre: string): { subject: string; html: string } {
  return {
    subject: '¡Bienvenido a MoneyNest! Tu trial de 24h ha empezado',
    html: `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0A0E17;color:#E8EFF7;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#00D4AA,#6366F1);padding:3px"></div>
        <div style="padding:32px">
          <div style="font-size:1.4rem;font-weight:800;letter-spacing:-.03em;margin-bottom:24px">MoneyNest</div>
          <div style="font-size:1.6rem;font-weight:800;letter-spacing:-.04em;margin-bottom:10px">Hola${nombre ? ', ' + nombre : ''}! 👋</div>
          <p style="color:#94A3B8;line-height:1.7;margin-bottom:24px">Tu cuenta MoneyNest está lista. Tienes <strong style="color:#00D4AA">24 horas de prueba gratuita</strong> para explorar todas las funciones.</p>
          <div style="background:#111827;border:1px solid rgba(0,212,170,.2);border-radius:12px;padding:20px;margin-bottom:24px">
            <div style="font-size:.78rem;font-weight:700;color:#00D4AA;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">Qué puedes hacer</div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <div style="font-size:.88rem;color:#CBD5E1">💰 Registrar ingresos y gastos</div>
              <div style="font-size:.88rem;color:#CBD5E1">📈 Gestionar inversiones y deudas</div>
              <div style="font-size:.88rem;color:#CBD5E1">🎯 Crear objetivos de ahorro</div>
              <div style="font-size:.88rem;color:#CBD5E1">📊 Ver análisis y tendencias</div>
            </div>
          </div>
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,.06);font-size:.72rem;color:#475569">MoneyNest · InvestGrid · Si no creaste esta cuenta, ignora este email.</div>
        </div>
      </div>`,
  };
}

// ── Handler principal ─────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST')    return json({ error: 'method_not_allowed' }, 405);

  if (!RESEND_API_KEY) return json({ error: 'RESEND_API_KEY not configured' }, 500);

  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? 'unknown';
  if (!rateCheck(ip)) return json({ error: 'rate_limited' }, 429);

  let body: Record<string, string>;
  try { body = await req.json(); }
  catch { return json({ error: 'invalid_json' }, 400); }

  const { type, to, nombre, tipo, categoria, mensaje, userEmail } = body;

  let template: { subject: string; html: string };
  let recipient: string;

  if (type === 'sugerencia') {
    if (!mensaje?.trim()) return json({ error: 'mensaje_required' }, 400);
    template  = templateSugerencia(tipo || 'Sugerencia', categoria || 'General', mensaje, userEmail || '');
    recipient = SUPPORT_EMAIL;

  } else if (type === 'confirmacion') {
    if (!to) return json({ error: 'to_required' }, 400);
    template  = templateConfirmacion(nombre || '');
    recipient = to;

  } else {
    return json({ error: 'invalid_type' }, 400);
  }

  // Send via Resend
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
