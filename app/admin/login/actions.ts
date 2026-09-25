'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(_prevState: { error: boolean }, formData: FormData): Promise<{ error: boolean }> {
  const password = formData.get('password');

  if (typeof password !== 'string' || password !== process.env.ADMIN_PASSWORD) {
    return { error: true };
  }

  const cookieStore = await cookies();
  cookieStore.set('r15_admin', password, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect('/admin');
}
