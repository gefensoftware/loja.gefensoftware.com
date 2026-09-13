'use client'

import { useCallback, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { api } from '@/api';
import { enterprisesAtom } from '@/store/atoms/enterprises';
import type { Enterprise } from '@/types/catalog';

// ---------------------------------------------------------------------------
// A empresa por slug, num lugar só.
//
// Eram cinco buscas independentes da mesma rota pública — o layout da loja, a
// grade de produtos, o detalhe do produto, a página do carrinho e, por outro
// caminho, `generateMetadata` no servidor. Três delas disparavam no MESMO
// carregamento (o layout e a tela que ele embrulha), cada uma reimplementando
// o mesmo quarteto de estado: dados, carregando, erro e "tentar novamente".
//
// O átomo com a empresa já existia e já era escrito por um desses
// consumidores; o que faltava era todo mundo passar por ele. Este gancho lê o
// átomo e só vai à rede quando ele não tem a loja pedida.
//
// A busca do servidor (`serverApi` em `app/[name_store]/layout.tsx`,
// `generateMetadata`) é outro caminho e continua como está: roda antes de
// existir navegador, não tem átomo para ler e não pode usar um hook.
// ---------------------------------------------------------------------------

/** 404 é slug inexistente; qualquer outra falha é erro de leitura. */
function ehNaoEncontrado(erro: unknown): boolean {
  const axiosLike = erro as { response?: { status?: number } };
  return axiosLike?.response?.status === 404;
}

/**
 * Buscas em voo, por slug.
 *
 * Fora do jotai de propósito: o layout da loja e a tela que ele embrulha
 * montam no mesmo instante, os dois com o átomo ainda vazio, e sem este
 * registro os dois disparariam a requisição antes de qualquer estado reativo
 * ter mudado. É a mesma razão pela qual `sincronizacoes` existe em
 * `@/store/cart`.
 */
const emVoo = new Map<string, Promise<Enterprise>>();

function buscarEmpresa(slug: string): Promise<Enterprise> {
  const jaEmVoo = emVoo.get(slug);
  if (jaEmVoo) return jaEmVoo;

  // GET /enterprises/by-slug/{slug} (enterprise_handler.go): rota pública.
  const promessa = api
    .get<Enterprise>(`/enterprises/by-slug/${slug}`)
    .then((r) => r.data);
  emVoo.set(slug, promessa);
  // A falha também tira a entrada do registro, senão "tentar novamente"
  // receberia para sempre a mesma promessa já rejeitada.
  promessa
    .catch(() => undefined)
    .finally(() => {
      if (emVoo.get(slug) === promessa) emVoo.delete(slug);
    });
  return promessa;
}

export interface EstadoDaEmpresa {
  empresa: Enterprise | null;
  carregando: boolean;
  /** O slug não corresponde a nenhuma loja (404). Distinto de `erro`: slug
   *  errado tem de parecer slug errado, não servidor fora do ar. */
  naoEncontrada: boolean;
  /** Falha de leitura. A loja pode continuar no ar. */
  erro: boolean;
  recarregar: () => void;
}

export function useEmpresa(slug: string | null | undefined): EstadoDaEmpresa {
  const [guardada, guardar] = useAtom(enterprisesAtom);
  // O átomo guarda uma empresa só. Ele serve a esta tela quando é a desta
  // loja — sem a conferência de slug, ir da loja A para a B mostraria os
  // dados de A enquanto B não chegasse.
  const empresa = slug && guardada?.slug === slug ? guardada : null;

  const [carregando, setCarregando] = useState(!empresa);
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!slug) return;
    if (empresa) {
      setCarregando(false);
      setNaoEncontrada(false);
      setErro(false);
      return;
    }

    let vivo = true;
    setCarregando(true);
    setNaoEncontrada(false);
    setErro(false);
    buscarEmpresa(slug)
      .then((data) => {
        if (vivo) guardar(data);
      })
      .catch((e) => {
        if (!vivo) return;
        console.error('Erro ao buscar empresa:', e);
        if (ehNaoEncontrado(e)) setNaoEncontrada(true);
        else setErro(true);
      })
      .finally(() => {
        if (vivo) setCarregando(false);
      });

    return () => {
      vivo = false;
    };
  }, [slug, empresa, guardar, tentativa]);

  return {
    empresa,
    carregando,
    naoEncontrada,
    erro,
    recarregar: useCallback(() => setTentativa((n) => n + 1), []),
  };
}
