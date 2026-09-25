'use client';

import { useEffect, useRef, useState } from 'react';
import type { StoryItem } from '@/lib/instagram';

const DEFAULT_IMAGE_DURATION_MS = 5000;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function StoryViewer({
  stories,
  handle,
  loop = false,
  fullBleed = false,
  imageDurationMs = DEFAULT_IMAGE_DURATION_MS,
}: {
  stories: StoryItem[];
  handle: string;
  /** Ao chegar no último story, volta pro primeiro em vez de ficar parado — pra TV/kiosk rodando sozinha. */
  loop?: boolean;
  /** Preenche o elemento pai (sem card/cantos arredondados/largura máxima) — pra tela cheia. */
  fullBleed?: boolean;
  /** Quanto tempo (ms) cada imagem fica na tela antes de avançar — vídeos usam a duração real deles. */
  imageDurationMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const current = stories[index];
  const isLast = index === stories.length - 1;

  // Tempo decorrido (ms) da imagem atual — sobrevive ao pausar/retomar
  // (não reseta o progresso a cada toggle de `paused`, só troca de story).
  const elapsedMsRef = useRef(0);
  const lastIndexRef = useRef(index);

  /** Avança pro próximo — no último, volta pro primeiro se `loop`, senão fica parado ali. */
  function next() {
    setIndex((i) => {
      if (i < stories.length - 1) return i + 1;
      return loop ? 0 : i;
    });
  }

  function prev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  // Avança sozinho: imagem tem duração fixa (IMAGE_DURATION_MS), vídeo avança
  // pelo evento `onEnded` (progress vem do `onTimeUpdate` dele, não daqui).
  // Usa `setInterval` em vez de `requestAnimationFrame` — navegadores
  // embutidos de TV (ex.: Samsung Tizen) têm suporte fraco a rAF, que
  // trava a barra sem nunca avançar; setInterval funciona nesses navegadores.
  useEffect(() => {
    if (lastIndexRef.current !== index) {
      lastIndexRef.current = index;
      elapsedMsRef.current = 0;
    }
    if (!current || current.mediaType === 'VIDEO' || paused) return;

    const startedAt = Date.now() - elapsedMsRef.current;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      elapsedMsRef.current = elapsed;
      const pct = Math.min(1, elapsed / imageDurationMs);
      setProgress(pct);
      if (pct >= 1) {
        next();
      }
    }, 100);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current?.mediaType, paused, isLast, loop, imageDurationMs]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerSizeClass = fullBleed ? 'h-full w-full' : 'aspect-[9/16] w-full max-w-sm rounded-2xl shadow-2xl';

  if (!current) {
    return (
      <div className={`flex ${containerSizeClass} flex-col items-center justify-center gap-3 bg-neutral-900 p-8 text-center text-white`}>
        <p className="text-lg font-medium">Nenhum story ativo agora</p>
        <p className="text-sm text-neutral-400">
          Os stories somem depois de 24h — volte mais tarde ou siga a gente lá.
        </p>
        <a
          href={`https://instagram.com/${handle}`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-900"
        >
          @{handle} no Instagram
        </a>
      </div>
    );
  }

  return (
    <div className={`relative ${containerSizeClass} overflow-hidden bg-black`}>
      {/* Barras de progresso segmentadas, uma por story */}
      <div className="absolute inset-x-2 top-2 z-20 flex gap-1">
        {stories.map((s, i) => (
          <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full bg-white"
              style={{
                width: `${i < index ? 100 : i === index ? progress * 100 : 0}%`,
                transition: i === index ? 'none' : 'width 150ms linear',
              }}
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-x-3 top-5 z-20 flex items-center gap-2 text-white">
        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-orange-400 to-pink-600" />
        <span className="text-sm font-semibold">{handle}</span>
        <span className="text-xs text-white/70">{timeAgo(current.timestamp)}</span>
      </div>

      {current.mediaType === 'VIDEO' ? (
        <video
          ref={videoRef}
          key={current.id}
          src={current.mediaUrl}
          className="h-full w-full object-cover"
          // opacity quase-100% (não 1) força o navegador a compor o vídeo na
          // camada normal da página em vez de numa camada de hardware
          // separada — em alguns navegadores de TV essa camada de hardware
          // ignora a rotação CSS aplicada no restante da tela (ver
          // RotatedFullscreen). Depois desse truque, o vídeo passou a herdar
          // a rotação da página, mas ainda saía 180° invertido — por isso o
          // rotate(180deg) extra aqui, só nele.
          style={{ opacity: 0.999, transform: 'rotate(180deg)' }}
          autoPlay
          muted
          playsInline
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration) setProgress(v.currentTime / v.duration);
          }}
          onEnded={() => {
            if (isLast && !loop) setProgress(1);
            else next();
          }}
          onError={() => {
            next();
          }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current.mediaUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => {
            next();
          }}
        />
      )}

      {/* Zonas de toque: 30% esquerda = anterior, 70% direita = próximo (segura pausa) */}
      <button
        aria-label="Story anterior"
        onClick={prev}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        className="absolute inset-y-0 left-0 z-10 w-[30%]"
      />
      <button
        aria-label="Próximo story"
        onClick={next}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        className="absolute inset-y-0 right-0 z-10 w-[70%]"
      />

      {current.permalink && (
        <a
          href={current.permalink}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur"
        >
          Ver no Instagram
        </a>
      )}
    </div>
  );
}
