// Espelho de workOrderResponse na API Go (internal/adapters/in/http/
// workorder_dto.go), no recorte que chega ao CLIENTE.
//
// A anotação interna da loja vem sempre vazia nesta ponta
// (toWorkOrderResponseForCustomer): um campo onde a oficina escreve para si
// mesma não pode chegar a quem ela atende.

export type WorkOrderStatus =
  | 'received'
  | 'quoted'
  | 'approved'
  | 'ready'
  | 'delivered'
  // A loja reabriu a nota para corrigi-la. O equipamento continua com o
  // cliente — não é serviço voltando para a bancada.
  | 'reopened'
  | 'declined'
  | 'canceled';

export type WorkOrderItem = {
  id?: string;
  kind: 'part' | 'labor';
  description: string;
  quantity: number;
  // Texto decimal, nunca number: o valor que o cliente vai aprovar não passa
  // por ponto flutuante.
  unitAmount: string;
  total?: string;
};

// A loja que emitiu a ordem. Vem junto porque esta lista é de TODAS as
// oficinas em que a pessoa já deixou algo: sem isso, a nota impressa sairia
// com o cabeçalho da loja que ela estivesse navegando — o CNPJ errado num
// papel que ela guarda.
export type WorkOrderStore = {
  id: string;
  name: string;
  slug: string;
};

export type WorkOrder = {
  id: string;
  enterpriseId: string;
  store: WorkOrderStore | null;
  number: number;
  status: WorkOrderStatus;
  /** O modelo da ficha de entrada. Ver lib/modelos-os.ts. */
  template: 'automotive' | 'electronics' | 'generic';
  /**
   * As respostas da ficha de entrada, por chave. Chega SEM os campos
   * sensíveis: a senha que o cliente deixou na assistência não volta numa
   * resposta de API.
   */
  intake: Record<string, string>;
  customer: {
    userId: string | null;
    name: string;
    phone: string;
    email: string;
    /** CPF ou CNPJ, como a nota impressa o mostra. */
    document: string;
  };
  equipment: {
    id: string;
    kind: 'vehicle' | 'device' | 'other';
    brand: string;
    model: string;
    identifier: string;
    label: string;
  } | null;
  reportedIssue: string;
  diagnosis: string;
  closedNote: string;
  items: WorkOrderItem[];
  /** Os três números do orçamento, somados pelo servidor. */
  laborTotal: string;
  partsTotal: string;
  total: string;
  /**
   * O valor combinado na aprovação, congelado. Vazio se ninguém aprovou.
   *
   * A vitrine NÃO o mostra: o cliente lê o orçamento em três linhas —
   * serviços, peças, total — e é só isso. Fica aqui porque este arquivo
   * espelha a resposta da API, não a tela.
   */
  estimatedTotal: string;
  quotedAt: string | null;
  approvedAt: string | null;
  approvedBy: '' | 'customer' | 'store';
  readyAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** A ordem está esperando uma decisão do cliente. */
export function aguardandoVoce(o: WorkOrder): boolean {
  return o.status === 'quoted';
}
