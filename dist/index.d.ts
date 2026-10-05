import { ValtheraClass } from "@wxn0brp/db-core";
import { BinAdapter } from "./adapter.js";
import { Options } from "./bin/index.js";
export * from "./bin/index.js";
export * from "./adapter.js";
export * from "./version.js";
export declare function createBinValthera(path: string, opts?: Partial<Options>, init?: boolean): Promise<{
    db: ValtheraClass;
    adapter: BinAdapter;
    manager: import("./bin/index.js").BinManager;
}>;
export declare const DYNAMIC: {
    bin(path: string, opts?: Partial<Options>): Promise<BinAdapter>;
};
