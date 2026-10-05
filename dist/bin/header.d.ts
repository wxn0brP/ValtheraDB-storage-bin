export interface FileHeader {
    collectionsOffset: number;
    collectionsLen: number;
    freeSmallOffset: number;
    freeSmallLen: number;
    freeMediumOffset: number;
    freeMediumLen: number;
    freeLargeOffset: number;
    freeLargeLen: number;
    blockSize: number;
    growthFactor: number;
    fileSize: number;
    flags: number;
}
export declare function encodeHeader(meta: FileHeader): Buffer;
export declare function decodeHeader(buf: Buffer): FileHeader;
export declare function newHeader(blockSize: number, growthFactor: number): FileHeader;
export declare function bucketIndex(size: number): 0 | 1 | 2;
