import { atomWithStorage } from "jotai/utils";
import { Category } from "../types";

export const categoriesAtom = atomWithStorage<Category[]>("categories", []);
