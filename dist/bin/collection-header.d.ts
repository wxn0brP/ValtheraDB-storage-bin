export interface CollectionHeader {
    recordCount: number;
    deadCount: number;
    capacity: number;
    used: number;
    freeOffset: number;
    indexOffset: number;
    indexLen: number;
    flags: number;
    lastCompactionTs: number;
}
export declare function encodeCollectionHeader(h: CollectionHeader): Buffer;
export declare function decodeCollectionHeader(buf: Buffer): CollectionHeader;
export declare function newCollectionHeader(capacity: number, flags?: number): CollectionHeader;
export declare function hasIndex(h: CollectionHeader): boolean;
