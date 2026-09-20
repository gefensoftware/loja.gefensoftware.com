'use client'

import { useRef, useState } from 'react'
import { useAtom } from 'jotai'
import { toast } from 'react-toastify'
import { Camera, Trash2 } from 'lucide-react'
import { userAtom } from '@/store/user'
import {
  enviarFotoDePerfil,
  removerFotoDePerfil,
  FotoInvalida,
  TIPOS_ACEITOS,
  type ErroDeFoto,
} from '@/lib/avatar-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ProfileSubPage from '@/components/profile/ProfileSubPage'
import UserAvatar from '@/components/profile/UserAvatar'

const MENSAGENS: Record<ErroDeFoto, string> = {
  tipo: 'Escolha uma imagem JPG, PNG ou WebP.',
  tamanho: 'Essa imagem é grande demais. Escolha uma de até 25 MB.',
  leitura: 'Não foi possível ler essa imagem. Tente outra.',
  envio: 'Falha ao enviar a foto. Verifique sua conexão e tente de novo.',
}

const ProfilePhoto = () => {
  const [user, setUser] = useAtom(userAtom)
  const [enviando, setEnviando] = useState(false)
  const [removendo, setRemovendo] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const ocupado = enviando || removendo

  const aoEscolher = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Limpa o input antes de qualquer await: sem isso, escolher o MESMO
    // arquivo de novo (depois de um erro, por exemplo) não dispara `change`,
    // porque o valor não mudou — e o botão parecia morto.
    e.target.value = ''
    if (!file) return

    setEnviando(true)
    try {
      setUser(await enviarFotoDePerfil(file))
      toast.success('Foto atualizada!')
    } catch (erro) {
      toast.error(
        erro instanceof FotoInvalida ? MENSAGENS[erro.motivo] : 'Não foi possível atualizar a foto.',
      )
    } finally {
      setEnviando(false)
    }
  }

  const aoRemover = async () => {
    setRemovendo(true)
    try {
      await removerFotoDePerfil()
      // A API responde 204, sem corpo: o estado local é atualizado aqui, com
      // a mesma alteração que o servidor acabou de fazer. `user` não pode ser
      // nulo neste ponto (o botão só existe com foto, e foto só existe com
      // sessão), mas a guarda evita uma suposição sobre ordem de eventos.
      if (user) setUser({ ...user, avatar: '' })
      toast.success('Foto removida.')
    } catch {
      toast.error('Não foi possível remover a foto.')
    } finally {
      setRemovendo(false)
    }
  }

  return (
    <ProfileSubPage titulo="Foto de Perfil" descricao="Escolha uma foto ou remova a atual">
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center gap-6 pt-8">
          <UserAvatar user={user} />

          <p className="max-w-sm text-center text-sm text-gray-600">
            A imagem é recortada no centro e reduzida antes do envio, então uma
            foto tirada pelo celular serve sem preparo.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept={TIPOS_ACEITOS.join(',')}
            onChange={aoEscolher}
            className="hidden"
          />

          <div className="flex w-full flex-col gap-3 sm:max-w-xs">
            <Button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={ocupado}
              className="w-full gap-2 rounded-xl bg-primary py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:bg-primary/80 hover:shadow-xl"
            >
              <Camera className="h-4 w-4" />
              {enviando ? 'Enviando...' : user?.avatar ? 'Trocar foto' : 'Escolher foto'}
            </Button>

            {/* Só aparece com foto: remover o que não existe não é uma ação
                que valha um botão. */}
            {user?.avatar && (
              <Button
                type="button"
                variant="outline"
                onClick={aoRemover}
                disabled={ocupado}
                className="w-full gap-2 rounded-xl border-2 border-red-200 py-3 font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                {removendo ? 'Removendo...' : 'Remover foto'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </ProfileSubPage>
  )
}

export default ProfilePhoto
