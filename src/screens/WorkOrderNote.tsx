'use client'

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2, Printer } from 'lucide-react';
import { api } from '@/api';
import { lerMinhaOrdem } from '@/api/work-order';
import { lerLayoutDaNota } from '@/api/note-template';
import type { WorkOrder } from '@/types/work-order';
import type { Enterprise } from '@/types/catalog';
import type { NoteSheet } from '@/types/note-sheet';
import { DEFAULT_NOTE_SHEET } from '@/lib/nota-folha';
import { NotaFolha } from '@/components/nota/nota-folha';
import { Button } from '@/components/ui/button';

// A nota da ordem de serviço, do lado do cliente.
//
// O DESENHO da folha é a loja quem faz: esta tela busca o LAYOUT em blocos
// (lerLayoutDaNota) e o entrega ao renderizador (NotaFolha), que o preenche
// com os dados da ordem e da loja. É o espelho da nota do portal
// (portal.gefensoftware.com/src/pages/work-orders/nota.tsx): são duas cópias
// do mesmo documento porque a vitrine e o portal são dois aplicativos sem
// pacote compartilhado — os tipos, o renderizador e o vocabulário já convivem
// assim. Mudou um lado, mude o outro: é o cliente e a oficina olhando o mesmo
// papel.
//
// A loja do cabeçalho sai da ORDEM, não da vitrine que a pessoa está
// navegando: esta lista é de todas as oficinas em que ela já deixou algo, e
// imprimir o CNPJ da loja errada seria pior que não imprimir.

const WorkOrderNote = () => {
  const params = useParams();
  const nameStore = (params?.name_store as string) ?? '';
  const id = (params?.id as string) ?? '';

  const [ordem, setOrdem] = useState<WorkOrder | null>(null);
  const [loja, setLoja] = useState<Enterprise | null>(null);
  const [layout, setLayout] = useState<NoteSheet | null>(null);
  const [erro, setErro] = useState<'nenhum' | 'sessao' | 'falha'>('nenhum');

  const carregar = useCallback(async () => {
    setErro('nenhum');
    try {
      const w = await lerMinhaOrdem(id);
      setOrdem(w);
      // A loja e o layout vêm da ordem, pelo slug. A rota é pública e aceita o
      // slug, então a nota funciona mesmo para uma oficina diferente da
      // vitrine aberta. O layout tem reserva: se a leitura dele falhar, a nota
      // ainda imprime o padrão de fábrica em vez de uma tela de erro na hora
      // da entrega.
      if (w.store?.slug) {
        const [{ data: e }, f] = await Promise.all([
          api.get<Enterprise>(`/enterprises/by-slug/${w.store.slug}`),
          lerLayoutDaNota(w.store.slug).catch(() => DEFAULT_NOTE_SHEET),
        ]);
        setLoja(e);
        setLayout(f);
      } else {
        // Ordem sem slug da loja: sem cabeçalho de marca, mas a nota ainda
        // sai com o padrão de fábrica e o nome que a própria ordem carrega.
        setLayout(DEFAULT_NOTE_SHEET);
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
      <div className="min-h-screen bg-muted p-8 text-center text-sm text-foreground">
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
      <div className="min-h-screen bg-muted p-8 text-center text-sm text-foreground">
        Não foi possível carregar a nota.{' '}
        <button className="underline" onClick={carregar}>
          Tentar de novo
        </button>
      </div>
    );
  }
  if (!ordem || !layout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-8 pb-28 print:bg-white print:py-0 print:pb-0">
      {/* A folha é branca com texto preto, e não usa o tema da loja (ver o
          comentário no topo de components/nota/nota-folha.tsx). O tema escuro
          alcança só a moldura: o fundo em volta da folha, o link de voltar e o
          botão de imprimir. */}
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          html, body { background: #fff !important; }
        }
      `}</style>

      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-4 px-4 print:hidden">
        <Link
          href={`/${nameStore}/ordens`}
          className="text-sm text-foreground underline hover:text-foreground"
        >
          ← Minhas ordens
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir ou salvar em PDF
        </Button>
      </div>

      <NotaFolha sheet={layout} ordem={ordem} loja={loja} />
    </div>
  );
};

export default WorkOrderNote;
