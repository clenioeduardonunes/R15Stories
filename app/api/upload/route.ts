import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

/**
 * Autoriza uploads direto do navegador pro Vercel Blob (sem passar pela
 * nossa função — funções do Vercel têm limite fixo de 4.5MB por requisição,
 * bem menor que os vídeos que o painel aceita). Só emite token pra quem tem
 * o cookie de sessão válido.
 */
export async function POST(request: NextRequest) {
  const session = request.cookies.get('r15_admin')?.value;
  const isAdmin = Boolean(session) && session === process.env.ADMIN_PASSWORD;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('ads/')) {
          throw new Error('Destino de upload inválido.');
        }
        return {
          allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
          maximumSizeInBytes: MAX_VIDEO_SIZE_BYTES,
          addRandomSuffix: false,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro no upload.' }, { status: 400 });
  }
}
