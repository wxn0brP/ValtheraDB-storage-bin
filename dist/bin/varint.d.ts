export declare function varintSize(value: number): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export declare function writeVarint(value: number, buf: Uint8Array, offset: number): number;
export declare function readVarint(buf: Uint8Array, offset: number): {
    value: number;
    size: number;
};
export declare function varintByteSize(buf: Uint8Array, offset: number): number;
