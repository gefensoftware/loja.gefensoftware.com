import { atomWithStorage } from "jotai/utils";

// O termo de busca é o único estado compartilhado da grade. O antigo
// `productsAtom` (lista de produtos persistida em localStorage) ficou sem
// nenhum consumidor quando a grade passou a buscar do servidor a cada
// carregamento — código morto, removido.
export const searchTermAtom = atomWithStorage<string>("searchTerm", '');
