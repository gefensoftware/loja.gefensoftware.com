// O que o renderizador da nota precisa saber ALÉM do layout: como traduzir
// cada CHAVE do contrato (NoteFieldKey, no Go) no texto que sai no papel, qual
// o rótulo padrão de cada uma, e qual é a folha de fábrica.
//
// O Go valida as chaves e devolve o layout; aqui mora o lado do front do mesmo
// contrato: o VALOR de cada chave (resolverCampo) e o RÓTULO padrão (ROTULOS),
// que a API de propósito não guarda — rótulo escrito à mão sairia torto no
// papel que o cliente leva embora, e traduzir mora onde se escreve a frase.
//
// Espelho de domain.NoteFieldKeys() e de domain.DefaultNoteSheet(). O portal
// tem o arquivo irmão (portal/src/lib/nota-folha.ts).

import type { Enterprise } from '@/types/catalog';
import type { WorkOrder, WorkOrderStatus } from '@/types/work-order';
import type { NoteSheet } from '@/types/note-sheet';
import { formatarPreco } from '@/lib/price';

// ---------------------------------------------------------------------------
// Formatadores que a nota usa em mais de um lugar.
// ---------------------------------------------------------------------------

export function formatarDocumento(doc: string): string {
  const d = doc.replace(/\D/g, '');
  if (d.length === 11) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  if (d.length === 14) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
  return doc;
}

