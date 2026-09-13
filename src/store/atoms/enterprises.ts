import { atom } from 'jotai';
// Contrato novo (enterprise_dto.go): GET /enterprises/by-slug/{slug}. O tipo
// legado em '@/types/enterprise' (id_enterprise, name_fantasy, business_days
// snake_case) era da API anterior e não corresponde a nenhuma rota atual.
import type { Enterprise } from '@/types/catalog';

/**
 * A empresa da loja aberta agora. Escrita e lida por `useEmpresa`
 * (`@/store/enterprise`), que é o único caminho para buscá-la.
 *
 * Em memória, não em `localStorage`, e essa é a diferença que importa: ele é
 * o cache de UM carregamento de página, não um registro que sobrevive a
 * recarregamentos. Persistido, ele nunca mais seria buscado — e `hours`, que
 * decide se a loja está aberta, `phones`, para onde o pedido vai, e `theme`
 * ficariam congelados na primeira visita do cliente, para sempre.
 */
export const enterprisesAtom = atom<Enterprise | null>(null);
