import { getStories } from '@/lib/instagram';
import { getAdVideos, mixStoriesWithAds } from '@/lib/ads';
import { StoryViewer } from '@/components/StoryViewer';
import { TvKiosk } from '@/components/TvKiosk';
import { RotatedFullscreen, parseRotation } from '@/components/RotatedFullscreen';

const HANDLE = process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || 'academia';

export const revalidate = 300;

/**
 * Tela pra rodar numa TV: sem cabeçalho, sem legenda, preenche a tela toda,
 * em loop, recarregando sozinha (ver TvKiosk). Compensação de rotação pra
 * telas montadas de lado — ver RotatedFullscreen.
 */
export default async function TvPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const rotationParam = typeof params.tvRotation === 'string' ? params.tvRotation : undefined;
  const rotation = parseRotation(rotationParam, 'ccw');

  const [{ stories }, ads] = await Promise.all([getStories(), getAdVideos()]);
  const mixed = mixStoriesWithAds(stories, ads);

  return (
    <TvKiosk>
      <RotatedFullscreen rotation={rotation}>
        <StoryViewer stories={mixed} handle={HANDLE} loop fullBleed />
      </RotatedFullscreen>
    </TvKiosk>
  );
}
