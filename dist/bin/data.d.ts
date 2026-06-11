import { BinManager, CollectionMeta } from "./index.js";
import { FileMeta } from "./head.js";
export declare function findCollection(cmp: BinManager, name: string): CollectionMeta | undefined;
export declare function getFreeSlot(cmp: BinManager, size: number): Promise<FileMeta["freeList"][number] | undefined>;
