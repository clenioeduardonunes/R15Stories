'use client';

import { useEffect } from 'react';

/** A cada quanto tempo recarrega a página inteira, por padrão — pega conteúdo novo/expirado e evita drift de estado numa aba que fica dias aberta. */
const DEFAULT_RELOAD_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Wrapper client-side pra rodar a tela como kiosk numa TV: tenta entrar em
 * tela cheia sozinho (nem todo navegador permite sem gesto do usuário — por
 * isso também entra em tela cheia no primeiro toque/clique, como reforço) e
 * recarrega a página periodicamente pra buscar conteúdo atualizado, já que
 * fica ligada sem ninguém interagindo.
 */
export function TvKiosk({
  children,
  reloadIntervalMs = DEFAULT_RELOAD_INTERVAL_MS,
}: {
  children: React.ReactNode;
  /** A cada quanto tempo (ms) recarrega a página sozinha. */
  reloadIntervalMs?: number;
}) {
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {
      // Sem gesto do usuário o navegador recusa — o clique abaixo cobre isso.
    });

    function onFirstInteraction() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => undefined);
      }
    }
    window.addEventListener('click', onFirstInteraction, { once: true });

    const reloadTimer = setInterval(() => window.location.reload(), reloadIntervalMs);

    return () => {
      window.removeEventListener('click', onFirstInteraction);
      clearInterval(reloadTimer);
    };
  }, [reloadIntervalMs]);

  return <>{children}</>;
}
