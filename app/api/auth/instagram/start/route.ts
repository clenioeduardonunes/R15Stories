import { NextRequest, NextResponse } from 'next/server';
import { getRedirectUri } from '@/lib/instagram-oauth';

/**
 * Ponto de partida do login via "Instagram API with Instagram Login"
 * (`graph.instagram.com`). ATENÇÃO: testado na prática e essa API NÃO
 * retorna stories postados organicamente pelo app do celular — só serve
 * pra ler perfil/mídia normal. Pra stories de verdade, usar o fluxo em
 * `/api/auth/facebook` (Instagram Graph API clássica, via Página do
 * Facebook), que é o que `lib/instagram.ts` usa hoje. Mantido aqui só de
 * referência/caso um dia sirva pra outra coisa (mensagens, comentários).
 */
export async function GET(request: NextRequest) {
  const appId = process.env.INSTAGRAM_APP_ID;
  if (!appId) {
    return NextResponse.json(
      { error: 'INSTAGRAM_APP_ID não configurado no .env.local.' },
      { status: 500 },
    );
  }

  const redirectUri = getRedirectUri(request, '/api/auth/instagram/callback');

  const authorizeUrl = new URL('https://www.instagram.com/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', appId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'instagram_business_basic');

  return NextResponse.redirect(authorizeUrl);
}
