// O layout da nota da ordem de serviço: a folha que a loja desenha.
//
// Espelho de internal/core/domain/note_template.go (API Go) e do DTO de
// internal/adapters/in/http/note_template_handler.go. A divisão é a mesma de
// modelos-os.ts: o Go guarda o ESQUEMA e valida, o front desenha. As CHAVES
// (as de NoteFieldKey e os tipos de bloco) são o contrato entre os três.
//
// O portal tem o arquivo irmão deste (portal/src/@types/note-sheet.d.ts),
// porque vitrine e portal não compartilham pacote. Mudou um, mude o outro.

export type NotePaper = 'a4' | 'roll80';

export type NoteBlockKind =
  | 'header'
  | 'fields'
  | 'intake'
  | 'text'
  | 'items'
  | 'totals'
  | 'signatures'
  | 'image'
  | 'divider'
  | 'spacer';

export type NoteAlign = 'left' | 'center' | 'right';

/** O corpo da letra do bloco, RELATIVO ao da folha. */
export type NoteScale = 'small' | 'normal' | 'large';

export type NoteBorder = 'none' | 'top' | 'box';

export type NoteImageRef = 'logo' | 'banner';

export type NoteItemColumn = 'kind' | 'description' | 'quantity' | 'unit' | 'total';

/** Um campo impresso: a CHAVE do dado e, se a loja preferiu, o rótulo. Vazio
 *  mantém o rótulo padrão, que vem do front (ver ROTULOS em nota-folha.ts). */
export interface NoteField {
  key: string;
  label?: string;
}

/** Um bloco da folha. Props de tipos diferentes convivem na mesma struct:
 *  o JSON fica plano, e o que não é do tipo chega zerado da API. */
export interface NoteBlock {
  id: string;
  kind: NoteBlockKind;
  align: NoteAlign;
  scale: NoteScale;
  bold: boolean;
  border: NoteBorder;
  /** Espaço antes do bloco, em milímetros. */
  gapTop: number;

  title?: string;
  body?: string;
  fields?: NoteField[];
  columns?: number;
  itemColumns?: NoteItemColumn[];
  image?: NoteImageRef;
  /** Altura do espaçador, em milímetros. */
  height?: number;
}

/** A folha inteira: papel, corpo da letra, margem e os blocos na ordem em que
 *  saem na impressora. É o que a API devolve em
 *  GET /enterprises/by-slug/:slug/note-template. */
export interface NoteSheet {
  paper: NotePaper;
  /** Corpo base, em pontos. */
  fontSize: number;
  /** Margem do papel, em milímetros. Ignorada na bobina. */
  margin: number;
  blocks: NoteBlock[];
}
