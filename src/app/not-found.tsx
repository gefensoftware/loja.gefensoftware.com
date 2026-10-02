import Link from 'next/link'
import type { Metadata } from 'next'
import IrParaLoja from '@/components/home/IrParaLoja'

/**
 * A tela de 404 do domínio.
 *
 * Atende dois caminhos: um endereço que não existe na plataforma e um slug
 * que não é loja nenhuma (`notFound()` no layout de `[name_store]`). Antes
 * desse `notFound()`, o segundo caso respondia 200 com uma tela de alerta
 * dentro da casca da loja — página fina indexável, multiplicada por cada erro
 * de digitação.
 *
 * O `noindex` é cinto e suspensório: o status já é 404 e o Google não indexa
 * 404, mas a página também é alcançável por navegação de cliente, onde o
 * status não chega.
 *
 * O campo de endereço está aqui, e não só na home, porque é exatamente aqui
 * que ele serve: quem caiu nesta tela errou o nome da loja, e a correção é um
 * campo de distância em vez de uma volta à home.
 */
export const metadata: Metadata = {
  title: 'Página não encontrada',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-lg">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Erro 404
        </p>

        <h1 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">
          Esta página não existe
        </h1>

        <p className="mt-4 leading-relaxed text-muted-foreground">
          O endereço pode ter sido digitado com algum erro, ou a loja que você
          procura não está mais publicada aqui. O endereço de um catálogo tem a
          forma{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">
            loja.gefensoftware.com/nome-da-loja
          </code>
          .
        </p>

        <IrParaLoja />

        <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/" className="text-primary hover:underline">
            Ir para a página inicial
          </Link>
          <Link href="/termos-de-uso" className="text-primary hover:underline">
            Termos de Uso
          </Link>
          <Link
            href="/politica-de-privacidade"
            className="text-primary hover:underline"
          >
            Política de Privacidade
          </Link>
        </nav>
      </div>
    </main>
  )
}
