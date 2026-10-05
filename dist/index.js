import { ValtheraClass } from "@wxn0brp/db-core";
import { BinAdapter } from "./adapter.js";
export * from "./bin/index.js";
export * from "./adapter.js";
export * from "./version.js";
export async function createBinValthera(path, opts = {}, init = true) {
    const adapter = new BinAdapter(path, opts);
    const db = new ValtheraClass({
        adapter,
        executorAware: true,
    });
    if (init)
        await db.init();
    return {
        db,
        adapter,
        manager: adapter.manager,
    };
}
export const DYNAMIC = {
    async bin(path, opts = {}) {
        const adapter = new BinAdapter(path, opts);
        await adapter.init();
        return adapter;
    },
};
