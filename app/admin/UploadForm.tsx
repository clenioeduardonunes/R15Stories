'use client';

import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { onAdUploaded } from './actions';

export function UploadForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = formRef.current?.elements.namedItem('file') as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      setError('Escolha um arquivo de vídeo.');
      return;
    }
    if (!file.type.startsWith('video/')) {
      setError('Só é possível enviar arquivos de vídeo.');
      return;
    }

    setPending(true);
    setError(null);
    try {
      await upload(`ads/${Date.now()}-${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });
      await onAdUploaded();
      formRef.current?.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar o vídeo.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
      <label className="text-sm font-semibold text-neutral-200">Adicionar vídeo institucional</label>
      <input
        type="file"
        name="file"
        accept="video/*"
        required
        className="text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-red-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-red-500"
      />
      <p className="text-xs text-neutral-500">MP4, até 50MB. Recomendado: vídeos curtos e comprimidos.</p>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-white disabled:opacity-60"
      >
        {pending ? 'Enviando…' : 'Enviar vídeo'}
      </button>
    </form>
  );
}
