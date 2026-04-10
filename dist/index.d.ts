import { ValtheraClass } from "@wxn0brp/db-core";
import { BinFileAction } from "./actions.js";
import { BinManager, Options } from "./bin/index.js";
export * from "./actions.js";
export * from "./bin/index.js";
export declare function createBinValthera(path: string, opts?: Partial<Options>, init?: boolean): Promise<{
    db: ValtheraClass;
    actions: BinFileAction;
    mgr: BinManager;
}>;
export declare const DYNAMIC: {
    bin(path: string, opts?: Partial<Options>): Promise<BinFileAction>;
};
