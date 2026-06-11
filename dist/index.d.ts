import { ValtheraClass } from "@wxn0brp/db-core";
import { BinManager, Options } from "./bin/index.js";
export * from "./bin/index.js";
export declare function createBinValthera(path: string, opts?: Partial<Options>, init?: boolean): Promise<{
    db: ValtheraClass;
    mgr: BinManager;
}>;
export declare const DYNAMIC: {
    bin(path: string, opts?: Partial<Options>): Promise<BinManager>;
};
