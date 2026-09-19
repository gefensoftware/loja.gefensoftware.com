import type { ReactNode } from 'react';

/**
 * Uma seção numerada do documento. O `id` vira a âncora da URL
 * (`/termos-de-uso#conta`) e o alvo do link no sumário — por isso é escrito à
 * mão e não derivado do título: mudar a redação de um título não pode quebrar
 * um link que alguém guardou ou que outro documento cita.
 */
export type SecaoLegal = {
  id: string;
  titulo: string;
  corpo: ReactNode;
};

export type DocumentoLegal = {
  titulo: string;
  /** Uma frase sobre o que o documento cobre, antes do sumário. */
  resumo: string;
  vigencia: string;
  atualizadoEm: string;
  secoes: SecaoLegal[];
};
