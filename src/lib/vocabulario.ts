import type { Capabilities, OperationMode } from '@/types/catalog';

// ---------------------------------------------------------------------------
// O vocabulário da vitrine, derivado do modo de operação da loja.
//
// "Carrinho" é uma palavra de supermercado. Numa serralheria ou numa oficina
// ela diz a coisa errada sobre o negócio — o cliente não empurra um carrinho,
// ele pede um orçamento ou deixa um equipamento. O modo da loja é o que
// resolve isso, e este arquivo é o único lugar onde ele vira texto.
//
// A API devolve `mode` e NUNCA devolve rótulo de tela: a mesma decisão de
// lib/tema-empresa.ts no portal, que deriva vinte tokens visuais de quatro
// cores do lado do cliente. Texto de interface é assunto da interface, e
// mantê-lo aqui permite revisar a redação de todas as lojas de uma vez.
//
// O lojista não escreve estes rótulos. Campo livre traria texto quebrando o
// layout e erro de português na vitrine de quem comprou o sistema justamente
// para parecer profissional.
// ---------------------------------------------------------------------------

export interface Vocabulario {
  /** O nome da lista do cliente, na barra de navegação. */
  lista: string;
  /** Título da página da lista. */
  listaTitulo: string;
  /** Ação no item do catálogo. */
  adicionar: string;
  /** Ação de esvaziar a lista. */
  esvaziar: string;
  /** Ação de fechar: enviar o pedido para a loja. */
  fechar: string;
  /** Como esta loja chama o que vende, no singular e no plural. */
  item: string;
  itens: string;
  /** Ação de pedir preço num item sob orçamento. */
  pedirPreco: string;
  /** O que o cliente deixa na loja. Só existe em manutenção. */
  objeto: string | null;
}

const VOCABULARIOS: Record<OperationMode, Vocabulario> = {
  products: {
    lista: 'Carrinho',
    listaTitulo: 'Seu pedido',
    adicionar: 'Adicionar ao carrinho',
    esvaziar: 'Esvaziar carrinho',
    fechar: 'Finalizar compra',
    item: 'Produto',
    itens: 'Produtos',
    pedirPreco: 'Pedir orçamento',
    objeto: null,
  },
  services: {
    lista: 'Orçamento',
    listaTitulo: 'Seu orçamento',
    adicionar: 'Adicionar ao orçamento',
    esvaziar: 'Limpar orçamento',
    fechar: 'Enviar solicitação',
    item: 'Serviço',
    itens: 'Serviços',
    pedirPreco: 'Pedir orçamento',
    objeto: null,
  },
  maintenance: {
    lista: 'Solicitação',
    listaTitulo: 'Sua solicitação de serviço',
    adicionar: 'Adicionar à solicitação',
    esvaziar: 'Limpar solicitação',
    fechar: 'Enviar solicitação',
    item: 'Serviço',
    itens: 'Serviços',
    pedirPreco: 'Solicitar atendimento',
    objeto: 'Equipamento',
  },
  // A oficina fala igual à manutenção, com uma palavra trocada: quem entra
  // na vitrine dela chegou com um VEÍCULO, não com um "equipamento". O resto
  // do fluxo é o mesmo, e é por isso que só o objeto muda.
  workshop: {
    lista: 'Solicitação',
    listaTitulo: 'Sua solicitação de serviço',
    adicionar: 'Adicionar à solicitação',
    esvaziar: 'Limpar solicitação',
    fechar: 'Enviar solicitação',
    item: 'Serviço',
    itens: 'Serviços',
    pedirPreco: 'Solicitar atendimento',
    objeto: 'Veículo',
  },
};

/**
 * O vocabulário de um modo. `null` (loja que ainda não escolheu o perfil no
 * portal) cai em `products` — é o texto que essas lojas já mostram hoje, e
 * trocá-lo por outro faria a vitrine de quem está no ar mudar sozinha.
 */
export function vocabularioDe(mode: OperationMode | null | undefined): Vocabulario {
  return VOCABULARIOS[mode ?? 'products'];
}

/**
 * As capacidades de uma loja ainda não carregada.
 *
 * Só o carrinho, como `domain.DefaultCapabilities()` no backend. Tudo
 * desligado esconderia a vitrine inteira durante o carregamento, e tudo
 * ligado piscaria botões que aquela loja não tem.
 */
export const CAPACIDADES_PADRAO: Capabilities = {
  cart: true,
  budgets: false,
  appointments: false,
  workOrders: false,
};

export function capacidadesDe(caps: Capabilities | null | undefined): Capabilities {
  return caps ?? CAPACIDADES_PADRAO;
}
