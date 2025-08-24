import { FileHandle } from "fs/promises";
import { FileMeta } from "./head.js";
export interface CollectionMeta {
    name: string;
    offset: number;
    capacity: number;
}
export interface Options {
    preferredSize: number;
    /**
     * 0 - crc off
     * 1 - warn if error
     * 2 - throw if error
     */
    crc: number;
    overwriteRemovedCollection: boolean;
    format: {
        encode(data: any): Promise<Parameters<typeof Buffer.from>[0]>;
        decode(data: Buffer): Promise<any>;
    };
}
export declare class BinManager {
    path: string;
    fd: null | FileHandle;
    meta: FileMeta;
    options: Options;
    /**
     * Constructs a new BinManager instance.
     * @param path - File path.
     * @param [preferredSize=512] - The preferred block size for the database. Must be a positive number (preferredSize > 0)
     * @throws If the path is not provided, or the preferred size is
     * not a positive number.
     */
    constructor(path: string, options?: Partial<Options>);
    open(): Promise<void>;
    close(): Promise<void>;
    write(collection: string, data: object[]): Promise<void>;
    read(collection: string): Promise<any>;
    optimize(): Promise<void>;
    removeCollection(collection: string): Promise<void>;
}
