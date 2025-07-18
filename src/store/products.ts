import { atomWithStorage } from "jotai/utils";
import { Product } from "../types";

export const productsAtom = atomWithStorage<Product[]>("products", []);
export const searchTermAtom = atomWithStorage<string>("searchTerm", '');