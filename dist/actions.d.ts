import { CustomActionsBase } from "@wxn0brp/db-core/base/custom";
import { DbOpts } from "@wxn0brp/db-core/types/options";
import { VQuery } from "@wxn0brp/db-core/types/query";
import { BinManager } from "./bin/index.js";
export declare class BinFileAction extends CustomActionsBase {
    private mgr;
    folder: string;
    options: DbOpts;
    /**
     * Creates a new instance of dbActionC.
     * @constructor
     * @param folder - The folder where database files are stored.
     * @param options - The options object.
     */
    constructor(mgr: BinManager);
    init(): Promise<void>;
    /**
     * Get a list of available databases in the specified folder.
     */
    getCollections(): Promise<string[]>;
    /**
     * Check and create the specified collection if it doesn't exist.
     */
    ensureCollection({ collection }: VQuery): Promise<boolean>;
    /**
     * Check if a collection exists.
     */
    issetCollection({ collection }: VQuery): Promise<boolean>;
    /**
     * Removes a database collection from the file system.
     */
    removeCollection({ collection }: VQuery): Promise<boolean>;
}
