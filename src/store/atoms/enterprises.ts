import { atomWithStorage } from 'jotai/utils';
import { Enterprise } from '../../types/enterprise';

// Atoms for enterprises
export const enterprisesAtom = atomWithStorage<Enterprise | null>('enterprise', null);
export const currentEnterpriseAtom = atomWithStorage<Enterprise | null>('currentEnterprise', null);
export const loadingEnterpriseAtom = atomWithStorage<boolean>('loadingEnterprise', false);
export const errorEnterpriseAtom = atomWithStorage<string | null>('errorEnterprise', null);

