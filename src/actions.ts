import { CustomFileCpu } from "@wxn0brp/db-core";
import { CustomActionsBase } from "@wxn0brp/db-core/base/custom";
import { DbOpts } from "@wxn0brp/db-core/types/options";
import { BinManager } from "./bin";

export class BinFileAction extends CustomActionsBase {
    folder: string;
    options: DbOpts;

    /**
     * Creates a new instance of dbActionC.
     * @constructor
     * @param folder - The folder where database files are stored.
     * @param options - The options object.
     */
    constructor(private mgr: BinManager) {
        super();
        this.fileCpu = new CustomFileCpu(this.mgr.read.bind(this.mgr), this.mgr.write.bind(this.mgr));
    }

    async init() {
        await this.mgr.open();
    }

    /**
     * Get a list of available databases in the specified folder.
     */
    async getCollections() {
        const collections = this.mgr.meta.collections.map(c => c.name);
        return collections;
    }

    /**
     * Check and create the specified collection if it doesn't exist.
     */
    async ensureCollection(collection: string) {
        if (await this.issetCollection(collection)) return false;
        await this.mgr.write(collection, []);
        return true;
    }

    /**
     * Check if a collection exists.
     */
    async issetCollection(collection: string) {
        const collections = await this.getCollections();
        return collections.includes(collection);
    }

    /**
     * Removes a database collection from the file system.
     */
    async removeCollection(collection: string) {
        await this.mgr.removeCollection(collection);
        return true;
    }
}
