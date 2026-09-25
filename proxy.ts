import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/admin/:path*'],
};

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next();

  const session = request.cookies.get('r15_admin')?.value;
  if (session && session === process.env.ADMIN_PASSWORD) return NextResponse.next();

  return NextResponse.redirect(new URL('/admin/login', request.url));
}
