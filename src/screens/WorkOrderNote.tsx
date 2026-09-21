'use client'

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2, Printer } from 'lucide-react';
import { api } from '@/api';
import { lerMinhaOrdem } from '@/api/work-order';
import type { WorkOrder } from '@/types/work-order';
import type { Enterprise } from '@/types/catalog';
import { formatarPreco } from '@/lib/price';
import { Button } from '@/components/ui/button';

// A nota da ordem de serviço, do lado do cliente.
//
// É a MESMA folha que o portal imprime (portal.gefensoftware.com/src/pages/
// work-orders/nota.tsx). São duas cópias do mesmo documento porque a vitrine
// e o portal são dois aplicativos sem pacote compartilhado — os tipos e o
// vocabulário já convivem assim. Mudou o documento num lado, mude no outro:
// é o cliente e a oficina olhando o mesmo papel.
//
// A loja do cabeçalho sai da ORDEM, não da vitrine que a pessoa está
// navegando: esta lista é de todas as oficinas em que ela já deixou algo, e
// imprimir o CNPJ da loja errada seria pior que não imprimir.

function formatarDocumento(doc: string): string {
  const d = doc.replace(/\D/g, '');
  if (d.length === 11) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  if (d.length === 14) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
  return doc;
}

function formatarInstante(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const TIPO_EQUIPAMENTO: Record<string, string> = {
  vehicle: 'Veículo',
  device: 'Aparelho',
  other: 'Equipamento',
};

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-neutral-500">{rotulo}</p>
      <p className="text-[13px] text-black">{children || '—'}</p>
    </div>
  );
}

