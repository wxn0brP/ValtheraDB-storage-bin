import { CustomFileCpu } from "@wxn0brp/db-core";
import dbActionBase from "@wxn0brp/db-core/base/actions";
import { addId } from "@wxn0brp/db-core/helpers/addId";
import Data from "@wxn0brp/db-core/types/data";
import FileCpu from "@wxn0brp/db-core/types/fileCpu";
import { DbOpts } from "@wxn0brp/db-core/types/options";
import { VQuery } from "@wxn0brp/db-core/types/query";
import { findUtil } from "@wxn0brp/db-core/utils/action";
import { BinManager } from "./bin";

export class BinFileAction extends dbActionBase {
    folder: string;
    options: DbOpts;
    fileCpu: FileCpu;

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
    async ensureCollection({ collection }: VQuery) {
        if (await this.issetCollection(arguments[0])) return;
        await this.mgr.write(collection, []);
        return true;
    }

    /**
     * Check if a collection exists.
     */
    async issetCollection({ collection }: VQuery) {
        const collections = await this.getCollections();
        return collections.includes(collection);
    }

    /**
     * Add a new entry to the specified database.
     */
    async add(query: VQuery) {
        await this.ensureCollection(arguments[0]);
        await addId(query, this);
        const { collection, data } = query;
        await this.fileCpu.add(collection, data);
        return data;
    }

    /**
     * Find entries in the specified database based on search criteria.
     */
    async find(query: VQuery) {
        await this.ensureCollection(query);
        return await findUtil(query, this.fileCpu, [query.collection]);
    }

    /**
     * Find the first matching entry in the specified database based on search criteria.
     */
    async findOne({ collection, search, context = {}, findOpts = {} }: VQuery) {
        await this.ensureCollection(arguments[0]);
        let data = await this.fileCpu.findOne(collection, search, context, findOpts) as Data;
        return data || null;
    }

    /**
     * Update entries in the specified database based on search criteria and an updater function or object.
     */
    async update({ collection, search, updater, context = {} }: VQuery) {
        await this.ensureCollection(arguments[0]);
        return await this.fileCpu.update(collection, false, search, updater, context);
    }

    /**
     * Update the first matching entry in the specified database based on search criteria and an updater function or object.
     */
    async updateOne({ collection, search, updater, context = {} }: VQuery) {
        await this.ensureCollection(arguments[0]);
        return await this.fileCpu.update(collection, true, search, updater, context);
    }

    /**
     * Remove entries from the specified database based on search criteria.
     */
    async remove({ collection, search, context = {} }: VQuery) {
        await this.ensureCollection(arguments[0]);
        return await this.fileCpu.remove(collection, false, search, context);
    }

    /**
     * Remove the first matching entry from the specified database based on search criteria.
     */
    async removeOne({ collection, search, context = {} }: VQuery) {
        await this.ensureCollection(arguments[0]);
        return await this.fileCpu.remove(collection, true, search, context);
    }

    /**
     * Removes a database collection from the file system.
     */
    async removeCollection({ collection }: VQuery) {
        await this.mgr.removeCollection(collection);
        return true;
    }
}