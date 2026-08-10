'use client';

import { useEffect } from 'react';

/** A cada quanto tempo recarrega a página inteira — pega stories novos/expirados e evita drift de estado numa aba que fica dias aberta. */
const RELOAD_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Wrapper client-side pra rodar a tela como kiosk numa TV: tenta entrar em
 * tela cheia sozinho (nem todo navegador permite sem gesto do usuário — por
 * isso também entra em tela cheia no primeiro toque/clique, como reforço) e
 * recarrega a página periodicamente pra buscar stories atualizados, já que
 * fica ligada sem ninguém interagindo.
 */
export function TvKiosk({ children }: { children: React.ReactNode }) {
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

    const reloadTimer = setInterval(() => window.location.reload(), RELOAD_INTERVAL_MS);

    return () => {
      window.removeEventListener('click', onFirstInteraction);
      clearInterval(reloadTimer);
    };
  }, []);

  return <>{children}</>;
}
