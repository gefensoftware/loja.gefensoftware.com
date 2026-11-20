'use client';

// O renderizador da nota: desenha a FOLHA a partir do layout em blocos
// (NoteSheet) e dos dados da ordem/loja. É o espelho de domain.note_template.go
// do lado da vitrine — o Go guarda o esquema e valida, aqui a folha é
// desenhada.
//
// A folha é branca com texto preto, e não usa o tema da loja: a vitrine de
// tema escuro imprimiria uma página inteira de tinta. A marca dela entra pelo
// logo e pelo cabeçalho. Por isso nenhum `dark:` desce até aqui — nem na tela,
// para o que se vê ser o que sai na impressora.
//
// O portal tem o arquivo irmão (portal/src/components/nota/nota-folha.tsx), no
// mesmo arranjo: as CHAVES e os tipos de bloco são o contrato entre os dois.

import type { WorkOrder } from '@/types/work-order';
import type {
  NoteAlign,
  NoteBlock,
  NoteItemColumn,
  NoteScale,
  NoteSheet,
} from '@/types/note-sheet';
import type { Enterprise } from '@/types/catalog';
import { formatarPreco } from '@/lib/price';
import { fichaPreenchida, modeloDe } from '@/lib/modelos-os';
import {
  OMITIR_SE_VAZIO,
  ROTULOS,
  resolverCampo,
  substituirPlaceholders,
  type ContextoNota,
} from '@/lib/nota-folha';

// O corpo da letra do bloco, RELATIVO ao da folha. Em `em`, para a loja que
// aumentar a fonte base ver tudo crescer junto, em vez de reajustar bloco a
// bloco. Um nível só de `em`, sem compor: cada bloco fixa a própria fonte.
const FATOR_ESCALA: Record<NoteScale, number> = {
  small: 0.8,
  normal: 1,
  large: 1.3,
};

const ALINHAMENTO: Record<NoteAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

// ---------------------------------------------------------------------------
// Peças pequenas, reaproveitadas entre os blocos.
// ---------------------------------------------------------------------------

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.77em] uppercase tracking-wide text-neutral-500">{rotulo}</p>
      <p className="whitespace-pre-wrap break-words text-[1em] text-black">{children || '—'}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Os blocos.
// ---------------------------------------------------------------------------

