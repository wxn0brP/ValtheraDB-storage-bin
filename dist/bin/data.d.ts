import { BinManager, CollectionMeta } from "./index.js";
import { FileMeta } from "./head.js";
export declare function findCollection(cmp: BinManager, name: string): CollectionMeta | undefined;
export declare function findFreeSlot(cmp: BinManager, size: number): Promise<FileMeta["freeList"][number] | undefined>;
export declare function writeLogic(cmp: BinManager, collection: string, data: object[]): Promise<void>;
export declare function readLogic(cmp: BinManager, collection: string): Promise<any>;
