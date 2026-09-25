export type TvRotation = 'none' | 'cw' | 'ccw';

/** Como a tela foi FISICAMENTE virada (não a rotação do conteúdo) — ver README > "Rodando numa TV". */
export function parseRotation(value: string | undefined, fallback: TvRotation = 'cw'): TvRotation {
  if (value === 'none' || value === 'cw' || value === 'ccw') return value;
  return fallback;
}

/**
 * Compensa telas montadas de lado: a maioria não gira de verdade (o painel
 * continua reportando resolução landscape mesmo virado fisicamente), então
 * desenha o conteúdo com largura/altura trocadas e gira de volta na direção
 * oposta à virada física, pra aparecer em pé certinho.
 */
export function RotatedFullscreen({ rotation, children }: { rotation: TvRotation; children: React.ReactNode }) {
  const rotated = rotation !== 'none';
  const contentDeg = rotation === 'cw' ? -90 : rotation === 'ccw' ? 90 : 0;

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          width: rotated ? '100dvh' : '100dvw',
          height: rotated ? '100dvw' : '100dvh',
          transform: rotated ? `translate(-50%, -50%) rotate(${contentDeg}deg)` : 'translate(-50%, -50%)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