export function formatarInstante(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const TIPO_EQUIPAMENTO: Record<string, string> = {
  vehicle: 'Veículo',
  device: 'Aparelho',
  other: 'Equipamento',
};

// Os nomes das cores, espelho de domain.EquipmentColors na API. Os termos são
// os do CRLV — é nele que o dono do carro vai conferir.
export const COR_DO_EQUIPAMENTO: Record<string, string> = {
  white: 'Branca',
  silver: 'Prata',
  black: 'Preta',
  gray: 'Cinza',
  red: 'Vermelha',
  blue: 'Azul',
  green: 'Verde',
  yellow: 'Amarela',
  orange: 'Laranja',
  brown: 'Marrom',
  beige: 'Bege',
  gold: 'Dourada',
  maroon: 'Grená',
  pink: 'Rosa',
  purple: 'Roxa',
  other: 'Fantasia',
};

// O rótulo do estado, sem o ícone: no papel não há cor nem desenho, só a
// palavra.
const STATUS_ROTULO: Record<WorkOrderStatus, string> = {
  received: 'Recebida',
  quoted: 'Aguardando aprovação',
  approved: 'Aprovada, em execução',
  ready: 'Pronta para retirada',
  reopened: 'Nota reaberta',
  delivered: 'Entregue',
  declined: 'Orçamento recusado',
  canceled: 'Cancelada',
};

// ---------------------------------------------------------------------------
// Os rótulos padrão de cada chave.
//
// Usados quando o campo não trouxe um `label` próprio. É a MESMA lista de
// NoteFieldKeys() do Go, aqui com a frase em português. Chave sem rótulo aqui
// imprime a própria chave — sinal de contrato fora de sincronia, não de papel
// pronto para o cliente.
// ---------------------------------------------------------------------------
export const ROTULOS: Record<string, string> = {
  'loja.nome': 'Loja',
  'loja.cnpj': 'CNPJ',
  'loja.endereco': 'Endereço',
  'loja.telefone': 'Telefone',
  'loja.email': 'E-mail',

  'ordem.numero': 'Ordem de serviço',
  'ordem.status': 'Situação',
  'ordem.abertura': 'Aberta em',
  'ordem.defeito': 'Defeito relatado pelo cliente',
  'ordem.laudo': 'Laudo técnico',
  'ordem.estimado': 'Orçamento aprovado',
  'ordem.garantia': 'Garantia até',
  'ordem.orcamento_em': 'Orçamento enviado',
  'ordem.aprovacao_em': 'Aprovação',
  'ordem.pronta_em': 'Pronta em',
  'ordem.entrega_em': 'Entregue em',

  'cliente.nome': 'Cliente',
  'cliente.documento': 'CPF / CNPJ',
  'cliente.telefone': 'Telefone',
  'cliente.email': 'E-mail',

  'equipamento.tipo': 'Equipamento',
  'equipamento.marca': 'Marca',
  'equipamento.modelo': 'Modelo',
  'equipamento.identificador': 'Placa / nº de série',
  'equipamento.cor': 'Cor',

  'total.servicos': 'Valor dos serviços',
  'total.pecas': 'Valor de peças',
  'total.desconto_servicos': 'Desconto na mão de obra',
  'total.desconto_pecas': 'Desconto em peças',
  'total.geral': 'Valor total',

  'impressao.data': 'Impressão',
};

// Campos que, VAZIOS, não viram linha — somem da folha em vez de imprimir um
// travessão. É o que a nota de hoje já faz à mão: laudo, cor e garantia só
// aparecem quando existem; "Garantia: —" num recibo é pior que nada. O resto
// imprime "—", porque "E-mail: —" informa que a loja não tem o e-mail.
export const OMITIR_SE_VAZIO = new Set<string>([
  'ordem.laudo',
  'ordem.garantia',
  'ordem.estimado',
  'equipamento.cor',
]);

export interface ContextoNota {
  ordem: WorkOrder;
  // A loja pode faltar: a nota funciona para uma oficina diferente da vitrine
  // aberta, e a leitura dela pode falhar. O nome então vem da própria ordem.
  loja: Enterprise | null;
  /** O momento em que o papel saiu da impressora, para impressao.data. */
  agora: Date;
}

export function enderecoDaLoja(loja: Enterprise): string {
  const e = loja.address;
  if (!e || !e.street) return '';
  const linha = `${e.street}, ${e.number}${e.complement ? ` ${e.complement}` : ''}`;
  return `${linha} — ${e.neighborhood}, ${e.city}/${e.state}`;
}

// resolverCampo traduz uma chave do contrato no texto a imprimir. Chave de
// fora do contrato devolve "" — a API já recusa o layout que a use, então
// aqui ela só pode chegar por folha desatualizada, e some em silêncio.
export function resolverCampo(key: string, ctx: ContextoNota): string {
  const { ordem, loja, agora } = ctx;
  const eq = ordem.equipment;

  switch (key) {
    case 'loja.nome':
      return loja?.tradeName || loja?.name || ordem.store?.name || '';
    case 'loja.cnpj':
      return loja?.cnpj ? `CNPJ ${formatarDocumento(loja.cnpj)}` : '';
    case 'loja.endereco':
      return loja ? enderecoDaLoja(loja) : '';
    case 'loja.telefone':
      return loja?.phones?.[0]?.phone ?? '';
    case 'loja.email':
      return loja?.emails?.[0]?.email ?? '';

    case 'ordem.numero':
      return `nº ${ordem.number}`;
    case 'ordem.status':
      return STATUS_ROTULO[ordem.status] ?? '';
    case 'ordem.abertura':
      return formatarInstante(ordem.createdAt);
    case 'ordem.defeito':
      return ordem.reportedIssue ?? '';
    case 'ordem.laudo':
      return ordem.diagnosis ?? '';
    case 'ordem.estimado':
      return ordem.estimatedTotal ? formatarPreco(ordem.estimatedTotal) : '';
    case 'ordem.garantia':
      // A vitrine não guarda a garantia na ordem; a chave existe no contrato,
      // e some vazia (está em OMITIR_SE_VAZIO).
      return '';
    case 'ordem.orcamento_em':
      return formatarInstante(ordem.quotedAt);
    case 'ordem.aprovacao_em':
      return ordem.approvedAt
        ? `${formatarInstante(ordem.approvedAt)} · ${
            ordem.approvedBy === 'store' ? 'registrada pela loja' : 'por você'
          }`
        : '';
    case 'ordem.pronta_em':
      return formatarInstante(ordem.readyAt);
    case 'ordem.entrega_em':
      return formatarInstante(ordem.deliveredAt);

    case 'cliente.nome':
      return ordem.customer.name ?? '';
    case 'cliente.documento':
      return ordem.customer.document ? formatarDocumento(ordem.customer.document) : '';
    case 'cliente.telefone':
      return ordem.customer.phone ?? '';
    case 'cliente.email':
      return ordem.customer.email ?? '';

    case 'equipamento.tipo':
      return TIPO_EQUIPAMENTO[eq?.kind ?? 'other'] ?? '';
    case 'equipamento.marca':
      return eq?.brand ?? '';
    case 'equipamento.modelo':
      return eq?.model ?? '';
    case 'equipamento.identificador':
      return eq?.identifier ?? '';
    case 'equipamento.cor':
      return eq?.color ? (COR_DO_EQUIPAMENTO[eq.color] ?? eq.color) : '';

    case 'total.servicos':
      return formatarPreco(ordem.laborTotal);
    case 'total.pecas':
      return formatarPreco(ordem.partsTotal);
    case 'total.desconto_servicos':
    case 'total.desconto_pecas':
      // A vitrine não mostra desconto por linha; os totais já vêm líquidos.
      return '';
    case 'total.geral':
      return formatarPreco(ordem.total);

    case 'impressao.data':
      return formatarInstante(agora.toISOString());

    default:
      return '';
  }
}

// substituirPlaceholders troca cada {{chave}} do texto livre da loja pelo
// valor. Só as chaves do contrato chegam aqui (a API recusa o resto na
// publicação), e o espaço de `{{ chave }}` é aparado, como no Go.
const RE_PLACEHOLDER = /{{([^{}]*)}}/g;

export function substituirPlaceholders(texto: string, ctx: ContextoNota): string {
  return texto.replace(RE_PLACEHOLDER, (_todo, chave: string) =>
    resolverCampo(chave.trim(), ctx),
  );
}

// ---------------------------------------------------------------------------
// A folha de fábrica, espelho de domain.DefaultNoteSheet().
//
// Serve a dois papéis: é a verificação local do renderizador (desenhar ISto
// com dados de exemplo tem de dar a nota polida de hoje) e é a reserva da
// tela — se a leitura do layout falhar, a nota ainda imprime o papel padrão
// em vez de uma tela de erro na hora da entrega.
// ---------------------------------------------------------------------------
export const DEFAULT_NOTE_SHEET: NoteSheet = {
  paper: 'a4',
  fontSize: 13,
  margin: 14,
  blocks: [
    { id: 'cabecalho', kind: 'header', align: 'left', scale: 'normal', bold: false, border: 'none', gapTop: 0 },
    {
      id: 'cliente', kind: 'fields', align: 'left', scale: 'normal', bold: false, border: 'none', gapTop: 5,
      columns: 4,
      fields: [
        { key: 'cliente.nome' }, { key: 'cliente.documento' },
        { key: 'cliente.telefone' }, { key: 'cliente.email' },
      ],
    },
    {
      id: 'equipamento', kind: 'fields', align: 'left', scale: 'normal', bold: false, border: 'top', gapTop: 4,
      columns: 4,
      fields: [
        { key: 'equipamento.tipo' }, { key: 'equipamento.marca' }, { key: 'equipamento.modelo' },
        { key: 'equipamento.identificador' }, { key: 'equipamento.cor' },
      ],
    },
    { id: 'ficha', kind: 'intake', align: 'left', scale: 'normal', bold: false, border: 'top', gapTop: 4, columns: 4 },
    {
      id: 'defeito', kind: 'fields', align: 'left', scale: 'normal', bold: false, border: 'top', gapTop: 5,
      columns: 1,
      fields: [{ key: 'ordem.defeito' }, { key: 'ordem.laudo' }],
    },
    {
      id: 'itens', kind: 'items', align: 'left', scale: 'normal', bold: false, border: 'none', gapTop: 5,
      itemColumns: ['kind', 'description', 'quantity', 'unit', 'total'],
    },
    { id: 'totais', kind: 'totals', align: 'left', scale: 'normal', bold: false, border: 'none', gapTop: 0 },
    {
      id: 'datas', kind: 'fields', align: 'left', scale: 'normal', bold: false, border: 'top', gapTop: 5,
      columns: 4,
      fields: [
        { key: 'ordem.orcamento_em' }, { key: 'ordem.aprovacao_em' },
        { key: 'ordem.pronta_em' }, { key: 'ordem.entrega_em' },
      ],
    },
    { id: 'assinaturas', kind: 'signatures', align: 'left', scale: 'normal', bold: false, border: 'none', gapTop: 12 },
    {
      id: 'rodape', kind: 'text', align: 'left', scale: 'small', bold: false, border: 'top', gapTop: 8,
      body: 'Documento não fiscal, emitido em {{impressao.data}}.',
    },
  ],
};
