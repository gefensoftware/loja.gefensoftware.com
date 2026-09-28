import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { CHAVE_CONSENTIMENTO, type EscolhaAnuncios } from '@/lib/anuncios';
import { enterprisesAtom } from '@/store/atoms/enterprises';

/**
 * A escolha do visitante sobre anúncios personalizados, guardada no aparelho.
 *
 * `null` (ainda não respondeu) é o que faz o aviso aparecer na primeira
 * visita a uma loja.
 *
 * `getOnInit` para o valor gravado já estar de pé na primeira renderização do
 * cliente. Sem ele o atom nasce `null` e só hidrata depois do mount — quem já
 * respondeu veria o aviso piscar, e o `<EspacoAnuncio>` pediria o anúncio
 * antes de saber da escolha, ou seja, sempre não personalizado.
 */
export const escolhaAnunciosAtom = atomWithStorage<EscolhaAnuncios | null>(
  CHAVE_CONSENTIMENTO,
  null,
  undefined,
  { getOnInit: true },
);

/** Aviso reaberto de propósito pelo link "Preferências de anúncios" do
 *  rodapé. Fica fora do armazenamento: é estado de tela, não uma decisão. */
export const preferenciasAnunciosAbertasAtom = atom(false);


/**
 * A loja aberta agora exibe anúncio?
 *
 * Derivado da empresa, e não escrito por um efeito: o plano já chega no mesmo
 * JSON que a vitrine busca para renderizar a loja, então copiá-lo para um
 * estado próprio só criaria duas versões da mesma verdade para manter em dia.
 *
 * O padrão é SEM anúncio — `true` quando a empresa ainda não chegou ou quando
 * a resposta não traz o bloco do plano. É o lado conservador de propósito: o
 * erro de não mostrar um anúncio custa centavos, e o de mostrar publicidade na
 * vitrine de quem paga para não ter custa o cliente.
 */
export const lojaSemAnunciosAtom = atom(
  (get) => get(enterprisesAtom)?.plan?.adsFree ?? true,
);
