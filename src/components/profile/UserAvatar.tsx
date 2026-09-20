'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { UserType } from '@/store/user'

interface Props {
  user: UserType | null
  /** Lado do círculo, em classes do Tailwind (ex.: 'h-24 w-24'). */
  tamanho?: string
  className?: string
}

/**
 * O avatar do cliente, com a mesma ordem de tentativas em toda a vitrine:
 * a foto que a pessoa enviou; na falta dela, o desenho gerado a partir do
 * nome; e, se nem esse carregar, a inicial sobre a cor da loja.
 *
 * Estava escrito direto no `Profile.tsx` quando havia um lugar só para
 * mostrar avatar. Agora há dois (a lista e a tela de foto), e a ordem de
 * precedência é exatamente o tipo de detalhe que se copia errado.
 *
 * `ui-avatars` continua como intermediário — não como único caminho, que é
 * o que era antes desta fatia. Vale notar que ele é um serviço externo que
 * recebe o NOME do cliente na URL; quem já enviou foto não passa por ele.
 */
export default function UserAvatar({ user, tamanho = 'h-32 w-32', className = '' }: Props) {
  const nome = user?.name ?? ''
  const src = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=random&size=256&bold=true`

  return (
    <Avatar className={`${tamanho} border-4 border-white shadow-2xl ring-4 ring-primary ${className}`}>
      {/* A chave força o <img> a remontar quando a URL muda. Sem ela, o Radix
          mantém o estado "carregada" da imagem anterior e a foto recém-enviada
          só aparecia depois de recarregar a página. */}
      <AvatarImage key={src} src={src} alt={nome ? `Foto de ${nome}` : 'Foto de perfil'} />
      <AvatarFallback className="text-3xl font-bold bg-primary text-white">
        {nome.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}
