'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * O campo que leva o visitante à loja pelo endereço dela.
 *
 * Existe porque a plataforma não tem — nem pode ter — uma lista pública de
 * lojas: o catálogo é do estabelecimento, e é ele quem distribui o próprio
 * link. Quem chega aqui pelo domínio nu em geral tem o nome da loja em mão
 * (ouviu, anotou, recebeu num papel) e não o link clicável; sem este campo a
 * única saída seria digitar a URL na barra do navegador, acertando a barra
 * no lugar certo.
 *
 * Aceita o endereço inteiro colado, e não só o nome: quem copia de uma
 * conversa traz `https://loja.gefensoftware.com/padaria-x` junto, e exigir
 * que a pessoa recorte o pedaço certo é transformar um acerto em erro.
 */
export default function IrParaLoja() {
  const router = useRouter()
  const [valor, setValor] = useState('')

  /** O nome da loja dentro do que foi digitado.
   *
   *  Tira protocolo e domínio (endereço colado), as barras das pontas e
   *  qualquer `?query` ou `#âncora`, e desce para minúsculas — os slugs são
   *  minúsculos, e quem digita à mão costuma começar com maiúscula. Fica o
   *  primeiro segmento: de `.../padaria-x/cart` a loja é `padaria-x`. */
  const slug = valor
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^[^/]*\.[^/]*\//, '')
    .split(/[?#]/)[0]
    .replace(/^\/+|\/+$/g, '')
    .split('/')[0]
    .toLowerCase()

  return (
    <form
      className="mt-6 flex flex-col gap-3 sm:flex-row"
      onSubmit={(evento) => {
        evento.preventDefault()
        // Campo vazio não navega: `/` é esta mesma página, e recarregá-la
        // pareceria um botão quebrado.
        if (!slug) return
        router.push(`/${encodeURIComponent(slug)}`)
      }}
    >
      <label className="sr-only" htmlFor="endereco-da-loja">
        Endereço da loja
      </label>
      <Input
        id="endereco-da-loja"
        name="loja"
        value={valor}
        onChange={(evento) => setValor(evento.target.value)}
        placeholder="nome-da-loja"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="sm:flex-1"
      />
      <Button type="submit" disabled={!slug}>
        Abrir catálogo
      </Button>
    </form>
  )
}
