import { NextRequest, NextResponse } from 'next/server';
import { getRedirectUri } from '@/lib/instagram-oauth';

/**
 * Login via Facebook (Instagram Graph API clássica) — o único jeito que
 * dá acesso a stories postados organicamente (ver `/api/auth/instagram` pra
 * entendimento do porquê a API "Instagram Login" não serve pra isso). O
 * `redirect_uri` PRECISA estar cadastrado no painel do App, na seção do
 * produto "Facebook Login" (não a do produto Instagram).
 */
export async function GET(request: NextRequest) {
  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: 'FACEBOOK_APP_ID não configurado no .env.local.' }, { status: 500 });
  }

  const redirectUri = getRedirectUri(request, '/api/auth/facebook/callback');

  const authorizeUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
  authorizeUrl.searchParams.set('client_id', appId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'pages_show_list,pages_read_engagement,instagram_basic');

  return NextResponse.redirect(authorizeUrl);
}
