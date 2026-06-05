import { DataInternal } from "@wxn0brp/db-core/types/data";
import { BinManager } from "./index.js";
import { VQueryT } from "@wxn0brp/db-core/types/query";
export declare function findOne(cmp: BinManager, config: VQueryT.FindOne): Promise<DataInternal | null>;
export declare function find(cmp: BinManager, config: VQueryT.Find): Promise<DataInternal[]>;
