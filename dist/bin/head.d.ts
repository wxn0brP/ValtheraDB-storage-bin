import { BinManager, CollectionMeta } from "./index.js";
export interface Block {
    offset: number;
    capacity: number;
}
export interface FileMeta {
    collections: CollectionMeta[];
    freeList: Block[];
    fileSize: number;
    payloadLength: number;
    payloadOffset: number;
    blockSize: number;
}
export declare function openFile(cmp: BinManager): Promise<FileMeta>;
export declare function readHeaderPayload(cmp: BinManager): Promise<void>;
export declare function getHeaderPayload(meta: FileMeta): {
    c: (string | number)[][];
    f: number[][];
};
export declare function saveHeaderAndPayload(cmp: BinManager, recursion?: boolean): Promise<void>;
