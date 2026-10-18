import { CollectionHeader, newCollectionHeader } from "./collection-header.js";
import { FileHeader } from "./header.js";
import { SpaceManager, addFreeSlot } from "./space.js";
import type { BinManager } from "./index.js";
export interface CollectionRecord {
    name: string;
    headerOffset: number;
    header: CollectionHeader;
}
export interface FileMeta {
    header: FileHeader;
    collections: CollectionRecord[];
    collectionByName: Map<string, CollectionRecord>;
    space: SpaceManager;
}
export declare function newMeta(blockSize: number, growthFactor: number): FileMeta;
export declare function loadMeta(cmp: BinManager): Promise<FileMeta>;
export declare function findCollection(cmp: BinManager, name: string): CollectionRecord | null;
export declare function flushMeta(cmp: BinManager): Promise<void>;
export { newCollectionHeader, addFreeSlot };
