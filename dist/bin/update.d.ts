import { DataInternal } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { BinManager } from "./index.js";
export declare function update(cmp: BinManager, config: VQueryT.Update, one: boolean): Promise<DataInternal[]>;
