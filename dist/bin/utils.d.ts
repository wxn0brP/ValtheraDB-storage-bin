import { FileHandle } from "fs/promises";
export declare function writeData(fd: FileHandle, offset: number, data: Buffer, capacity: number): Promise<void>;
export declare function readData(fd: FileHandle, offset: number, length: number): Promise<Buffer>;
export declare function writeAt(fd: FileHandle, offset: number, data: Buffer): Promise<void>;
export declare function readAt(fd: FileHandle, offset: number, length: number): Promise<Buffer>;
export declare function readFd(fd: FileHandle, length: number, pos: number): Promise<Buffer>;
