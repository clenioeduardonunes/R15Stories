import { getStories } from '@/lib/instagram';
import { StoryViewer } from '@/components/StoryViewer';
import { TvKiosk } from '@/components/TvKiosk';

const HANDLE = process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || 'academia';

export const revalidate = 300;

type TvRotation = 'none' | 'cw' | 'ccw';

/**
 * Como a TV foi FISICAMENTE virada (não a rotação do conteúdo). "cw" é o
 * padrão porque é como a TV está montada hoje — ver README > "Rodando numa
 * TV". Trocável por `?tvRotation=ccw` ou `?tvRotation=none` sem precisar
 * mexer em código se a TV for remontada de outro jeito depois.
 */
function parseRotation(value: string | undefined): TvRotation {
  if (value === 'none' || value === 'cw' || value === 'ccw') return value;
  return 'cw';
}

/**
 * Tela pra rodar numa TV: sem cabeçalho, sem legenda, preenche a tela toda,
 * em loop, recarregando sozinha (ver TvKiosk). A maioria das TVs não gira
 * de verdade — o painel continua reportando resolução landscape mesmo
 * montado de lado — então quando `rotation !== 'none'` o conteúdo é
 * desenhado com largura/altura TROCADAS (100dvh × 100dvw) e girado de
 * volta na direção oposta à virada física, pra compensar e aparecer em pé
 * pra quem olha a TV já virada.
 */
export default async function TvPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const rotationParam = typeof params.tvRotation === 'string' ? params.tvRotation : undefined;
  const rotation = parseRotation(rotationParam);
  const rotated = rotation !== 'none';
  const contentDeg = rotation === 'cw' ? -90 : rotation === 'ccw' ? 90 : 0;

  const { stories } = await getStories();

  return (
    <TvKiosk>
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
          <StoryViewer stories={stories} handle={HANDLE} loop fullBleed />
        </div>
      </div>
    </TvKiosk>
  );
}
