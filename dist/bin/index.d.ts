import { FileHandle } from "fs/promises";
import { FormatCodec } from "./format.js";
import { FileMeta } from "./meta.js";
import { type CollectionIndex } from "./idindex.js";
export interface CollectionMeta {
    name: string;
    offset: number;
    capacity: number;
}
export interface Options {
    preferredSize: number;
    growthFactor: number;
    overwriteRemovedCollection: boolean;
    defaultIndexed: boolean;
    recordCrc: boolean;
    recordCacheEnabled: boolean;
    recordCacheSize: number;
    format: FormatCodec;
}
export declare class BinManager {
    path: string;
    fd: null | FileHandle;
    meta: FileMeta;
    options: Options;
    recordCaches: Map<string, Map<number, Buffer>>;
    indexCache: Map<string, CollectionIndex>;
    dirtyIndexes: Set<string>;
    dirtyCollections: Set<string>;
    collectionsDirty: boolean;
    _inited: boolean;
    smartExecutor: boolean;
    version: string;
    constructor(path: string, options?: Partial<Options>);
    init(): Promise<void>;
    close(): Promise<void>;
    [Symbol.asyncDispose](): Promise<void>;
    flushIndexes(): Promise<void>;
    private _serializeIndex;
    private _writeIndex;
    getRecordCache(name: string): Map<number, Buffer> | null;
    invalidateRecordCache(name: string): void;
    getOrLoadIndex(name: string): Promise<CollectionIndex | null>;
    markIndexDirty(name: string): void;
    invalidateIndexCache(name: string): void;
    markCollectionDirty(name: string): void;
    allocSpace(size: number): {
        offset: number;
        size: number;
    };
    freeSpace(offset: number, size: number): void;
    writeAt(offset: number, data: Buffer): Promise<void>;
    writeData(offset: number, data: Buffer, capacity: number): Promise<void>;
    readRecordPayload(collectionName: string, recordOffset: number): Promise<Buffer | null>;
    getCollectionFlags(name: string): number;
    setCollectionIndexed(name: string, indexed: boolean): void;
}
