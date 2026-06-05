import { DataInternal } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { BinManager } from "./index.js";
export declare function remove(cmp: BinManager, config: VQueryT.Remove, one: boolean): Promise<DataInternal[]>;
