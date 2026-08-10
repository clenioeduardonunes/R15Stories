import { NextRequest, NextResponse } from 'next/server';
import { getRedirectUri } from '@/lib/instagram-oauth';

function htmlPage(title: string, bodyHtml: string, status = 200): NextResponse {
  return new NextResponse(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body { font-family: -apple-system, sans-serif; max-width: 640px; margin: 60px auto; padding: 0 20px; line-height: 1.5; }
      code, pre { background: #f4f4f5; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
      pre { padding: 16px; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
      .error { color: #b91c1c; }
      .field { margin: 20px 0; }
      .field label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; }
    </style></head><body>${bodyHtml}</body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

/**
 * Callback do OAuth do Instagram: troca o `code` por um token curto, esse
 * token curto por um de longa duração (~60 dias) e mostra os valores pra
 * colar no `.env.local` (`INSTAGRAM_ACCESS_TOKEN` e
 * `INSTAGRAM_BUSINESS_ACCOUNT_ID`). Não escreve nada em disco sozinho —
 * é só um passo manual único (ou a cada ~60 dias, quando o token expira).
 */
export async function GET(request: NextRequest) {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!appId || !appSecret) {
    return htmlPage(
      'Erro',
      '<h1 class="error">Configuração ausente</h1><p>INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET não estão no .env.local.</p>',
      500,
    );
  }

  const oauthError = request.nextUrl.searchParams.get('error');
  if (oauthError) {
    return htmlPage(
      'Login cancelado',
      `<h1 class="error">Login cancelado</h1><p>${request.nextUrl.searchParams.get('error_description') ?? oauthError}</p>`,
    );
  }

  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return htmlPage('Erro', '<h1 class="error">Faltou o parâmetro "code" — inicie de novo por /api/auth/instagram/start.</h1>', 400);
  }

  const redirectUri = getRedirectUri(request, '/api/auth/instagram/callback');

  try {
    // Passo 1: code -> token curto
    const shortLivedRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    });
    const shortLivedData = await shortLivedRes.json();
    if (!shortLivedRes.ok) {
      return htmlPage(
        'Erro na troca do código',
        `<h1 class="error">Erro ao trocar o código pelo token curto</h1><pre>${JSON.stringify(shortLivedData, null, 2)}</pre>`,
        400,
      );
    }
    const shortLivedToken: string = shortLivedData.access_token;

    // Passo 2: token curto -> token de longa duração (~60 dias)
    const exchangeUrl = new URL('https://graph.instagram.com/access_token');
    exchangeUrl.searchParams.set('grant_type', 'ig_exchange_token');
    exchangeUrl.searchParams.set('client_secret', appSecret);
    exchangeUrl.searchParams.set('access_token', shortLivedToken);
    const longLivedRes = await fetch(exchangeUrl);
    const longLivedData = await longLivedRes.json();
    if (!longLivedRes.ok) {
      return htmlPage(
        'Erro na troca pelo token longo',
        `<h1 class="error">Token curto funcionou, mas a troca pelo de longa duração falhou</h1><pre>${JSON.stringify(longLivedData, null, 2)}</pre>`,
        400,
      );
    }
    const longLivedToken: string = longLivedData.access_token;

    // Confirma a conta (id + username) com o token final, pra exibir na tela.
    const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${longLivedToken}`);
    const me = await meRes.json();

    return htmlPage(
      'Instagram conectado',
      `<h1>✅ Conectado como @${me.username ?? '?'}</h1>
      <p>Copia esses dois valores pro <code>.env.local</code> (baseado no <code>.env.example</code>):</p>
      <div class="field"><label>INSTAGRAM_ACCESS_TOKEN (válido por ~${Math.round((longLivedData.expires_in ?? 0) / 86400)} dias)</label><pre>${longLivedToken}</pre></div>
      <div class="field"><label>INSTAGRAM_BUSINESS_ACCOUNT_ID</label><pre>${me.id}</pre></div>
      <p>Depois de salvar, reinicie o <code>npm run dev</code> pra ele ler as novas variáveis.</p>`,
    );
  } catch (err) {
    return htmlPage(
      'Erro',
      `<h1 class="error">Erro de rede</h1><pre>${err instanceof Error ? err.message : String(err)}</pre>`,
      500,
    );
  }
}
