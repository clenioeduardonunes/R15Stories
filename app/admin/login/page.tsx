'use client';

import { useActionState } from 'react';
import { login } from './actions';

export default function AdminLogin() {
  const [state, formAction, pending] = useActionState(login, { error: false });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 px-4 text-neutral-100">
      <h1 className="text-lg font-semibold">Painel R15 Academia</h1>
      <form action={formAction} className="flex w-full max-w-xs flex-col gap-3">
        <input
          type="password"
          name="password"
          placeholder="Senha"
          autoFocus
          required
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm outline-none focus:border-red-600"
        />
        {state.error && <p className="text-sm text-red-500">Senha incorreta.</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
        >
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
