import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { DataInternal } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { BinManager, Options } from "./bin/index.js";
export declare class BinAdapter extends ActionsBase {
    readonly manager: BinManager;
    _inited: boolean;
    constructor(path: string, options?: Partial<Options>);
    init(): Promise<void>;
    close(): Promise<void>;
    [Symbol.asyncDispose](): Promise<void>;
    getCollections(): Promise<string[]>;
    issetCollection(collection: string): Promise<boolean>;
    ensureCollection(collection: string): Promise<boolean>;
    optimize(): Promise<void>;
    removeCollection(collection: string): Promise<boolean>;
    add(config: VQueryT.Add): Promise<DataInternal>;
    find(config: VQueryT.Find): Promise<DataInternal[]>;
    findOne(config: VQueryT.FindOne): Promise<DataInternal | null>;
    update(config: VQueryT.Update): Promise<DataInternal[]>;
    updateOne(config: VQueryT.Update): Promise<DataInternal | null>;
    remove(config: VQueryT.Remove): Promise<DataInternal[]>;
    removeOne(config: VQueryT.Remove): Promise<DataInternal | null>;
}
