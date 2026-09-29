import type { Palette } from '@/types/catalog';

// Converte a paleta ESCURA (ou a PRETA) da loja nas variáveis CSS que a
// vitrine inteira usa (as de globals.css).
//
// A paleta clara não passa por aqui: a vitrine clara é branca, com os cinzas
// do `:root` do globals.css, e o que o lojista escolhe aparece nela pela cor
// primária — botões, links, preços, destaques. É como a vitrine sempre foi, e
// mudar isso não era o problema que esta fatia veio resolver.
//
// Este arquivo é o par do `src/lib/tema-empresa.ts` do portal, e existe pelo
// mesmo motivo que ele: a paleta tem QUATRO cores — primária, secundária,
// fundo e texto — e a folha de estilo tem vinte e poucos tokens. O resto é
// derivado daqui: superfície, separador, cinza secundário e as versões
// legíveis da primária saem todos de mistura entre as quatro, com o contraste
// conferido em tempo de execução.
//
// Antes disto, a vitrine só escrevia `--dark-primary-color` e afins, e as
// telas pintavam o escuro com `dark:bg-neutral-900`/`dark:text-neutral-100`
// cravados no JSX. Ou seja: a paleta ESCURA que o lojista desenha não pintava
// nada, e o escuro saía igual ao preto em toda loja. As duas opções do seletor
// de tema mostravam a mesma tela.
//
// O que NÃO é derivado da paleta, de propósito: o vermelho de erro. Ele não é
// identidade visual, é significado — vermelho tem que continuar dizendo "isto
// vai apagar algo" mesmo numa loja cuja cor primária é vermelha.
//
// Se um dia esta conta e a do portal divergirem, a mesma loja aparece de uma
// cor para quem a configura e de outra para quem a visita: as duas são
// deliberadamente a mesma conta, com os mesmos limiares.

type RGB = { r: number; g: number; b: number };

const HEX = /^#([0-9a-fA-F]{6})$/;

