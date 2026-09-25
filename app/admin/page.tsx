import { getAdVideos } from '@/lib/ads';
import { deleteAd, logout } from './actions';
import { UploadForm } from './UploadForm';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const ads = await getAdVideos();

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Vídeos institucionais</h1>
          <form action={logout}>
            <button type="submit" className="text-sm text-neutral-400 hover:text-neutral-200 hover:underline">
              Sair
            </button>
          </form>
        </div>

        <p className="text-sm text-neutral-400">
          Esses vídeos entram misturados na rotação de stories em <code className="text-neutral-300">/tv</code> — um
          vídeo institucional a cada 6 stories do Instagram (ou em loop sozinhos, se não houver stories ativos no
          momento).
        </p>

        <UploadForm />

        <div className="flex flex-col gap-3">
          {ads.length === 0 && <p className="text-sm text-neutral-500">Nenhum vídeo enviado ainda.</p>}
          {ads.map((ad) => (
            <div key={ad.pathname} className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <video src={ad.url} className="h-16 w-10 rounded-lg object-cover" muted />
              <span className="flex-1 truncate text-sm text-neutral-300">{ad.pathname.replace(/^ads\//, '')}</span>
              <form action={deleteAd.bind(null, ad.pathname)}>
                <button type="submit" className="text-sm text-red-500 hover:text-red-400 hover:underline">
                  Remover
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
