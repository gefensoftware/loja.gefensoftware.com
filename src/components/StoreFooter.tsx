import type { JSX } from 'react'

// Os documentos legais viviam só no Profile e no aviso de cadastro do
// AuthModal: quem chegava por um link de produto e nunca abria o perfil não
// tinha como alcançá-los. Este rodapé é o ponto da vitrine em que eles ficam
// sempre visíveis, em qualquer tela da loja.
//
// O `pb-24` não é estética: a Navbar é `fixed bottom-0` (Navbar.tsx), e sem
// folga própria o rodapé é renderizado atrás dela. As screens já carregam a
// própria margem inferior (`mb-20`/`pb-20`/`pb-28`), então o respiro acima
// daqui vem delas, não deste componente.
//
// O `bg-white` acompanha a Navbar (que também o crava): o rodapé não tem
// fundo próprio, e sem ele herda o fundo escuro do body — as screens é que
// pintam de branco a área delas, e o rodapé fica fora dessa área.
//
// `<a>` em vez de `<Link>` de propósito, como no Profile e no AuthModal: as
// rotas legais são estáticas e ficam fora do shell da loja, e a navegação
// dura é o que se quer ao sair da vitrine.
export default function StoreFooter(): JSX.Element {
  return (
    <footer className="bg-white flex items-center justify-center gap-3 pb-24 pt-6 text-xs text-gray-500">
      <a href="/termos-de-uso" className="hover:text-primary hover:underline">
        Termos de Uso
      </a>
      <span aria-hidden="true">·</span>
      <a
        href="/politica-de-privacidade"
        className="hover:text-primary hover:underline"
      >
        Política de Privacidade
      </a>
    </footer>
  )
}
