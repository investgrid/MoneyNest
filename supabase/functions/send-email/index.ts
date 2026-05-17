/**
 * MoneyNest — send-email Edge Function v3
 *
 * Tipos:
 *   confirmacion  — email de bienvenida
 *   otp           — codigo de verificacion 6 digitos
 *   sugerencia    — feedback de usuarios a soporte
 *
 * Variables de entorno:
 *   RESEND_API_KEY   — API key de resend.com
 *   FROM_EMAIL       — email verificado en Resend
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

// Rate limiting por IP
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

const LOGO_URL = 'https://jwddciqqhmfkbqhdrfre.supabase.co/storage/v1/object/public/assets/logo-email.png';

// Envuelve cualquier card en el layout base
function wrap(cardHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>
<body style="margin:0;padding:0;background-color:#060B14;font-family:Helvetica Neue,Helvetica,Arial,sans-serif">
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#060B14">
<tr><td align="center" style="padding:40px 16px">
<table width="560" border="0" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

  <!-- LOGO -->
  <tr><td align="center" style="padding-bottom:32px">
    <table border="0" cellpadding="0" cellspacing="0">
    <tr>
      <td style="vertical-align:middle;padding-right:12px">
        <img src="${LOGO_URL}" width="65" height="65" alt="MoneyNest" style="display:block;border:0">
      </td>
      <td style="vertical-align:middle">
        <span style="font-size:33px;font-weight:900;color:#ffffff;letter-spacing:-1.5px;font-family:Helvetica Neue,Helvetica,Arial,sans-serif">Money</span><span style="font-size:33px;font-weight:900;color:#00D4AA;letter-spacing:-1.5px;font-family:Helvetica Neue,Helvetica,Arial,sans-serif">Nest</span>
      </td>
    </tr>
    </table>
  </td></tr>

  <!-- CARD -->
  ${cardHtml}


</table>
</td></tr>
</table>
</body>
</html>`;
}


// ════════════════════════════════════════════════
//  TEMPLATE — BIENVENIDA
// ════════════════════════════════════════════════

function templateConfirmacion(nombre: string): { subject: string; html: string } {
  const firstName = nombre ? nombre.split(' ')[0] : '';
  const greeting  = firstName ? `Hola, ${firstName}!` : `Bienvenido!`;

  return {
    subject: 'Bienvenido a MoneyNest! Tu prueba gratuita ha empezado',
    html: wrap(`
      <tr><td style="background-color:#0D1424;border:1px solid rgba(255,255,255,0.07);border-radius:20px;overflow:hidden">
        <table width="100%" border="0" cellpadding="0" cellspacing="0">

          <!-- barra gradiente -->
          <tr><td height="3" style="background:linear-gradient(90deg,#00D4AA,#6366F1,#00D4AA);font-size:0;line-height:0">&nbsp;</td></tr>

          <!-- cuerpo -->
          <tr><td style="padding:36px 36px 32px">

            <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;color:#00D4AA;text-transform:uppercase;letter-spacing:2px">Cuenta activada</p>
            <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:900;color:#F1F5F9;letter-spacing:-1px;line-height:1.2">${greeting} &#128075;</h1>
            <p style="margin:0 0 28px 0;font-size:15px;color:#94A3B8;line-height:1.7">
              Tu cuenta MoneyNest esta lista. Tienes
              <strong style="color:#F1F5F9;background-color:rgba(0,212,170,0.12);padding:1px 7px;border-radius:5px">24 horas de prueba gratuita</strong>
              para explorar todas las funciones.
            </p>

            <!-- features 2x2 -->
            <p style="margin:0 0 12px 0;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1px">Que puedes hacer ahora mismo</p>
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding:0 5px 10px 0">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr><td style="background-color:#111827;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px">
                    <p style="margin:0 0 5px 0;font-size:20px">&#128176;</p>
                    <p style="margin:0 0 2px 0;font-size:13px;font-weight:700;color:#E2E8F0">Ingresos y gastos</p>
                    <p style="margin:0;font-size:11px;color:#64748B">Registra y categoriza</p>
                  </td></tr>
                  </table>
                </td>
                <td width="50%" style="padding:0 0 10px 5px">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr><td style="background-color:#111827;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px">
                    <p style="margin:0 0 5px 0;font-size:20px">&#128200;</p>
                    <p style="margin:0 0 2px 0;font-size:13px;font-weight:700;color:#E2E8F0">Inversiones</p>
                    <p style="margin:0;font-size:11px;color:#64748B">Cartera y rendimiento</p>
                  </td></tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding:0 5px 0 0">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr><td style="background-color:#111827;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px">
                    <p style="margin:0 0 5px 0;font-size:20px">&#127919;</p>
                    <p style="margin:0 0 2px 0;font-size:13px;font-weight:700;color:#E2E8F0">Objetivos</p>
                    <p style="margin:0;font-size:11px;color:#64748B">Metas de ahorro</p>
                  </td></tr>
                  </table>
                </td>
                <td width="50%" style="padding:0 0 0 5px">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr><td style="background-color:#111827;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px">
                    <p style="margin:0 0 5px 0;font-size:20px">&#128202;</p>
                    <p style="margin:0 0 2px 0;font-size:13px;font-weight:700;color:#E2E8F0">Analisis</p>
                    <p style="margin:0;font-size:11px;color:#64748B">Tendencias y reportes</p>
                  </td></tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- trial reminder -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:20px">
            <tr><td style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:14px 16px">
              <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:20px;vertical-align:middle;padding-right:12px">&#9203;</td>
                <td>
                  <p style="margin:0 0 2px 0;font-size:13px;font-weight:700;color:#A5B4FC">Tu prueba gratuita &middot; 24 horas</p>
                  <p style="margin:0;font-size:11px;color:#64748B">Despues puedes continuar con el Plan Local por solo 5&euro; unico</p>
                </td>
              </tr>
              </table>
            </td></tr>
            </table>

          </td></tr>

          <!-- card footer -->
          <tr><td style="background-color:#080E1A;padding:16px 36px;border-top:1px solid rgba(255,255,255,0.05)">
            <p style="margin:0;font-size:11px;color:#334155;text-align:center">MoneyNest &middot; InvestGrid &middot; Si no creaste esta cuenta, ignora este email.</p>
          </td></tr>

        </table>
      </td></tr>`),
  };
}


// ════════════════════════════════════════════════
//  TEMPLATE — OTP
// ════════════════════════════════════════════════

function templateOtp(nombre: string, codigo: string): { subject: string; html: string } {
  const firstName = nombre ? nombre.split(' ')[0] : '';
  const digits    = codigo.split('');

  // Cada digito en su propia celda — compatible con todos los email clients
  const digitCells = digits.map(d => `
    <td style="padding:0 4px">
      <table border="0" cellpadding="0" cellspacing="0">
      <tr><td width="44" height="56" align="center" valign="middle"
        style="background-color:#111827;border:1px solid rgba(99,102,241,0.4);border-radius:10px;width:44px;height:56px;font-size:26px;font-weight:900;color:#A5B4FC;font-family:Helvetica Neue,Helvetica,Arial,sans-serif">
        ${d}
      </td></tr>
      </table>
    </td>`).join('');

  return {
    subject: `${codigo} es tu codigo de verificacion MoneyNest`,
    html: wrap(`
      <tr><td style="background-color:#0D1424;border:1px solid rgba(255,255,255,0.07);border-radius:20px;overflow:hidden">
        <table width="100%" border="0" cellpadding="0" cellspacing="0">

          <!-- barra gradiente -->
          <tr><td height="3" style="background:linear-gradient(90deg,#6366F1,#00D4AA,#6366F1);font-size:0;line-height:0">&nbsp;</td></tr>

          <!-- cuerpo centrado -->
          <tr><td align="center" style="padding:40px 36px 36px">

            <!-- icono -->
            <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
            <tr><td width="64" height="64" align="center" valign="middle"
              style="background-color:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);border-radius:16px;width:64px;height:64px;font-size:28px">
              &#128274;
            </td></tr>
            </table>

            <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;color:#6366F1;text-transform:uppercase;letter-spacing:2px">Verificacion de email</p>
            <h1 style="margin:0 0 12px 0;font-size:26px;font-weight:900;color:#F1F5F9;letter-spacing:-1px">
              ${firstName ? `Hola, ${firstName}!` : 'Un paso mas!'}
            </h1>
            <p style="margin:0 0 28px 0;font-size:14px;color:#94A3B8;line-height:1.65;max-width:360px">
              Introduce este codigo en MoneyNest para verificar tu email y activar tu cuenta.
            </p>

            <!-- codigo OTP -->
            <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 10px auto">
            <tr>${digitCells}</tr>
            </table>
            <p style="margin:0 0 28px 0;font-size:12px;color:#475569">Caduca en <strong style="color:#94A3B8">15 minutos</strong></p>

            <!-- separador -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
            <tr><td height="1" style="background-color:rgba(255,255,255,0.06);font-size:0;line-height:0">&nbsp;</td></tr>
            </table>

            <!-- aviso seguridad -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr><td style="background-color:rgba(244,63,94,0.06);border:1px solid rgba(244,63,94,0.15);border-radius:10px;padding:12px 16px;text-align:left">
              <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6">
                &#128737; <strong style="color:#E2E8F0">Nunca te pediremos este codigo</strong> por telefono, chat o email.
                Si no solicitaste esto, ignora este mensaje.
              </p>
            </td></tr>
            </table>

          </td></tr>

          <!-- card footer -->
          <tr><td style="background-color:#080E1A;padding:16px 36px;border-top:1px solid rgba(255,255,255,0.05)">
            <p style="margin:0;font-size:11px;color:#334155;text-align:center">MoneyNest &middot; InvestGrid &middot; 2026</p>
          </td></tr>

        </table>
      </td></tr>`),
  };
}


// ════════════════════════════════════════════════
//  TEMPLATE — SUGERENCIA
// ════════════════════════════════════════════════

function templateSugerencia(tipo: string, categoria: string, mensaje: string, userEmail: string): { subject: string; html: string } {
  // Escapar caracteres especiales para evitar simbolos raros
  const esc = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const hora  = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return {
    subject: `[MoneyNest] ${esc(tipo)}: ${esc(categoria)}`,
    html: wrap(`
      <tr><td style="background-color:#0D1424;border:1px solid rgba(255,255,255,0.07);border-radius:20px;overflow:hidden">
        <table width="100%" border="0" cellpadding="0" cellspacing="0">

          <!-- barra gradiente -->
          <tr><td height="3" style="background:linear-gradient(90deg,#6366F1,#00D4AA);font-size:0;line-height:0">&nbsp;</td></tr>

          <!-- cuerpo -->
          <tr><td style="padding:32px 32px 28px">

            <!-- header -->
            <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:#6366F1;text-transform:uppercase;letter-spacing:2px">Nueva ${esc(tipo.toLowerCase())}</p>
            <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:900;color:#F1F5F9;letter-spacing:-0.5px">${esc(categoria)}</h1>

            <!-- meta tabla -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background-color:#111827;border:1px solid rgba(255,255,255,0.06);border-radius:10px">
              <tr>
                <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05)">
                  <table border="0" cellpadding="0" cellspacing="0"><tr>
                    <td width="80" style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1px">Tipo</td>
                    <td style="font-size:13px;font-weight:600;color:#E2E8F0">${esc(tipo)}</td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05)">
                  <table border="0" cellpadding="0" cellspacing="0"><tr>
                    <td width="80" style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1px">Categoria</td>
                    <td style="font-size:13px;font-weight:600;color:#E2E8F0">${esc(categoria)}</td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px">
                  <table border="0" cellpadding="0" cellspacing="0"><tr>
                    <td width="80" style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1px">De</td>
                    <td style="font-size:13px;font-weight:600;color:#00D4AA">${esc(userEmail || 'Anonimo')}</td>
                  </tr></table>
                </td>
              </tr>
            </table>

            <!-- mensaje -->
            <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1px">Mensaje</p>
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr><td style="background-color:#111827;border:1px solid rgba(255,255,255,0.07);border-left:3px solid #6366F1;border-radius:10px;padding:18px;font-size:14px;line-height:1.75;color:#CBD5E1;white-space:pre-wrap">${esc(mensaje)}</td></tr>
            </table>

            <!-- timestamp -->
            <p style="margin:16px 0 0 0;font-size:11px;color:#334155;text-align:right">${fecha} &middot; ${hora}</p>

          </td></tr>

          <!-- card footer -->
          <tr><td style="background-color:#080E1A;padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05)">
            <p style="margin:0;font-size:11px;color:#334155;text-align:center">MoneyNest &middot; InvestGrid &middot; Panel de soporte</p>
          </td></tr>

        </table>
      </td></tr>`),
  };
}


// ════════════════════════════════════════════════
//  HANDLER
// ════════════════════════════════════════════════

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
