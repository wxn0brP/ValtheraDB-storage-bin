import { ValtheraClass } from "@wxn0brp/db-core";
import { BinFileAction } from "./actions.js";
import { BinManager } from "./bin/index.js";
export * from "./actions.js";
export * from "./bin/index.js";
export async function createBinValthera(path, opts = {}, init = true) {
    const mgr = new BinManager(path, opts);
    const actions = new BinFileAction(mgr);
    const db = new ValtheraClass({ dbAction: actions });
    if (init)
        await actions.init();
    return {
        db,
        actions,
        mgr,
    };
}
export const DYNAMIC = {
    async bin(path, opts = {}) {
        const mgr = new BinManager(path, opts);
        const actions = new BinFileAction(mgr);
        await actions.init();
        return actions;
    }
};
