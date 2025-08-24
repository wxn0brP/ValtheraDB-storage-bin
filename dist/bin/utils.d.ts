import { FileHandle } from "fs/promises";
import { Block, FileMeta } from "./head.js";
export declare function roundUpCapacity(result: FileMeta, size: number): number;
export declare function writeData(fd: FileHandle, offset: number, data: Buffer, capacity: number): Promise<void>;
export declare function readData(fd: FileHandle, offset: number, length: number): Promise<Buffer>;
export declare function optimizeFreeList(blocks: Block[]): Block[];
export declare function detectCollisions(result: FileMeta, start: number, size: number, skip?: string[]): boolean;
export declare function pushToFreeList(result: FileMeta, offset: number, len: number): void;
