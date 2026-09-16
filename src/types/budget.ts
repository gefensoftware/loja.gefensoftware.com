// Espelho de budgetRequestResponse na API Go (internal/adapters/in/http/
// budget_dto.go).
//
// Cada lado move o que é dele: a loja sai de `pending` para `quoted` (cotou)
// ou `rejected` (não vai cotar); o cliente sai de `quoted` para `accepted` ou
// `declined`, e pode cancelar enquanto o pedido estiver em aberto.
export type BudgetStatus =
  | 'pending'
  | 'quoted'
  | 'accepted'
  | 'declined'
  | 'rejected'
  | 'canceled';

export type BudgetRequest = {
  id: string;
  enterpriseId: string;
  status: BudgetStatus;
  message: string;
  // Nulo até a loja cotar. Texto decimal ("1899.90"), nunca number: o valor
  // que o cliente vai aceitar não passa por ponto flutuante.
  quoteAmount: string | null;
  quoteNote: string;
  quotedAt: string | null;
  answeredAt: string | null;
  closedNote: string;
  product: {
    id: string;
    code: number;
    title: string;
    status: string;
    image: { id: string; url: string; position: number } | null;
  };
  customer: { id: string; name: string; email: string; phone: string };
  createdAt: string;
  updatedAt: string;
};

// Um pedido em aberto é o que ainda pode andar: a loja pode cotar, ou o
// cliente pode responder e cancelar.
export function emAberto(status: BudgetStatus): boolean {
  return status === 'pending' || status === 'quoted';
}
