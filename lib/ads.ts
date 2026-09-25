import { list } from '@vercel/blob';
import { unstable_cache } from 'next/cache';
import type { StoryItem } from './instagram';

const PREFIX = 'ads/';

export interface AdVideo {
  url: string;
  pathname: string;
  uploadedAt: Date;
}

interface CachedAdBlob {
  url: string;
  pathname: string;
  uploadedAt: string;
}

/**
 * `list()` do Vercel Blob é uma "Advanced Request" (cota baixa no plano
 * grátis) — sem cache, cada carregamento de `/tv` batia direto na API. Como
 * a TV recarrega a página inteira a cada ~10min (ver TvKiosk) e fica ligada
 * o dia todo, isso sozinho já estourava a cota mensal. `unstable_cache`
 * segura o resultado por até 30min; upload/remoção no admin invalidam na
 * hora via `revalidateTag('ads')` (ver app/admin/actions.ts), então uma
 * mudança real não fica esperando o cache expirar.
 */
const listAdBlobs = unstable_cache(
  async (): Promise<CachedAdBlob[]> => {
    const { blobs } = await list({ prefix: PREFIX });
    return blobs.map((b) => ({ url: b.url, pathname: b.pathname, uploadedAt: b.uploadedAt.toISOString() }));
  },
  ['ads-list'],
  { tags: ['ads'], revalidate: 1800 },
);

export async function getAdVideos(): Promise<AdVideo[]> {
  try {
    const blobs = await listAdBlobs();
    return blobs
      .map((b) => ({ ...b, uploadedAt: new Date(b.uploadedAt) }))
      .sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime());
  } catch (err) {
    console.error('[ads] Erro ao listar vídeos institucionais:', err);
    return [];
  }
}

/**
 * Intercala os vídeos institucionais entre os stories reais (um a cada
 * `every`), pra não depender só do que foi postado no Instagram. Se não
 * houver stories ativos, mostra só os vídeos institucionais em loop.
 */
export function mixStoriesWithAds(stories: StoryItem[], ads: AdVideo[], every = 6): StoryItem[] {
  if (ads.length === 0) return stories;

  if (stories.length === 0) {
    return ads.map((ad) => adToStoryItem(ad));
  }

  const result: StoryItem[] = [];
  let adIndex = 0;
  stories.forEach((story, i) => {
    result.push(story);
    if ((i + 1) % every === 0) {
      result.push(adToStoryItem(ads[adIndex % ads.length]));
      adIndex++;
    }
  });
  return result;
}

function adToStoryItem(ad: AdVideo): StoryItem {
  return {
    id: `ad-${ad.pathname}`,
    mediaType: 'VIDEO',
    mediaUrl: ad.url,
    timestamp: new Date().toISOString(),
  };
}
