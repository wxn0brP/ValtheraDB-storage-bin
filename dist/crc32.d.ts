import { FileHandle } from "fs/promises";
export declare function crc32(buf: Uint8Array | string, seed?: number): number;
export declare function getFileCrc(fd: FileHandle, short?: boolean): Promise<{
    storedCrc: number;
    computedCrc: number;
}>;
