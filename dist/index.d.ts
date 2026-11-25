import { ValtheraClass } from "@wxn0brp/db-core";
import type { Data } from "@wxn0brp/db-core/types/data";
import type { TypedValthera } from "@wxn0brp/db-core/types/typed";
import { BinAdapter } from "./adapter.js";
import { Options } from "./bin/index.js";
export * from "./bin/index.js";
export * from "./adapter.js";
export * from "./version.js";
export declare function createBinValthera<T extends Record<string, Data> = Record<string, never>>(path: string, opts?: Partial<Options>, init?: boolean): Promise<{
    db: TypedValthera<T, ValtheraClass>;
    adapter: BinAdapter;
    manager: import("./bin/index.js").BinManager;
}>;
export declare const DYNAMIC: {
    def(path: string, opts?: Partial<Options>): Promise<BinAdapter>;
};
