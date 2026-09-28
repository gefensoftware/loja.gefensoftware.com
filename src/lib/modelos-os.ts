// ---------------------------------------------------------------------------
// Os modelos de ordem de serviço, no recorte do CLIENTE.
//
// Arquivo irmão de portal.gefensoftware.com/src/lib/modelos-os.ts, e pelo
// mesmo motivo de vocabulario.ts: são dois aplicativos sem pacote
// compartilhado. Aqui falta o que só serve a quem PREENCHE a ficha
// (placeholder, texto de ajuda); fica o que serve a quem a LÊ.
//
// A fonte das chaves é internal/core/domain/workorder_template.go. Os campos
// sensíveis não aparecem nesta lista porque a API já os remove das respostas
// do cliente (toWorkOrderResponseForCustomer) — a ausência aqui é a segunda
// tranca, não a primeira.
// ---------------------------------------------------------------------------

export type ModeloOS = 'automotive' | 'electronics' | 'generic';

type Campo = {
  key: string;
  label: string;
  /** Traduz o valor guardado para o que se lê. */
  legivel?: (v: string) => string;
  /** Ocupa a linha inteira: o que se escreve em frases. */
  longo?: boolean;
};

const deLista = (opcoes: Record<string, string>) => (v: string) => opcoes[v] ?? v;

const MODELOS: Record<ModeloOS, { fichaTitulo: string; pecas: string; campos: Campo[] }> = {
  automotive: {
    fichaTitulo: 'Como o veículo chegou',
    pecas: 'Peças trocadas',
    campos: [
      { key: 'km', label: 'KM na entrada', legivel: (v) => `${v} km` },
      {
        key: 'fuel',
        label: 'Combustível',
        legivel: deLista({
          empty: 'Reserva',
          quarter: '1/4',
          half: '1/2',
          three_quarters: '3/4',
          full: 'Cheio',
        }),
      },
      { key: 'damages', label: 'Avarias visuais', longo: true },
      { key: 'accessories', label: 'Acessórios', longo: true },
    ],
  },
  electronics: {
    fichaTitulo: 'Como o aparelho chegou',
    pecas: 'Componentes trocados',
    campos: [
      { key: 'accessories', label: 'Acessórios entregues', longo: true },
      {
        key: 'screen',
        label: 'Estado da tela',
        legivel: deLista({
          intact: 'Íntegra',
          cracked: 'Trincada',
          broken: 'Quebrada',
          dead: 'Não liga',
        }),
      },
      {
        key: 'liquid',
        label: 'Teve contato com líquido?',
        legivel: (v) => (v === 'true' ? 'Sim' : 'Não'),
      },
    ],
  },
  generic: { fichaTitulo: 'Como o equipamento chegou', pecas: 'Peças trocadas', campos: [] },
};

export function modeloDe(template: string | undefined) {
  return MODELOS[(template as ModeloOS) ?? 'generic'] ?? MODELOS.generic;
}

/**
 * A ficha preenchida, em pares rótulo/valor, na ordem do modelo. Campo sem
 * resposta fica de fora: ficha cheia de travessão não é registro, é ruído.
 */
export function fichaPreenchida(
  template: string | undefined,
  intake: Record<string, string> | undefined,
): { key: string; label: string; valor: string; longo: boolean }[] {
  const respostas = intake ?? {};
  return modeloDe(template)
    .campos.map((c) => {
      const bruto = respostas[c.key] ?? '';
      return {
        key: c.key,
        label: c.label,
        valor: bruto ? (c.legivel ? c.legivel(bruto) : bruto) : '',
        longo: c.longo ?? false,
      };
    })
    .filter((l) => l.valor !== '');
}
