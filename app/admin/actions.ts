'use server';

import { del } from '@vercel/blob';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath, updateTag } from 'next/cache';

/** Chamado pelo cliente depois que o upload (direto pro Blob) já terminou — só atualiza cache. */
export async function onAdUploaded(): Promise<void> {
  updateTag('ads');
  revalidatePath('/admin');
  revalidatePath('/tv');
}

export async function deleteAd(pathname: string): Promise<void> {
  await del(pathname);
  updateTag('ads');
  revalidatePath('/admin');
  revalidatePath('/tv');
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('r15_admin');
  redirect('/admin/login');
}
