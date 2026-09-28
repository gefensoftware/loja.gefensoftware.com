/**
 * Os três temas da vitrine.
 *
 * O mesmo tipo serve para duas coisas parecidas mas distintas: o que o
 * LOJISTA configurou como padrão da loja (`enterprise.theme.mode`) e o que o
 * VISITANTE escolheu no aparelho dele. Os valores são os mesmos e o segundo
 * ganha do primeiro — ver o átomo em @/store/tema.
 *
 * `black` não é uma paleta que a loja desenha: é preto (fundo #0a0a0a, cartão
 * #1c1c1e, texto branco) com a cor da marca só nos destaques. As quatro cores
 * chegam prontas da API em `theme.black`.
 */
export type Tema = 'light' | 'dark' | 'black';

/**
 * Chave do armazenamento onde mora a escolha de tema do visitante.
 *
 * Mora num módulo sem `'use client'` porque tem DOIS leitores em mundos
 * diferentes: o átomo (`@/store/tema`, cliente) e o script que roda antes da
 * primeira pintura, escrito no `<head>` pelo layout raiz — que é componente
 * de servidor. Importar uma constante de um módulo `'use client'` num
 * componente de servidor não devolve o valor, devolve uma referência: o
 * script sairia procurando uma chave que não existe, e o tema escolhido
 * piscaria para claro em todo carregamento.
 */
export const CHAVE_TEMA = 'tema';

/**
 * Preto ou branco — o que se lê em cima de `cor`.
 *
 * A primária vem do lojista e pode ser qualquer coisa. Os lugares que a usam
 * como fundo cravavam `text-white`, o que só funcionava enquanto toda loja
 * tivesse primária escura; a paleta escura costuma ter primária CLARA, e aí o
 * botão "Entrar" virava branco escrito em branco.
 *
 * A conta é a luminância relativa da WCAG. O limiar 0.45 é onde as duas
 * opções empatam em contraste — acima dele o preto lê melhor.
 */
export function contrastarCom(cor: string): string {
  const hex = cor.trim().replace('#', '');
  const cheio =
    hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (!/^[0-9a-f]{6}$/i.test(cheio)) return '#ffffff';

  const canal = (i: number) => {
    const v = parseInt(cheio.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const luminancia = 0.2126 * canal(0) + 0.7152 * canal(2) + 0.0722 * canal(4);

  return luminancia > 0.45 ? '#111111' : '#ffffff';
}
