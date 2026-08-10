import type { NextRequest } from 'next/server';

/**
 * `request.nextUrl.origin` reflete o bind interno do servidor (ex.:
 * localhost:3000), não o host público — atrás de um proxy/túnel (usado pra
 * testar local sem HTTPS, exigido pelos dois logins) isso gera um
 * redirect_uri errado. Os headers x-forwarded-host/x-forwarded-proto são o
 * jeito padrão de saber o host de verdade que o navegador usou.
 */
export function getRedirectUri(request: NextRequest, path: string): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host;
  const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '');
  return `${proto}://${host}${path}`;
}
