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

    // Wake Lock: pede pro navegador não deixar a tela dormir enquanto essa
    // página estiver aberta. Ajuda contra o dispositivo/TV entrando em modo
    // de espera por "inatividade" — a tela fica muito tempo parecendo
    // estática (só a barra de progresso mexe). Nem todo navegador/TV
    // suporta (ex.: alguns embarcados de Smart TV não têm), e o lock é
    // solto automaticamente se a aba for pra background — por isso
    // reconquista no `visibilitychange`.
    let wakeLock: WakeLockSentinel | null = null;
    async function requestWakeLock() {
      if (!('wakeLock' in navigator)) return;
      try {
        wakeLock = await navigator.wakeLock.request('screen');
      } catch {
        // Sem suporte, sem permissão, ou aba não visível no momento — ignora.
      }
    }
    requestWakeLock();

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') requestWakeLock();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    // "Vídeo fantasma": quase toda Smart TV (inclusive as com Wake Lock não
    // suportado, caso comum em navegadores embutidos tipo webOS da LG)
    // suspende a tela por inatividade olhando se tem VÍDEO TOCANDO — é o
    // sinal que os apps de streaming usam pra evitar isso, bem mais
    // confiável que Wake Lock nesses navegadores. Gera um vídeo 100% no
    // navegador (canvas -> captureStream), sem nenhum arquivo/requisição de
    // rede, 1x1px, invisível, sempre tocando enquanto a página estiver aberta.
    let ghostVideo: HTMLVideoElement | null = null;
    let ghostRaf: number | null = null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      const ctx = canvas.getContext('2d');
      function drawFrame() {
        if (ctx) {
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ghostRaf = requestAnimationFrame(drawFrame);
      }
      drawFrame();

      const stream = canvas.captureStream(1);
      ghostVideo = document.createElement('video');
      ghostVideo.muted = true;
      ghostVideo.playsInline = true;
      ghostVideo.setAttribute('aria-hidden', 'true');
      Object.assign(ghostVideo.style, {
        position: 'fixed',
        width: '1px',
        height: '1px',
        opacity: '0',
        pointerEvents: 'none',
      });
      ghostVideo.srcObject = stream;
      document.body.appendChild(ghostVideo);
      ghostVideo.play().catch(() => undefined);
    } catch {
      // captureStream não suportado nesse navegador — sem esse reforço, só o Wake Lock mesmo.
    }

    return () => {
      window.removeEventListener('click', onFirstInteraction);
      clearInterval(reloadTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      wakeLock?.release().catch(() => undefined);
      if (ghostRaf !== null) cancelAnimationFrame(ghostRaf);
      ghostVideo?.remove();
    };
  }, [reloadIntervalMs]);

  return <>{children}</>;
}