function hexParaRgb(hex: string): RGB | null {
  const m = HEX.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbParaHsl({ r, g, b }: RGB): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

function hslParaRgb(h: number, s: number, l: number): RGB {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

// Luminância relativa da WCAG 2.1 — a mesma fórmula de `contrastarCom` em
// lib/tema.ts e de `relativeLuminance` no Go da API.
function luminancia({ r, g, b }: RGB): number {
  const canal = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a: RGB, b: RGB): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function misturar(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

// O Tailwind consome os tokens como `hsl(var(--x))`, então o valor guardado é
// a tripla sem a função — é também o que permite `bg-card/50` funcionar.
//
// Duas casas decimais: os valores saem de ajustarAteContrastar, que mira um
// contraste exato, e arredondar a luminosidade para o inteiro mais próximo
// desloca a cor o suficiente para derrubar o resultado abaixo do alvo.
function token(cor: RGB): string {
  const [h, s, l] = rgbParaHsl(cor);
  return `${h.toFixed(2)} ${s.toFixed(2)}% ${l.toFixed(2)}%`;
}

// Clareia ou escurece `cor` até ela atingir `alvo` de contraste contra
// `fundo`, andando na luminosidade HSL de 1% em 1%. A direção é a que afasta
// do fundo: cor sobre fundo escuro clareia, sobre fundo claro escurece.
function ajustarAteContrastar(cor: RGB, fundo: RGB, alvo: number): RGB {
  if (contraste(cor, fundo) >= alvo) return cor;
  const [h, s, l] = rgbParaHsl(cor);
  const passo = luminancia(fundo) > 0.5 ? -1 : 1;
  let atual = l;
  for (let i = 0; i < 100; i++) {
    atual += passo;
    if (atual < 0 || atual > 100) break;
    const candidata = hslParaRgb(h, s, atual);
    if (contraste(candidata, fundo) >= alvo) return candidata;
  }
  // Nem preto nem branco puro chegaram ao alvo (só acontece com fundo de
  // luminância média). Devolve o extremo que contrasta mais.
  const preto = { r: 0, g: 0, b: 0 };
  const branco = { r: 255, g: 255, b: 255 };
  return contraste(preto, fundo) >= contraste(branco, fundo) ? preto : branco;
}

function tintaSobre(fundo: RGB): RGB {
  const preto = { r: 0, g: 0, b: 0 };
  const branco = { r: 255, g: 255, b: 255 };
  return contraste(preto, fundo) >= contraste(branco, fundo) ? preto : branco;
}

// WCAG 1.4.11: o que identifica um componente — a mancha do botão sólido, o
// anel de foco — precisa de 3:1 contra o que está em volta. É o mesmo número
// de VISIBILIDADE_MIN no portal e de visibilityMin no Go.
const VISIBILIDADE_MIN = 3;

// WCAG 1.4.3: texto corrido precisa de 4.5:1 contra o que está atrás dele.
// Vale para as duas superfícies que a paleta gera — a página e o cartão.
const LEITURA_MIN = 4.5;

/**
 * A superfície de cartão, campo e diálogo.
 *
 * A secundária vira essa superfície — MAS só quando ela de fato se distingue
 * do fundo. Um lojista pode salvar secundária igual ao fundo (é o caso da
 * paleta escura padrão da tela de Cores: as duas em #2d1b69), e aí o cartão
 * sumiria dentro da página. Nesse caso a superfície é derivada do próprio
 * fundo, deslocada 7% na direção do texto — claro sobre fundo escuro, escuro
 * sobre fundo claro, sem depender de saber qual é qual.
 *
 * O limiar 1.12 e o deslocamento de 7% são os mesmos do portal, de propósito:
 * é o que faz o cartão da vitrine e o cartão do painel caírem na mesma cor.
 */
function superficieDe(fundo: RGB, texto: RGB, secundaria: RGB): RGB {
  return contraste(secundaria, fundo) >= 1.12 ? secundaria : misturar(fundo, texto, 0.07);
}

/**
 * variaveisDoTema traduz uma paleta da loja nas variáveis CSS da vitrine.
 *
 * Devolve null se qualquer uma das quatro cores não for um #rrggbb válido — aí
 * a vitrine fica com o que globals.css declara, que é o comportamento correto:
 * meia paleta aplicada é pior que nenhuma.
 *
 * Quem chama passa a paleta escura ou a preta, nunca a clara — ver o cabeçalho
 * deste arquivo. A conta em si não sabe disso e funcionaria com qualquer uma.
 */
export function variaveisDoTema(paleta: Palette): Record<string, string> | null {
  const fundo = hexParaRgb(paleta.background);
  const texto = hexParaRgb(paleta.text);
  const primaria = hexParaRgb(paleta.primary);
  const secundaria = hexParaRgb(paleta.secondary);
  if (!fundo || !texto || !primaria || !secundaria) return null;

  const superficie = superficieDe(fundo, texto, secundaria);

  // A primária só é usada como a loja salvou enquanto ela DER PARA VER contra
  // a superfície: uma primária pálida produz um botão invisível com o rótulo
  // dentro dele perfeitamente legível, e nada no código percebe. O ajuste é o
  // mínimo para chegar a 3:1 e devolve a cor intacta quando ela já passa — o
  // que é o caso de toda paleta sã.
  const primariaVisivel = ajustarAteContrastar(primaria, superficie, VISIBILIDADE_MIN);

  // Duas tintas porque são duas superfícies — a página (--background) e o
  // cartão/diálogo (--card). Uma paleta sã devolve a própria cor de texto nas
  // duas; a paleta escura padrão antiga (secundária e texto ambos #ffffff)
  // devolvia branco sobre branco no cartão.
  const tintaNoFundo = ajustarAteContrastar(texto, fundo, LEITURA_MIN);
  const tintaNoCartao = ajustarAteContrastar(texto, superficie, LEITURA_MIN);

  // As misturas abaixo usam a tinta JÁ corrigida, e não a cor crua da paleta:
  // separador e campo saem de misturar a superfície com o texto, então texto
  // branco sobre cartão branco também apagaria as bordas e o preenchimento dos
  // campos. Corrigir só a letra deixaria a moldura invisível.
  const separador = misturar(superficie, tintaNoCartao, 0.26);
  const campo = misturar(superficie, tintaNoCartao, 0.08);
  // O cinza secundário é medido contra o CAMPO PREENCHIDO, não contra o cartão:
  // é a superfície mais clara em que ele aparece, e portanto o pior caso. É
  // placeholder de input e legenda de item — "Nome, telefone e e-mail".
  const textoFraco = ajustarAteContrastar(misturar(tintaNoCartao, superficie, 0.45), campo, LEITURA_MIN);

  return {
    '--background': token(fundo),
    '--foreground': token(tintaNoFundo),
    '--card': token(superficie),
    '--card-foreground': token(tintaNoCartao),
    '--popover': token(superficie),
    '--popover-foreground': token(tintaNoCartao),
    '--primary': token(primariaVisivel),
    '--primary-foreground': token(tintaSobre(primariaVisivel)),
    '--secondary': token(superficie),
    '--secondary-foreground': token(tintaNoCartao),
    '--muted': token(campo),
    '--muted-foreground': token(textoFraco),
    '--accent': token(misturar(superficie, tintaNoCartao, 0.12)),
    '--accent-foreground': token(tintaNoCartao),
    '--border': token(separador),
    '--input': token(separador),
    // O anel de foco anda junto com o botão: é a mesma cor, e é o único
    // indício de onde está o teclado. Um anel invisível não é enfeite perdido,
    // é a navegação por Tab deixando de existir.
    '--ring': token(primariaVisivel),
  };
}

// Os nomes ficam aqui para quem aplica saber o que limpar quando a loja não
// tem tema — sem isso, as variáveis da última loja ficariam grudadas no
// <html>.
export const TOKENS_DO_TEMA = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--border',
  '--input',
  '--ring',
] as const;