function BlocoCabecalho({ ctx }: { ctx: ContextoNota }) {
  const { loja } = ctx;
  return (
    <header className="flex items-start justify-between gap-6 border-b border-neutral-300 pb-4">
      <div className="flex min-w-0 items-start gap-3">
        {loja?.logoUrl && (
          <img src={loja.logoUrl} alt="" className="h-14 w-14 shrink-0 object-contain" />
        )}
        <div className="min-w-0">
          <p className="text-[1.4em] font-bold leading-tight">{resolverCampo('loja.nome', ctx)}</p>
          {loja?.cnpj && (
            <p className="text-[0.85em] text-neutral-600">{resolverCampo('loja.cnpj', ctx)}</p>
          )}
          {resolverCampo('loja.endereco', ctx) && (
            <p className="text-[0.85em] text-neutral-600">{resolverCampo('loja.endereco', ctx)}</p>
          )}
          {resolverCampo('loja.telefone', ctx) && (
            <p className="text-[0.85em] text-neutral-600">
              Telefone {resolverCampo('loja.telefone', ctx)}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[0.77em] uppercase tracking-wide text-neutral-500">Ordem de serviço</p>
        <p className="text-[1.85em] font-bold leading-tight">{resolverCampo('ordem.numero', ctx)}</p>
        <p className="text-[0.85em] text-neutral-600">
          Aberta em {resolverCampo('ordem.abertura', ctx)}
        </p>
      </div>
    </header>
  );
}

function BlocoCampos({ bloco, ctx }: { bloco: NoteBlock; ctx: ContextoNota }) {
  const colunas = Math.min(Math.max(bloco.columns ?? 1, 1), 4);
  const campos = (bloco.fields ?? []).filter((f) => {
    if (!OMITIR_SE_VAZIO.has(f.key)) return true;
    // O que some vazio (laudo, cor, garantia) só vira linha quando existe.
    return resolverCampo(f.key, ctx) !== '';
  });
  if (campos.length === 0) return null;
  return (
    <div
      className="grid gap-x-6 gap-y-3"
      style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}
    >
      {campos.map((f) => (
        <Campo key={f.key} rotulo={f.label || ROTULOS[f.key] || f.key}>
          {resolverCampo(f.key, ctx)}
        </Campo>
      ))}
    </div>
  );
}

function BlocoFicha({ bloco, ctx }: { bloco: NoteBlock; ctx: ContextoNota }) {
  const colunas = Math.min(Math.max(bloco.columns ?? 1, 1), 4);
  const ficha = fichaPreenchida(ctx.ordem.template, ctx.ordem.intake);
  // Ficha vazia não imprime título solto sobre nada: o bloco inteiro some.
  if (ficha.length === 0) return null;
  const titulo = bloco.title
    ? substituirPlaceholders(bloco.title, ctx)
    : modeloDe(ctx.ordem.template).fichaTitulo;
  return (
    <div>
      <p className="mb-2 text-[0.77em] uppercase tracking-wide text-neutral-500">{titulo}</p>
      <div
        className="grid gap-x-6 gap-y-3"
        style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}
      >
        {ficha.map((linha) => (
          <div key={linha.key} style={linha.longo ? { gridColumn: '1 / -1' } : undefined}>
            <Campo rotulo={linha.label}>{linha.valor}</Campo>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlocoTexto({ bloco, ctx }: { bloco: NoteBlock; ctx: ContextoNota }) {
  const corpo = bloco.body ? substituirPlaceholders(bloco.body, ctx) : '';
  if (!bloco.title && !corpo) return null;
  return (
    <div className="text-neutral-600">
      {bloco.title && (
        <p className="mb-1 font-semibold text-black">{substituirPlaceholders(bloco.title, ctx)}</p>
      )}
      {corpo && <p className="whitespace-pre-wrap break-words text-[1em]">{corpo}</p>}
    </div>
  );
}

// O cabeçalho de cada coluna da tabela, e de que lado ela encosta. "Item"
// mostra o TIPO da linha (Mão de obra / Peça); "Descrição" o texto. É o
// arranjo do papel de hoje.
const COLUNA_ITEM: Record<NoteItemColumn, { titulo: string; direita: boolean }> = {
  kind: { titulo: 'Item', direita: false },
  description: { titulo: 'Descrição', direita: false },
  quantity: { titulo: 'Qtd.', direita: true },
  unit: { titulo: 'Unit.', direita: true },
  total: { titulo: 'Total', direita: true },
};

function BlocoItens({ bloco, ctx }: { bloco: NoteBlock; ctx: ContextoNota }) {
  const { ordem } = ctx;
  const colunas = bloco.itemColumns ?? [];
  const pecas = modeloDe(ordem.template).pecas;
  const rotuloItem = (kind: WorkOrder['items'][number]['kind']) =>
    kind === 'part' ? pecas : kind === 'diagnosis' ? 'Pré-diagnóstico' : 'Mão de obra';

  const celula = (col: NoteItemColumn, item: WorkOrder['items'][number]) => {
    switch (col) {
      case 'kind':
        return rotuloItem(item.kind);
      case 'description':
        return item.description;
      case 'quantity':
        return item.quantity;
      case 'unit':
        return formatarPreco(item.unitAmount);
      case 'total':
        return formatarPreco(item.total ?? item.unitAmount);
    }
  };

  return (
    <div>
      <p className="mb-2 text-[0.77em] uppercase tracking-wide text-neutral-500">
        Serviço e {pecas.toLowerCase()}
      </p>
      <table className="w-full border-collapse text-[1em]">
        <thead>
          <tr className="border-y border-neutral-300 text-left text-[0.77em] uppercase tracking-wide text-neutral-500">
            {colunas.map((c) => (
              <th
                key={c}
                className={`py-1.5 font-medium ${COLUNA_ITEM[c].direita ? 'text-right' : ''}`}
              >
                {COLUNA_ITEM[c].titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ordem.items.length === 0 ? (
            <tr>
              <td colSpan={colunas.length} className="py-3 text-neutral-500">
                Sem itens lançados.
              </td>
            </tr>
          ) : (
            ordem.items.map((item, i) => (
              <tr key={item.id ?? i} className="border-b border-neutral-200">
                {colunas.map((c) => (
                  <td
                    key={c}
                    className={`py-1.5 ${COLUNA_ITEM[c].direita ? 'text-right' : ''}`}
                  >
                    {celula(c, item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function LinhaTotal({
  rotulo,
  valor,
  forte,
  riscado,
}: {
  rotulo: string;
  valor: string;
  forte?: boolean;
  riscado?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-6 ${forte ? 'pt-1 font-medium' : ''}`}>
      <dt>{rotulo}</dt>
      <dd className={`${forte ? 'text-[1.23em] font-bold' : ''} ${riscado ? 'line-through' : ''}`}>
        {valor}
      </dd>
    </div>
  );
}

function BlocoTotais({ ctx }: { ctx: ContextoNota }) {
  const { ordem } = ctx;
  const pecas = modeloDe(ordem.template).pecas.toLowerCase();
  const temDiagnostico = Number(ordem.diagnosisTotal) > 0;

  return (
    // Os totais FORA da tabela, e não num <tfoot>: o navegador reimprime o
    // tfoot no rodapé de cada página quando a lista de itens transborda, e o
    // cliente veria o "Valor total" duas vezes. Como bloco à parte, a soma sai
    // uma vez só; break-inside-avoid a mantém inteira numa página.
    <div className="flex break-inside-avoid justify-end">
      <dl className="w-full space-y-1 text-[1em] sm:w-1/2">
        <LinhaTotal rotulo="Valor dos serviços" valor={formatarPreco(ordem.laborTotal)} />
        <LinhaTotal rotulo={`Valor de ${pecas}`} valor={formatarPreco(ordem.partsTotal)} />
        {temDiagnostico && (
          <LinhaTotal
            rotulo="Valor do pré-diagnóstico"
            valor={formatarPreco(ordem.diagnosisTotal)}
          />
        )}
        {/* Na recusada, o orçamento continua impresso — é o que o cliente leu
            e recusou —, mas o número em negrito é o que ele paga: só o
            pré-diagnóstico. */}
        {ordem.declined ? (
          <>
            <LinhaTotal rotulo="Orçamento (recusado)" valor={formatarPreco(ordem.total)} riscado />
            <LinhaTotal rotulo="Valor a pagar" valor={formatarPreco(ordem.chargedTotal)} forte />
          </>
        ) : (
          <LinhaTotal rotulo="Valor total" valor={formatarPreco(ordem.total)} forte />
        )}
      </dl>
    </div>
  );
}

function BlocoAssinaturas({ ctx }: { ctx: ContextoNota }) {
  const { ordem } = ctx;
  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <div className="border-t border-neutral-400 pt-1 text-[0.85em] text-neutral-600">
          {ordem.customer.name}
        </div>
        <p className="text-[0.77em] text-neutral-500">
          Recebi o equipamento e concordo com os serviços descritos.
        </p>
      </div>
      <div>
        <div className="border-t border-neutral-400 pt-1 text-[0.85em] text-neutral-600">
          {resolverCampo('loja.nome', ctx)}
        </div>
        <p className="text-[0.77em] text-neutral-500">Responsável pelo atendimento</p>
      </div>
    </div>
  );
}

function BlocoImagem({ bloco, ctx }: { bloco: NoteBlock; ctx: ContextoNota }) {
  // Só o logo tem endereço hoje; o banner chega quando houver upload para ele.
  const src = bloco.image === 'logo' ? ctx.loja?.logoUrl : '';
  if (!src) return null;
  return <img src={src} alt="" className="inline-block h-14 object-contain" />;
}

// ---------------------------------------------------------------------------
// O despacho de um bloco pelo tipo, com a moldura comum (espaço antes, borda,
// alinhamento, negrito e corpo da letra).
// ---------------------------------------------------------------------------

function miolo(bloco: NoteBlock, ctx: ContextoNota): React.ReactNode {
  switch (bloco.kind) {
    case 'header':
      return <BlocoCabecalho ctx={ctx} />;
    case 'fields':
      return <BlocoCampos bloco={bloco} ctx={ctx} />;
    case 'intake':
      return <BlocoFicha bloco={bloco} ctx={ctx} />;
    case 'text':
      return <BlocoTexto bloco={bloco} ctx={ctx} />;
    case 'items':
      return <BlocoItens bloco={bloco} ctx={ctx} />;
    case 'totals':
      return <BlocoTotais ctx={ctx} />;
    case 'signatures':
      return <BlocoAssinaturas ctx={ctx} />;
    case 'image':
      return <BlocoImagem bloco={bloco} ctx={ctx} />;
    case 'divider':
      return <hr className="border-neutral-300" />;
    case 'spacer':
      return <div style={{ height: `${bloco.height ?? 0}mm` }} />;
    default:
      return null;
  }
}

function bordaClasse(bloco: NoteBlock): string {
  if (bloco.border === 'top') return 'border-t border-neutral-200 pt-4';
  if (bloco.border === 'box') return 'rounded border border-neutral-300 p-3';
  return '';
}

function Bloco({ bloco, ctx, base }: { bloco: NoteBlock; ctx: ContextoNota; base: number }) {
  const conteudo = miolo(bloco, ctx);
  // Bloco que não imprime nada (ficha vazia, imagem sem logo) não deixa a
  // moldura — espaço antes e borda — sozinha na folha.
  if (conteudo === null) return null;
  const classes = [
    ALINHAMENTO[bloco.align] ?? 'text-left',
    bloco.bold ? 'font-bold' : '',
    bordaClasse(bloco),
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={classes}
      style={{
        marginTop: bloco.gapTop ? `${bloco.gapTop}mm` : undefined,
        fontSize: `${base * FATOR_ESCALA[bloco.scale]}px`,
      }}
    >
      {conteudo}
    </div>
  );
}

// ---------------------------------------------------------------------------
// A folha.
// ---------------------------------------------------------------------------

export interface NotaFolhaProps {
  sheet: NoteSheet;
  ordem: WorkOrder;
  loja: Enterprise | null;
  /** O instante da impressão, para {{impressao.data}}. Parâmetro para o teste
   *  poder congelar a data; na tela, `new Date()`. */
  agora?: Date;
}

export function NotaFolha({ sheet, ordem, loja, agora }: NotaFolhaProps) {
  const ctx: ContextoNota = { ordem, loja, agora: agora ?? new Date() };
  const base = sheet.fontSize || 13;

  // A bobina de 80mm não tem margem lateral nem altura fixa: a folha termina
  // onde o conteúdo termina. O A4 arquiva a via assinada, com a margem do
  // papel virando o respiro da folha na tela.
  const ehBobina = sheet.paper === 'roll80';
  const classeArtigo = ehBobina
    ? 'mx-auto w-[80mm] max-w-full bg-white text-black shadow-lg print:w-auto print:shadow-none'
    : 'mx-auto min-h-[297mm] w-[210mm] max-w-full bg-white text-black shadow-lg print:min-h-0 print:w-auto print:shadow-none';
  const estiloArtigo: React.CSSProperties = ehBobina
    ? { fontSize: `${base}px`, padding: '4mm' }
    : { fontSize: `${base}px`, padding: `${sheet.margin}mm` };

  return (
    <article className={classeArtigo} style={estiloArtigo}>
      {sheet.blocks.map((bloco) => (
        <Bloco key={bloco.id} bloco={bloco} ctx={ctx} base={base} />
      ))}
    </article>
  );
}
