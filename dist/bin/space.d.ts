import { FileHeader } from "./header.js";
export interface FreeSlot {
    offset: number;
    size: number;
}
export interface SpaceManager {
    header: FileHeader;
    freeLists: FreeSlot[][];
}
export declare function newSpace(header: FileHeader): SpaceManager;
export declare function addFreeSlot(space: SpaceManager, slot: FreeSlot): void;
export declare function removeFreeSlot(space: SpaceManager, offset: number): FreeSlot | null;
export declare function hasFreeSlot(space: SpaceManager, size: number): boolean;
export declare function allocSlot(space: SpaceManager, size: number): FreeSlot;
export declare function allocAt(space: SpaceManager, offset: number, size: number): void;
export declare function growSlot(space: SpaceManager, offset: number, oldSize: number, newSize: number): boolean;
export declare function roundUp(size: number, blockSize: number): number;
export declare function sumFree(space: SpaceManager): number;
export declare function serializeFreeLists(space: SpaceManager): Buffer;
export declare function deserializeFreeLists(buf: Buffer): FreeSlot[][];
