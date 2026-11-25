import { DataInternal } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { BinManager } from "./index.js";
export declare function find(cmp: BinManager, config: VQueryT.Find): Promise<DataInternal[]>;
export declare function findOne(cmp: BinManager, config: VQueryT.FindOne): Promise<DataInternal | null>;
