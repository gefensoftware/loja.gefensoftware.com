import Link from 'next/link'
import IrParaLoja from '@/components/home/IrParaLoja'
import { EMPRESA } from '@/content/legal/empresa'

/**
 * A home do domínio da plataforma.
 *
 * Antes era a tela "Página em Construção", e isso custou a conta: a política
 * do AdSense proíbe anúncio em domínio cuja tela esteja em construção ou sem
 * conteúdo do editor, e a raiz é a primeira coisa que o revisor abre. Daí a
 * regra que esta tela precisa respeitar ao mudar: **o que estiver aqui tem de
 * ser conteúdo de verdade** — o que a plataforma é, o que o visitante pode
 * fazer, quem responde por ela e como chegar à loja que ele procura.
 *
 * Componente de servidor: é texto, e o único pedaço com estado (o campo que
 * leva à loja) é um componente de cliente à parte.
 *
 * O que esta tela NÃO tem, de propósito:
 *
 * - **Lista de lojas.** O catálogo é do estabelecimento e o link é ele quem
 *   distribui; a API não expõe — e não deve expor — um diretório público de
 *   clientes da Gefen. Por isso o caminho até a loja é o campo de endereço, e
 *   não uma vitrine de vitrines.
 * - **Anúncio.** `rotaAceitaAnuncio` (`lib/anuncios.ts`) não inclui `/`: a
 *   home é página da plataforma, não catálogo de lojista.
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            {EMPRESA.nomeFantasia}
          </p>

          <h1 className="mt-3 text-3xl font-bold leading-tight text-foreground md:text-4xl">
            Catálogo digital para estabelecimentos
          </h1>

          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Esta é a plataforma onde restaurantes, lojas e prestadores de serviço
            publicam o catálogo que os clientes consultam pelo celular. Cada
            estabelecimento tem o seu endereço próprio aqui dentro, com os seus
            produtos, os seus horários e os seus dados de contato.
          </p>

          <h2 className="mt-10 text-lg font-semibold text-foreground">
            Procurando o catálogo de um estabelecimento?
          </h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            O endereço tem a forma{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">
              loja.gefensoftware.com/nome-da-loja
            </code>
            . Digite o nome abaixo — ou cole o endereço inteiro, se você o
            recebeu por mensagem.
          </p>
          <IrParaLoja />
          <p className="mt-3 text-sm text-muted-foreground">
            Não mantemos uma lista pública de estabelecimentos: o link de cada
            catálogo é divulgado pelo próprio estabelecimento.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
        <section>
          <h2 className="text-2xl font-bold text-foreground">
            O que você pode fazer no catálogo
          </h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Depende do que cada estabelecimento habilitou. As ressalvas abaixo
            não são detalhe: elas dizem o que acontece de fato quando você
            toca no botão, e as regras completas estão nos{' '}
            <Link href="/termos-de-uso" className="text-primary hover:underline">
              Termos de Uso
            </Link>
            .
          </p>

          {/* Cada item descreve o comportamento real do código, com a ressalva
              que os Termos fazem questão de registrar. Se o fluxo mudar — se o
              pedido passar a ser gravado na plataforma, por exemplo — o texto
              aqui muda junto; é por isso que ele é específico em vez de
              publicitário. */}
          <dl className="mt-8 space-y-6">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <dt className="font-semibold text-foreground">
                Consultar produtos e serviços
              </dt>
              <dd className="mt-1.5 leading-relaxed text-muted-foreground">
                O catálogo completo, separado por categoria, com foto, descrição
                e preço. Não exige conta nem cadastro.
              </dd>
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <dt className="font-semibold text-foreground">
                Montar um carrinho e enviar o pedido
              </dt>
              <dd className="mt-1.5 leading-relaxed text-muted-foreground">
                O carrinho vira uma mensagem pronta para o contato do
                estabelecimento. O envio da mensagem não é a aceitação do
                pedido: quem confirma disponibilidade, preço final e entrega é o
                estabelecimento, na conversa.
              </dd>
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <dt className="font-semibold text-foreground">
                Solicitar um agendamento
              </dt>
              <dd className="mt-1.5 leading-relaxed text-muted-foreground">
                Quando o estabelecimento trabalha com horário marcado. É uma
                solicitação, não um horário garantido — ela vale depois da
                confirmação dele, e você pode cancelá-la enquanto estiver em
                aberto.
              </dd>
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <dt className="font-semibold text-foreground">
                Pedir um orçamento
              </dt>
              <dd className="mt-1.5 leading-relaxed text-muted-foreground">
                Para produto ou serviço que precisa ser cotado. Você descreve o
                que precisa, o estabelecimento responde com o valor, e aceitar
                ou recusar é sua decisão.
              </dd>
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <dt className="font-semibold text-foreground">
                Acompanhar uma ordem de serviço
              </dt>
              <dd className="mt-1.5 leading-relaxed text-muted-foreground">
                Para quem deixou um equipamento em manutenção: o andamento do
                serviço e a nota, quando o estabelecimento usa esse recurso.
              </dd>
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <dt className="font-semibold text-foreground">
                Ter uma conta com seu histórico
              </dt>
              <dd className="mt-1.5 leading-relaxed text-muted-foreground">
                Opcional. Guarda seus agendamentos, orçamentos e o carrinho
                entre visitas. Consultar o catálogo e enviar pedido por mensagem
                funcionam sem ela.
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold text-foreground">
            Quem responde pelo quê
          </h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            A {EMPRESA.nomeFantasia} desenvolve e opera o software. Os produtos,
            os preços, as fotos, os prazos e o atendimento são do
            estabelecimento cujo catálogo você acessa — é com ele que o seu
            pedido é combinado, e os dados de contato dele estão na página do
            catálogo. Reclamação sobre um produto ou sobre uma entrega se
            resolve com o estabelecimento; problema no funcionamento do site é
            com a gente.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold text-foreground">
            Para estabelecimentos
          </h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Para publicar o seu catálogo nesta plataforma, fale com a gente em{' '}
            <a
              href={`mailto:${EMPRESA.emailContato}`}
              className="text-primary hover:underline"
            >
              {EMPRESA.emailContato}
            </a>{' '}
            ou conheça o resto do nosso trabalho em{' '}
            <a
              href={EMPRESA.site}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              gefensoftware.com
            </a>
            .
          </p>
        </section>
      </div>

      {/* A identificação da empresa fica na home, e não só nos documentos
          legais: é o que permite a quem chegou pelo domínio nu saber com quem
          está falando sem ter de abrir os Termos. */}
      <footer className="border-t bg-card">
        <div className="mx-auto max-w-3xl px-5 py-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Responsável pela plataforma
          </h2>

          <address className="mt-3 space-y-1 not-italic leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">{EMPRESA.razaoSocial}</p>
            <p>CNPJ {EMPRESA.cnpj}</p>
            <p>{EMPRESA.endereco}</p>
            <p>
              Contato:{' '}
              <a
                href={`mailto:${EMPRESA.emailContato}`}
                className="text-primary hover:underline"
              >
                {EMPRESA.emailContato}
              </a>
            </p>
            <p>
              Encarregado de dados (LGPD): {EMPRESA.nomeEncarregado} —{' '}
              <a
                href={`mailto:${EMPRESA.emailEncarregado}`}
                className="text-primary hover:underline"
              >
                {EMPRESA.emailEncarregado}
              </a>
            </p>
          </address>

          <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
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
      </footer>
    </main>
  )
}
