'use client'

import { useCallback, useEffect } from 'react';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { CHAVE_TEMA, type Tema } from '@/lib/tema';

export type { Tema };

/**
 * O tema escolhido pelo VISITANTE, guardado no aparelho dele.
 *
 * `null` é "não escolheu": aí quem manda é o `mode` que o lojista configurou
 * (`enterprise.theme`). A escolha do visitante, quando existe, ganha do
 * lojista — é o aparelho e os olhos dele.
 *
 * A preferência é uma só para todas as lojas, de propósito: quem enxerga mal
 * no claro enxerga mal em qualquer vitrine, e uma preferência por loja
 * obrigaria a pessoa a reescolher a cada slug novo.
 *
 * O valor gravado antes do modo preto existir é `'light'` ou `'dark'`, que
 * continuam sendo temas válidos — nada a migrar.
 *
 * `getOnInit` para o valor gravado já estar de pé na primeira renderização —
 * sem ele o átomo nasce `null`, e o efeito que aplica o tema chegaria à
 * conclusão errada (a do lojista) antes de hidratar.
 */
export const temaAtom = atomWithStorage<Tema | null>(
  CHAVE_TEMA,
  null,
  undefined,
  { getOnInit: true },
);

/**
 * A única escrita das classes de tema no documento.
 *
 * São duas classes, e não três, porque o preto é um escuro: a vitrine tem
 * centenas de variantes `dark:` do Tailwind, e uma página preta que não
 * fosse `.dark` mostraria todas elas na versão clara. `.black` entra POR
 * CIMA, trocando só as variáveis de cor da paleta (globals.css).
 */
export function aplicarTema(tema: Tema) {
  if (typeof document === 'undefined') return;
  const raiz = document.documentElement;
  raiz.classList.toggle('dark', tema !== 'light');
  raiz.classList.toggle('black', tema === 'black');
}

/**
 * O tema em vigor e como trocá-lo.
 *
 * @param padraoDaLoja `enterprise.theme.mode` — o que o lojista configurou.
 *   Vale enquanto o visitante não escolheu. `undefined` enquanto a empresa
 *   não chegou da rede.
 */
export function useTema(padraoDaLoja?: Tema) {
  const [escolha, escolher] = useAtom(temaAtom);
  const tema: Tema = escolha ?? padraoDaLoja ?? 'light';
  const escuro = tema !== 'light';

  // Aplicar no efeito, e não durante a renderização: escrever no documento no
  // corpo de um componente é efeito colateral em renderização, e no servidor
  // não existe documento nenhum.
  useEffect(() => {
    aplicarTema(tema);
  }, [tema]);

  // O botão do cabeçalho continua tendo duas posições, e o "escuro" dele é o
  // escuro DESTA loja: preto, se foi o preto que ela escolheu. Um botão de um
  // ícone só não tem como oferecer três temas, e mandar quem clica nele para
  // um escuro que a loja não usa seria mostrar uma quarta aparência que não
  // existe em lugar nenhum da vitrine. Os três ficam no Perfil.
  const escuroDaLoja: Tema = padraoDaLoja === 'black' ? 'black' : 'dark';
  const alternar = useCallback(() => {
    escolher(escuro ? 'light' : escuroDaLoja);
  }, [escolher, escuro, escuroDaLoja]);

  return { tema, escuro, alternar, escolher, escolheu: escolha !== null };
}
