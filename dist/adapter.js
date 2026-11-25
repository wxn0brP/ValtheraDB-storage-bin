import { AdapterBase } from "@wxn0brp/db-core/base/adapter";
import { AdapterCloseError, AdapterError, AdapterInitError, isValtheraError, } from "@wxn0brp/db-core/errors";
import { addId } from "@wxn0brp/db-core/helpers/addId";
import { findUtil } from "@wxn0brp/db-core/utils/findUtil";
import { add } from "./bin/add.js";
import { ensureCollection, removeCollection } from "./bin/collection.js";
import { find, findOne } from "./bin/find.js";
import { BinManager } from "./bin/index.js";
import { optimize } from "./bin/optimize.js";
import { remove } from "./bin/remove.js";
import { COLLECTION_HEADER_SIZE } from "./bin/static.js";
import { update } from "./bin/update.js";
import { version } from "./version.js";
export class BinAdapter extends AdapterBase {
    manager;
    _inited = false;
    version = version;
    capabilities = {
        transactions: false,
        indexes: false,
        persistent: true,
    };
    constructor(path, options) {
        super();
        this.manager = new BinManager(path, options);
    }
    async init() {
        try {
            return await this.manager.init();
        }
        catch (err) {
            if (isValtheraError(err))
                throw err;
            throw new AdapterInitError(err, {
                version: this.version,
            });
        }
    }
    async close() {
        try {
            return await this.manager.close();
        }
        catch (err) {
            if (isValtheraError(err))
                throw err;
            throw new AdapterCloseError(err, {
                version: this.version,
            });
        }
    }
    [Symbol.asyncDispose]() {
        return this.manager.close();
    }
    async getCollections() {
        return this.manager.meta.collections.map(c => c.name);
    }
    async issetCollection(collection) {
        return this.manager.meta.collectionByName.has(collection);
    }
    async ensureCollection(collection) {
        if (!this.manager.fd)
            throw new AdapterError("File not open", {
                op: "ensureCollection",
            });
        if (this.manager.meta.collectionByName.has(collection))
            return false;
        await ensureCollection(this.manager, collection, COLLECTION_HEADER_SIZE);
        return true;
    }
    async optimize() {
        if (!this.manager.fd)
            throw new AdapterError("File not open", {
                op: "optimize",
            });
        await optimize(this.manager);
    }
    async removeCollection(collection) {
        if (!this.manager.fd)
            throw new AdapterError("File not open", {
                op: "removeCollection",
            });
        if (!this.manager.meta.collectionByName.has(collection))
            return false;
        await removeCollection(this.manager, collection);
        return true;
    }
    async add(config) {
        await this.ensureCollection(config.collection);
        await addId(config, this, true);
        await add(this.manager, config);
        return config.data;
    }
    async find(config) {
        await this.ensureCollection(config.collection);
        const data = await find(this.manager, config);
        return findUtil(config, data, [
            "",
        ]);
    }
    async findOne(config) {
        await this.ensureCollection(config.collection);
        return await findOne(this.manager, config);
    }
    async update(config) {
        await this.ensureCollection(config.collection);
        return await update(this.manager, config, false);
    }
    async updateOne(config) {
        await this.ensureCollection(config.collection);
        const data = await update(this.manager, config, true);
        return data[0] ?? null;
    }
    async remove(config) {
        await this.ensureCollection(config.collection);
        return await remove(this.manager, config, false);
    }
    async removeOne(config) {
        await this.ensureCollection(config.collection);
        const data = await remove(this.manager, config, true);
        return data[0] ?? null;
    }
}
