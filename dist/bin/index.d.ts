import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { DataInternal } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { FileHandle } from "fs/promises";
import { FileMeta } from "./head.js";
export interface CollectionMeta {
    name: string;
    offset: number;
    capacity: number;
}
export interface Options {
    preferredSize: number;
    overwriteRemovedCollection: boolean;
    format: {
        encode(data: any, collection: string): Promise<Parameters<typeof Buffer.from>[0]>;
        decode(data: Buffer, collection: string): Promise<any>;
    };
}
export declare class BinManager extends ActionsBase {
    path: string;
    fd: null | FileHandle;
    meta: FileMeta;
    options: Options;
    _inited: boolean;
    /**
     * Constructs a new BinManager instance.
     * @param path - File path.
     * @param [preferredSize=512] - The preferred block size for the database. Must be a positive number (preferredSize > 0)
     * @throws If the path is not provided, or the preferred size is
     * not a positive number.
     */
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
