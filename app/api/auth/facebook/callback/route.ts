import { NextRequest, NextResponse } from 'next/server';
import { getRedirectUri } from '@/lib/instagram-oauth';

const API_VERSION = 'v21.0';

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
      .page { border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; margin: 16px 0; }
    </style></head><body>${bodyHtml}</body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

/**
 * Callback do login via Facebook: code -> token de usuário curto -> token
 * de usuário de longa duração -> lista de Páginas administradas -> pra
 * cada Página, o Instagram Business Account vinculado (se tiver). O TOKEN
 * DA PÁGINA (não o de usuário) é o que vai em `INSTAGRAM_ACCESS_TOKEN` —
 * token de Página derivado de um token de usuário de longa duração não
 * expira sozinho (só se a permissão for revogada).
 */
export async function GET(request: NextRequest) {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) {
    return htmlPage('Erro', '<h1 class="error">FACEBOOK_APP_ID / FACEBOOK_APP_SECRET não estão no .env.local.</h1>', 500);
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
    return htmlPage('Erro', '<h1 class="error">Faltou o parâmetro "code" — inicie de novo por /api/auth/facebook/start.</h1>', 400);
  }

  const redirectUri = getRedirectUri(request, '/api/auth/facebook/callback');

  try {
    // Passo 1: code -> token de usuário curto
    const shortLivedUrl = new URL(`https://graph.facebook.com/${API_VERSION}/oauth/access_token`);
    shortLivedUrl.searchParams.set('client_id', appId);
    shortLivedUrl.searchParams.set('client_secret', appSecret);
    shortLivedUrl.searchParams.set('redirect_uri', redirectUri);
    shortLivedUrl.searchParams.set('code', code);
    const shortLivedRes = await fetch(shortLivedUrl);
    const shortLivedData = await shortLivedRes.json();
    if (!shortLivedRes.ok) {
      return htmlPage('Erro na troca do código', `<h1 class="error">Erro</h1><pre>${JSON.stringify(shortLivedData, null, 2)}</pre>`, 400);
    }

    // Passo 2: token de usuário curto -> longa duração
    const longLivedUrl = new URL(`https://graph.facebook.com/${API_VERSION}/oauth/access_token`);
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longLivedUrl.searchParams.set('client_id', appId);
    longLivedUrl.searchParams.set('client_secret', appSecret);
    longLivedUrl.searchParams.set('fb_exchange_token', shortLivedData.access_token);
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();
    if (!longLivedRes.ok) {
      return htmlPage('Erro na troca pelo token longo', `<h1 class="error">Erro</h1><pre>${JSON.stringify(longLivedData, null, 2)}</pre>`, 400);
    }
    const userToken: string = longLivedData.access_token;

    // Passo 3: Páginas administradas (cada uma já vem com seu próprio Page Access Token)
    const pagesRes = await fetch(
      `https://graph.facebook.com/${API_VERSION}/me/accounts?fields=id,name,access_token&access_token=${userToken}`,
    );
    const pagesData = await pagesRes.json();
    if (!pagesRes.ok) {
      return htmlPage('Erro ao listar Páginas', `<h1 class="error">Erro</h1><pre>${JSON.stringify(pagesData, null, 2)}</pre>`, 400);
    }
    const pages: FacebookPage[] = pagesData.data ?? [];
    if (pages.length === 0) {
      return htmlPage(
        'Nenhuma Página encontrada',
        '<h1 class="error">Sua conta não administra nenhuma Página do Facebook</h1><p>Confirme que está logando com a conta certa.</p>',
      );
    }

    // Passo 4: pra cada Página, busca o Instagram Business Account vinculado
    const results = await Promise.all(
      pages.map(async (page) => {
        const res = await fetch(
          `https://graph.facebook.com/${API_VERSION}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
        );
        const data = await res.json();
        return { page, instagramId: data.instagram_business_account?.id as string | undefined };
      }),
    );

    const withInstagram = results.filter((r) => r.instagramId);
    if (withInstagram.length === 0) {
      return htmlPage(
        'Nenhum Instagram vinculado',
        `<h1 class="error">Nenhuma das suas Páginas tem um Instagram Business vinculado</h1>
        <p>Páginas encontradas: ${pages.map((p) => p.name).join(', ')}</p>
        <p>Vincula o Instagram numa dessas Páginas (Configurações da Página → Contas vinculadas) e tenta de novo.</p>`,
      );
    }

    const fieldsHtml = withInstagram
      .map(
        ({ page, instagramId }) => `
      <div class="page">
        <p><strong>Página:</strong> ${page.name}</p>
        <div class="field"><label>INSTAGRAM_ACCESS_TOKEN</label><pre>${page.access_token}</pre></div>
        <div class="field"><label>INSTAGRAM_BUSINESS_ACCOUNT_ID</label><pre>${instagramId}</pre></div>
      </div>`,
      )
      .join('');

    return htmlPage(
      'Facebook conectado',
      `<h1>✅ Conectado</h1>
      <p>${withInstagram.length > 1 ? 'Achei mais de uma Página com Instagram vinculado — usa a certa (a da academia):' : 'Copia esses dois valores pro .env.local:'}</p>
      ${fieldsHtml}
      <p>Depois de salvar, reinicie o <code>npm run dev</code> pra ele ler as novas variáveis.</p>`,
    );
  } catch (err) {
    return htmlPage('Erro', `<h1 class="error">Erro de rede</h1><pre>${err instanceof Error ? err.message : String(err)}</pre>`, 500);
  }
}
