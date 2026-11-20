import { describe, expect, it } from 'vitest';
import type { Enterprise } from '@/types/catalog';
import type { WorkOrder } from '@/types/work-order';
import { formatarPreco } from '@/lib/price';
import {
  formatarDocumento,
  resolverCampo,
  substituirPlaceholders,
  type ContextoNota,
} from '@/lib/nota-folha';

// Os dados são o mínimo que resolverCampo lê; o `as unknown as` evita listar
// os campos que o teste não exercita. É fixture de teste, não dado real.
const loja = {
  name: 'Oficina Teste',
  tradeName: 'Oficina Teste - Matriz',
  cnpj: '12345678000190',
  logoUrl: '',
  address: {
    street: 'Rua das Flores',
    number: '123',
    complement: '',
    neighborhood: 'Centro',
    city: 'Rio de Janeiro',
    state: 'RJ',
  },
  emails: [{ name: '', email: 'contato@oficina.com' }],
  phones: [{ name: '', phone: '(21) 3333-4444' }],
} as unknown as Enterprise;

const ordem = {
  number: 1,
  store: { id: 'ent', name: 'Oficina da Ordem', slug: 'oficina-ordem' },
  status: 'received',
  template: 'automotive',
  intake: {},
  customer: { name: 'João', phone: '(21) 96688-8918', email: 'joao@gmail.com', document: '14818526711' },
  equipment: { kind: 'vehicle', brand: 'Fiat', model: 'Uno', identifier: 'ABC-1234', color: 'black' },
  reportedIssue: 'Barulho no motor',
  diagnosis: '',
  items: [],
  laborTotal: '23.00',
  partsTotal: '222.00',
  diagnosisTotal: '0.00',
  total: '245.00',
  chargedTotal: '245.00',
  declined: false,
  estimatedTotal: '',
  approvedBy: '',
  quotedAt: null,
  approvedAt: null,
  readyAt: null,
  deliveredAt: null,
  createdAt: '2026-11-19T10:00:00Z',
} as unknown as WorkOrder;

const ctx: ContextoNota = { ordem, loja, agora: new Date('2026-11-19T12:00:00Z') };

describe('formatarDocumento', () => {
  it('formata CPF e CNPJ', () => {
    expect(formatarDocumento('14818526711')).toBe('148.185.267-11');
    expect(formatarDocumento('12345678000190')).toBe('12.345.678/0001-90');
  });
});

describe('resolverCampo', () => {
  it('traduz cliente, ordem e equipamento', () => {
    expect(resolverCampo('cliente.nome', ctx)).toBe('João');
    expect(resolverCampo('cliente.documento', ctx)).toBe('148.185.267-11');
    expect(resolverCampo('ordem.numero', ctx)).toBe('nº 1');
    expect(resolverCampo('ordem.status', ctx)).toBe('Recebida');
    expect(resolverCampo('equipamento.tipo', ctx)).toBe('Veículo');
  });

  it('a cor do veículo vira o nome do CRLV', () => {
    expect(resolverCampo('equipamento.cor', ctx)).toBe('Preta');
  });

  it('o laudo vazio e a garantia (inexistente na vitrine) somem', () => {
    expect(resolverCampo('ordem.laudo', ctx)).toBe('');
    expect(resolverCampo('ordem.garantia', ctx)).toBe('');
  });

  it('a vitrine não mostra desconto por linha', () => {
    expect(resolverCampo('total.desconto_servicos', ctx)).toBe('');
    expect(resolverCampo('total.desconto_pecas', ctx)).toBe('');
  });

  it('a loja e os totais saem formatados', () => {
    expect(resolverCampo('loja.nome', ctx)).toBe('Oficina Teste - Matriz');
    expect(resolverCampo('loja.cnpj', ctx)).toBe('CNPJ 12.345.678/0001-90');
    expect(resolverCampo('total.geral', ctx)).toBe(formatarPreco('245.00'));
  });

  it('sem a loja carregada, o nome cai no da própria ordem', () => {
    const semLoja: ContextoNota = { ...ctx, loja: null };
    expect(resolverCampo('loja.nome', semLoja)).toBe('Oficina da Ordem');
    expect(resolverCampo('loja.cnpj', semLoja)).toBe('');
    expect(resolverCampo('loja.endereco', semLoja)).toBe('');
  });

  it('chave fora do contrato devolve "" em silêncio', () => {
    expect(resolverCampo('cliente.inexistente', ctx)).toBe('');
  });
});

describe('substituirPlaceholders', () => {
  it('troca a chave, apara espaço e zera a desconhecida', () => {
    expect(substituirPlaceholders('{{ cliente.nome }}', ctx)).toBe('João');
    expect(substituirPlaceholders('X {{clinte.nome}} Y', ctx)).toBe('X  Y');
  });
  it('troca {{impressao.data}} por uma data', () => {
    const saida = substituirPlaceholders('Emitido em {{impressao.data}}.', ctx);
    expect(saida).not.toContain('{{');
    expect(saida).toMatch(/2026/);
  });
});
