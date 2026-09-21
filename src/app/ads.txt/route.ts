import { linhaAdsTxt } from '@/lib/anuncios'

// `/ads.txt` na raiz do domínio: é onde o AdSense procura a autorização do
// editor, e sem ele os anúncios servidos são limitados ou suspensos. Gerado a
// partir do mesmo `NEXT_PUBLIC_ADSENSE_CLIENT` do script, para os dois nunca
// divergirem. O segmento estático tem precedência sobre `[name_store]`.
//
// Com os anúncios desligados responde 404, como qualquer arquivo ausente.
export const dynamic = 'force-static'

export function GET() {
  const linha = linhaAdsTxt()
  if (!linha) return new Response('Not Found', { status: 404 })

  return new Response(`${linha}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
