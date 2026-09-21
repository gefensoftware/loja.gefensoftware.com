// Configuração dos anúncios da vitrine (Google AdSense).
//
// Os anúncios nascem DESLIGADOS: sem `NEXT_PUBLIC_ADSENSE_CLIENT` nenhum
// script de terceiro é carregado, nenhum espaço é reservado na tela e o
// `/ads.txt` responde 404. Isso não é só conveniência — a Política de
// Privacidade (content/legal/privacidade.tsx) afirma hoje que a plataforma
// não usa cookies de publicidade nem rastreamento de terceiros. Ligar a
// variável sem antes revisar esse texto e pôr um aviso de consentimento
// (LGPD) torna a política falsa. Ver README, seção "Anúncios".
//
// As variáveis são `NEXT_PUBLIC_*`, então o Next as embute no bundle no
// momento do build: trocar o valor exige um build novo.

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ?? '';

// O AdSense identifica a conta como `ca-pub-<dígitos>`. Um valor fora desse
// formato não liga os anúncios pela metade: vira erro no build de produção e
// aviso no desenvolvimento, para não publicar um script que nunca vai servir.
const FORMATO_CLIENT = /^ca-pub-\d{10,20}$/;

if (CLIENT && !FORMATO_CLIENT.test(CLIENT)) {
  const msg =
    `NEXT_PUBLIC_ADSENSE_CLIENT="${CLIENT}" não parece um ID de editor do ` +
    'AdSense (esperado "ca-pub-" seguido de dígitos).';
  if (process.env.NODE_ENV === 'production') throw new Error(msg);
  console.warn(`[anuncios] ${msg} Anúncios ficam desligados.`);
}

/** ID do editor (`ca-pub-...`), ou `null` com os anúncios desligados. */
export const adsenseClient: string | null = FORMATO_CLIENT.test(CLIENT) ? CLIENT : null;

export const anunciosAtivos = adsenseClient !== null;

/** Os lugares da vitrine que podem receber anúncio. Cada um tem o seu bloco
 *  no painel do AdSense e, portanto, o seu próprio ID de slot. */
export type PosicaoAnuncio = 'vitrine' | 'produto';

// Acesso literal a cada variável de propósito: o Next só substitui
// `process.env.NEXT_PUBLIC_X` escrito por extenso, nunca `process.env[chave]`.
const SLOTS: Record<PosicaoAnuncio, string | undefined> = {
  vitrine: process.env.NEXT_PUBLIC_ADSENSE_SLOT_VITRINE,
  produto: process.env.NEXT_PUBLIC_ADSENSE_SLOT_PRODUTO,
};

/** ID do bloco de anúncio da posição, ou `null` quando a posição não foi
 *  configurada (ou os anúncios estão desligados). */
export function slotDaPosicao(posicao: PosicaoAnuncio): string | null {
  if (!anunciosAtivos) return null;
  const slot = SLOTS[posicao]?.trim();
  return slot && /^\d+$/.test(slot) ? slot : null;
}

/** Linha do `ads.txt` que autoriza a conta a vender o inventário do domínio.
 *  O `f08c47fec0942fa0` é o ID fixo do Google na TAG (Trustworthy
 *  Accountability Group), igual para todo editor. */
export function linhaAdsTxt(): string | null {
  if (!adsenseClient) return null;
  const pub = adsenseClient.replace(/^ca-/, '');
  return `google.com, ${pub}, DIRECT, f08c47fec0942fa0`;
}
