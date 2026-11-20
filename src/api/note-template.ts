import { api } from '@/api';
import type { NoteSheet } from '@/types/note-sheet';

// O layout da nota da ordem de serviço, pelo endereço da vitrine (o slug da
// loja). Esta rota é pública e devolve SÓ a folha — nenhum dado de ordem, de
// cliente ou de valor passa por ela —, como a leitura do acompanhamento.
//
// O slug vem da ORDEM, não da vitrine aberta: a mesma lista mostra ordens de
// oficinas diferentes, e a nota tem de sair com a marca da loja que a emitiu.

export async function lerLayoutDaNota(slug: string): Promise<NoteSheet> {
  const { data } = await api.get<NoteSheet>(`/enterprises/by-slug/${slug}/note-template`);
  return data;
}
