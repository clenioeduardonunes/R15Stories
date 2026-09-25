export interface StoryItem {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  permalink?: string;
  timestamp: string;
}

export interface GetStoriesResult {
  stories: StoryItem[];
  /** 'instagram' = veio da API de verdade. 'mock' = credenciais ausentes ou a chamada falhou. */
  source: 'instagram' | 'mock';
}

interface RawStory {
  id: string;
  media_type: 'IMAGE' | 'VIDEO';
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp: string;
}

const API_VERSION = 'v21.0';

/**
 * Busca os stories ATIVOS (últimas 24h) da conta configurada, via
 * Instagram Graph API clássica (`graph.facebook.com`, passando pela Página
 * do Facebook vinculada). Ver README > "Conectando a conta do Instagram"
 * e `/api/auth/facebook` (fluxo de conexão que gera o token).
 *
 * PONTO DE EXTENSÃO: existe uma API mais nova, "Instagram API with
 * Instagram Login" (`graph.instagram.com`, sem precisar de Página do
 * Facebook — ver `/api/auth/instagram`), mas testamos na prática e ela NÃO
 * retorna stories postados organicamente pelo app do celular, só dados de
 * perfil/mídia normal — por isso não é usada aqui.
 *
 * Sem `INSTAGRAM_ACCESS_TOKEN`/`INSTAGRAM_BUSINESS_ACCOUNT_ID` no ambiente,
 * ou se a chamada falhar, cai pros stories de exemplo (`source: 'mock'`) —
 * assim o site sempre renderiza algo, mesmo antes da conta estar
 * configurada ou se a API estiver fora do ar.
 */
export async function getStories(): Promise<GetStoriesResult> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !businessAccountId) {
    console.warn(
      '[instagram] INSTAGRAM_ACCESS_TOKEN/INSTAGRAM_BUSINESS_ACCOUNT_ID não configurados — usando stories de exemplo.',
    );
    return { stories: MOCK_STORIES, source: 'mock' };
  }

  const url =
    `https://graph.facebook.com/${API_VERSION}/${businessAccountId}/stories` +
    `?fields=id,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${accessToken}`;

  try {
    // Stories ativos mudam ao longo do dia — 5min de cache é um meio-termo
    // entre não bater na API a cada request e não ficar minutos atrasado.
    const res = await fetch(url, { next: { revalidate: 300 } });
    const data = await res.json();

    if (!res.ok) {
      const message = data?.error?.message ?? `HTTP ${res.status}`;
      console.error(`[instagram] Falha ao buscar stories: ${message}`);
      return { stories: MOCK_STORIES, source: 'mock' };
    }

    const rawStories: RawStory[] = data.data ?? [];
    // Vídeos com música licenciada do catálogo do Instagram não retornam
    // `media_url` (restrição de direitos autorais da Meta, não tem como
    // contornar) — nesses casos mostramos o `thumbnail_url` (capa do vídeo)
    // como se fosse uma imagem, em vez de descartar o story inteiro.
    const stories: StoryItem[] = rawStories
      .filter((item) => item.media_url || item.thumbnail_url)
      .map((item) => ({
        id: item.id,
        mediaType: item.media_url ? item.media_type : 'IMAGE',
        mediaUrl: item.media_url ?? item.thumbnail_url!,
        permalink: item.permalink,
        timestamp: item.timestamp,
      }))
      // A API retorna do mais recente pro mais antigo — invertemos pra
      // exibir na ordem em que foram postados, igual o viewer de stories
      // de verdade do Instagram.
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return { stories, source: 'instagram' };
  } catch (err) {
    console.error('[instagram] Erro de rede ao buscar stories:', err);
    return { stories: MOCK_STORIES, source: 'mock' };
  }
}

/** SVG inline (data URI) — não depende de nenhum serviço externo pra funcionar em dev. */
function placeholderSvg(label: string, from: string, to: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${from}"/>
        <stop offset="100%" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="720" height="1280" fill="url(#g)"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="white"
      text-anchor="middle" dominant-baseline="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

const MOCK_STORIES: StoryItem[] = [
  {
    id: 'mock-1',
    mediaType: 'IMAGE',
    mediaUrl: placeholderSvg('Story de exemplo 1', '#f97316', '#db2777'),
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
    mediaType: 'IMAGE',
    mediaUrl: placeholderSvg('Story de exemplo 2', '#7c3aed', '#2563eb'),
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-3',
    mediaType: 'IMAGE',
    mediaUrl: placeholderSvg('Story de exemplo 3', '#059669', '#0891b2'),
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
];
