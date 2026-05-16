import { ValtheraClass } from "@wxn0brp/db-core";
import { BinManager, Options } from "./bin";

export * from "./bin";

export async function createBinValthera(path: string, opts: Partial<Options> = {}, init = true) {
    const mgr = new BinManager(path, opts);
    const db = new ValtheraClass({ dbAction: mgr });

    if (init) await mgr.init();

    return {
        db,
        mgr,
    }
}

export const DYNAMIC = {
    async bin(path: string, opts: Partial<Options> = {}) {
        const mgr = new BinManager(path, opts);
        await mgr.init();
        return mgr;
    }
}

