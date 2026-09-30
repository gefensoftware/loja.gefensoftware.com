import Link from 'next/link';
import type { DocumentoLegal } from '@/content/legal/tipos';

/**
 * Casca visual compartilhada pelos Termos de Uso e pela Política de
 * Privacidade. É um componente de servidor: o documento é texto estático, não
 * tem estado nem interação, e mandá-lo para o cliente só engordaria o bundle.
 *
 * O sumário não é enfeite. São documentos longos lidos no celular, quase
 * sempre à procura de um ponto específico ("como apago minha conta", "quem
 * responde pelo pedido") — sem as âncoras, achar esse ponto custa uma rolagem
 * inteira.
 */
export default function PaginaLegal({ documento }: { documento: DocumentoLegal }) {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-5 py-8 md:py-12">
          <Link
            href="/"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Voltar
          </Link>

          <h1 className="mt-4 text-2xl font-bold text-foreground md:text-3xl">
            {documento.titulo}
          </h1>

          <p className="mt-3 leading-relaxed text-muted-foreground">{documento.resumo}</p>

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <div className="flex gap-1.5">
              <dt className="font-medium text-foreground">Em vigor desde:</dt>
              <dd>{documento.vigencia}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-medium text-foreground">Última atualização:</dt>
              <dd>{documento.atualizadoEm}</dd>
            </div>
            {/* A versão fica visível porque é o que se grava no aceite: quem
                quiser conferir o que aceitou precisa conseguir comparar o
                identificador com o que está no ar. */}
            <div className="flex gap-1.5">
              <dt className="font-medium text-foreground">Versão:</dt>
              <dd>{documento.versao}</dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-8 md:py-12">
        <nav aria-label="Sumário" className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Sumário
          </h2>
          <ol className="mt-3 space-y-1.5">
            {documento.secoes.map((secao, indice) => (
              <li key={secao.id} className="text-sm leading-relaxed">
                <a
                  href={`#${secao.id}`}
                  className="text-foreground hover:text-primary hover:underline"
                >
                  <span className="mr-1.5 tabular-nums text-muted-foreground">
                    {indice + 1}.
                  </span>
                  {secao.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="mt-8 space-y-10">
          {documento.secoes.map((secao, indice) => (
            <section
              key={secao.id}
              id={secao.id}
              // `scroll-mt` afasta o título do topo quando se chega pela
              // âncora; sem isso o cabeçalho encosta na borda da janela e a
              // seção parece começar no meio.
              className="scroll-mt-6"
            >
              <h2 className="text-lg font-bold text-foreground md:text-xl">
                <span className="mr-2 tabular-nums font-semibold text-muted-foreground">
                  {indice + 1}.
                </span>
                {secao.titulo}
              </h2>
              <div className="mt-3 space-y-3 leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_li]:leading-relaxed [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:font-semibold [&_strong]:text-gray-900">
                {secao.corpo}
              </div>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
