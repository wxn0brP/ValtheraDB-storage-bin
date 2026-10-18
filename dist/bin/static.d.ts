export declare const MAGIC = 1447313986;
export declare const HEADER_SIZE = 128;
export declare const COLLECTION_HEADER_SIZE = 64;
export declare const INDEX_ENTRY_SIZE = 64;
export declare const VERSION = 4;
export declare const FILE_FLAG: {
    readonly CRC: number;
    readonly COMPRESSED: number;
};
export declare const COLLECTION_FLAG: {
    readonly INDEXED: number;
    readonly CRC: number;
    readonly COMPRESSED: number;
};
export declare const FREE_BUCKET: {
    readonly SMALL_MAX: 256;
    readonly MEDIUM_MAX: 4096;
    readonly SMALL: 0;
    readonly MEDIUM: 1;
    readonly LARGE: 2;
    readonly COUNT: 3;
};
export declare const VARINT: {
    readonly MAX_1: 128;
    readonly MAX_2: 16384;
    readonly MAX_3: 2097152;
    readonly MAX_4: 268435456;
    readonly MAX_LEN: 5;
};
export declare const COMPACTION_DEAD_RATIO = 0.25;
