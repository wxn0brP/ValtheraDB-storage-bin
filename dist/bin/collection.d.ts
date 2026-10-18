import { BinManager } from "./index.js";
export declare function ensureCollection(cmp: BinManager, name: string, minSize?: number): Promise<void>;
export declare function removeCollection(cmp: BinManager, name: string): Promise<void>;
