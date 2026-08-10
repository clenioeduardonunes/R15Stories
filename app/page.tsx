import { getStories } from '@/lib/instagram';
import { StoryViewer } from '@/components/StoryViewer';

const HANDLE = process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || 'academia';

export const revalidate = 300;

export default async function Home() {
  const { stories, source } = await getStories();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-100 px-4 py-10 dark:bg-neutral-950">
      <h1 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Stories da @{HANDLE}</h1>
      <StoryViewer stories={stories} handle={HANDLE} />
      {source === 'mock' && (
        <p className="text-xs text-neutral-400">
          Modo de demonstração — configure INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_BUSINESS_ACCOUNT_ID (ver README) pra
          puxar os stories reais.
        </p>
      )}
    </div>
  );
}
