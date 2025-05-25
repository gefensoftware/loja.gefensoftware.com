import { atom } from 'jotai';
import { Enterprise } from '../../types/enterprise';

// Atoms for enterprises
export const enterprisesAtom = atom<Enterprise[]>([]);
export const currentEnterpriseAtom = atom<Enterprise | null>(null);
export const loadingEnterpriseAtom = atom<boolean>(false);
export const errorEnterpriseAtom = atom<string | null>(null);