const WorkOrderNote = () => {
  const params = useParams();
  const nameStore = (params?.name_store as string) ?? '';
  const id = (params?.id as string) ?? '';

  const [ordem, setOrdem] = useState<WorkOrder | null>(null);
  const [loja, setLoja] = useState<Enterprise | null>(null);
  const [erro, setErro] = useState<'nenhum' | 'sessao' | 'falha'>('nenhum');

  const carregar = useCallback(async () => {
    setErro('nenhum');
    try {
      const w = await lerMinhaOrdem(id);
      setOrdem(w);
      // A loja vem da ordem. A rota é pública e aceita o slug, então a nota
      // funciona mesmo para uma oficina diferente da vitrine aberta.
      if (w.store?.slug) {
        const { data } = await api.get<Enterprise>(`/enterprises/by-slug/${w.store.slug}`);
        setLoja(data);
      }
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      setErro(status === 401 || status === 404 ? 'sessao' : 'falha');
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (erro === 'sessao') {
    return (
      <div className="min-h-screen bg-neutral-200 p-8 text-center text-sm text-neutral-700">
        Não encontramos esta ordem na sua conta.{' '}
        <Link href={`/${nameStore}/ordens`} className="underline">
          Ver minhas ordens
        </Link>
        .
      </div>
    );
  }
  if (erro === 'falha') {
    return (
      <div className="min-h-screen bg-neutral-200 p-8 text-center text-sm text-neutral-700">
        Não foi possível carregar a nota.{' '}
        <button className="underline" onClick={carregar}>
          Tentar de novo
        </button>
      </div>
    );
  }
  if (!ordem) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-200">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const nomeDaLoja = loja?.tradeName || loja?.name || ordem.store?.name || '';
  const telefone = loja?.phones?.[0]?.phone ?? '';
  const endereco = loja?.address
    ? `${loja.address.street}, ${loja.address.number}${loja.address.complement ? ` ${loja.address.complement}` : ''} — ${loja.address.neighborhood}, ${loja.address.city}/${loja.address.state}`
    : '';

  return (
    <div className="min-h-screen bg-neutral-200 py-8 pb-28 print:bg-white print:py-0 print:pb-0">
      {/* A folha é branca com texto preto, e não usa o tema da loja: a
          vitrine de tema escuro imprimiria uma página inteira de tinta. A
          marca dela entra pelo logo e pelo cabeçalho. */}
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          html, body { background: #fff !important; }
        }
      `}</style>

      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-4 px-4 print:hidden">
        <Link
          href={`/${nameStore}/ordens`}
          className="text-sm text-neutral-700 underline hover:text-neutral-900"
        >
          ← Minhas ordens
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir ou salvar em PDF
        </Button>
      </div>

      <article className="mx-auto min-h-[297mm] w-[210mm] max-w-full bg-white p-[14mm] text-black shadow-lg print:min-h-0 print:w-auto print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b border-neutral-300 pb-4">
          <div className="flex min-w-0 items-start gap-3">
            {loja?.logoUrl && (
              <img src={loja.logoUrl} alt="" className="h-14 w-14 shrink-0 object-contain" />
            )}
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight">{nomeDaLoja}</p>
              {loja?.cnpj && (
                <p className="text-[11px] text-neutral-600">CNPJ {formatarDocumento(loja.cnpj)}</p>
              )}
              {endereco && <p className="text-[11px] text-neutral-600">{endereco}</p>}
              {telefone && <p className="text-[11px] text-neutral-600">Telefone {telefone}</p>}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500">
              Ordem de serviço
            </p>
            <p className="text-2xl font-bold leading-tight">nº {ordem.number}</p>
            <p className="text-[11px] text-neutral-600">
              Aberta em {formatarInstante(ordem.createdAt)}
            </p>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Campo rotulo="Cliente">{ordem.customer.name}</Campo>
          <Campo rotulo="CPF / CNPJ">
            {ordem.customer.document ? formatarDocumento(ordem.customer.document) : ''}
          </Campo>
          <Campo rotulo="Telefone">{ordem.customer.phone}</Campo>
          <Campo rotulo="E-mail">{ordem.customer.email}</Campo>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-neutral-200 pt-4 sm:grid-cols-4">
          <Campo rotulo="Equipamento">
            {TIPO_EQUIPAMENTO[ordem.equipment?.kind ?? 'other']}
          </Campo>
          <Campo rotulo="Marca">{ordem.equipment?.brand}</Campo>
          <Campo rotulo="Modelo">{ordem.equipment?.model}</Campo>
          <Campo rotulo="Placa / nº de série">{ordem.equipment?.identifier}</Campo>
        </section>

        <section className="mt-5 border-t border-neutral-200 pt-4">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">
            Defeito relatado pelo cliente
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[13px]">{ordem.reportedIssue}</p>
          {ordem.diagnosis && (
            <>
              <p className="mt-3 text-[10px] uppercase tracking-wide text-neutral-500">
                Laudo técnico
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[13px]">{ordem.diagnosis}</p>
            </>
          )}
        </section>

        <section className="mt-5">
          <p className="mb-2 text-[10px] uppercase tracking-wide text-neutral-500">
            Peças e serviços
          </p>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-y border-neutral-300 text-left text-[10px] uppercase tracking-wide text-neutral-500">
                <th className="py-1.5 font-medium">Item</th>
                <th className="py-1.5 font-medium">Descrição</th>
                <th className="py-1.5 text-right font-medium">Qtd.</th>
                <th className="py-1.5 text-right font-medium">Unit.</th>
                <th className="py-1.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {ordem.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-3 text-neutral-500">
                    Sem itens lançados.
                  </td>
                </tr>
              ) : (
                ordem.items.map((item, i) => (
                  <tr key={item.id ?? i} className="border-b border-neutral-200">
                    <td className="py-1.5">{item.kind === 'part' ? 'Peça' : 'Mão de obra'}</td>
                    <td className="py-1.5">{item.description}</td>
                    <td className="py-1.5 text-right">{item.quantity}</td>
                    <td className="py-1.5 text-right">{formatarPreco(item.unitAmount)}</td>
                    <td className="py-1.5 text-right">
                      {formatarPreco(item.total ?? item.unitAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="py-2 text-right font-medium">
                  Total
                </td>
                <td className="py-2 text-right text-base font-bold">
                  {formatarPreco(ordem.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-neutral-200 pt-4 sm:grid-cols-4">
          <Campo rotulo="Orçamento enviado">{formatarInstante(ordem.quotedAt)}</Campo>
          <Campo rotulo="Aprovação">
            {ordem.approvedAt
              ? `${formatarInstante(ordem.approvedAt)} · ${
                  ordem.approvedBy === 'store' ? 'registrada pela loja' : 'por você'
                }`
              : ''}
          </Campo>
          <Campo rotulo="Pronta em">{formatarInstante(ordem.readyAt)}</Campo>
          <Campo rotulo="Entregue em">{formatarInstante(ordem.deliveredAt)}</Campo>
        </section>

        <section className="mt-12 grid grid-cols-2 gap-8">
          <div>
            <div className="border-t border-neutral-400 pt-1 text-[11px] text-neutral-600">
              {ordem.customer.name}
            </div>
            <p className="text-[10px] text-neutral-500">
              Recebi o equipamento e concordo com os serviços descritos.
            </p>
          </div>
          <div>
            <div className="border-t border-neutral-400 pt-1 text-[11px] text-neutral-600">
              {nomeDaLoja}
            </div>
            <p className="text-[10px] text-neutral-500">Responsável pelo atendimento</p>
          </div>
        </section>

        <footer className="mt-8 border-t border-neutral-200 pt-2 text-[9px] text-neutral-500">
          Documento não fiscal, emitido em {formatarInstante(new Date().toISOString())}.
        </footer>
      </article>
    </div>
  );
};

export default WorkOrderNote;
