import { ValtheraClass } from "@wxn0brp/db-core";
import { BinManager } from "./bin/index.js";
export * from "./bin/index.js";
export async function createBinValthera(path, opts = {}, init = true) {
    const mgr = new BinManager(path, opts);
    const db = new ValtheraClass({ dbAction: mgr });
    if (init)
        await mgr.init();
    return {
        db,
        mgr,
    };
}
export const DYNAMIC = {
    async bin(path, opts = {}) {
        const mgr = new BinManager(path, opts);
        await mgr.init();
        return mgr;
    }
};
