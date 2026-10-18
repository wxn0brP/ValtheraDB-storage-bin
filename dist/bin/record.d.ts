export type RecordFlags = number;
export declare const RECORD_FLAG: {
    readonly DELETED: number;
    readonly CRC: number;
    readonly COMPRESSED: number;
};
export interface DecodedRecord {
    data: Buffer;
    flags: number;
    totalSize: number;
}
export declare function encodeRecord(data: Buffer, opts?: {
    crc?: boolean;
    compressed?: boolean;
}): Buffer;
export declare function decodeRecord(buf: Uint8Array, offset: number): DecodedRecord | null;
export declare function recordSize(data: Buffer, opts?: {
    crc?: boolean;
}): number;
export declare function varintSizeForLen(value: number): 1 | 2 | 3 | 4 | 5;
export declare function writeLenVarint(buf: Uint8Array, offset: number, value: number): 1 | 2 | 3 | 4 | 5;
export declare function readLenVarint(buf: Uint8Array, offset: number): {
    value: number;
    size: number;
};
