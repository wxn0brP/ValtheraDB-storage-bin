import * as msgpack from "@msgpack/msgpack";
import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { addId } from "@wxn0brp/db-core/helpers/addId";
import { findUtil } from "@wxn0brp/db-core/utils/action";
import { access, constants, open } from "fs/promises";
import { _log } from "../log.js";
import { add } from "./add.js";
import { ensureCollection } from "./collection.js";
import { find, findOne } from "./find.js";
import { openFile } from "./head.js";
import { optimize } from "./optimize.js";
import { removeCollection } from "./removeCollection.js";
import { remove } from "./remove.js";
import { update } from "./update.js";
async function safeOpen(path) {
    try {
        await access(path, constants.F_OK);
        return await open(path, "r+");
    }
    catch {
        _log(1, "Creating new file");
        return await open(path, "w+");
    }
}
export class BinManager extends ActionsBase {
    path;
    fd = null;
    meta;
    options;
    _inited = false;
    /**
     * Constructs a new BinManager instance.
     * @param path - File path.
     * @param [preferredSize=512] - The preferred block size for the database. Must be a positive number (preferredSize > 0)
     * @throws If the path is not provided, or the preferred size is
     * not a positive number.
     */
    constructor(path, options) {
        super();
        this.path = path;
        if (!path)
            throw new Error("Path not provided");
        this.options = {
            preferredSize: 512,
            overwriteRemovedCollection: false,
            format: {
                encode: async (data) => msgpack.encode(data),
                decode: async (data) => msgpack.decode(data)
            },
            ...options
        };
        if (!this.options.preferredSize || this.options.preferredSize <= 0)
            throw new Error("Preferred size not provided correctly");
    }
    async init() {
        this.fd = await safeOpen(this.path);
        await openFile(this);
    }
    async close() {
        if (this.fd) {
            await this.fd.close();
            this.fd = null;
        }
    }
    [Symbol.asyncDispose]() {
        return this.close();
    }
    async getCollections() {
        return this.meta.collections.map(c => c.name);
    }
    async issetCollection(collection) {
        return this.meta.collections.map(c => c.name).includes(collection);
    }
    async ensureCollection(collection) {
        if (!this.fd)
            throw new Error("File not open");
        if (this.meta.collections.find(c => c.name === collection))
            return false;
        await ensureCollection(this, collection, 0, false);
        return true;
    }
    async optimize() {
        if (!this.fd)
            throw new Error("File not open");
        await optimize(this);
    }
    async removeCollection(collection) {
        if (!this.fd)
            throw new Error("File not open");
        await removeCollection(this, collection);
        return true;
    }
    async add(config) {
        await this.ensureCollection(config.collection);
        await addId(config, this, false);
        await add(this, config);
        return config.data;
    }
    async find(config) {
        await this.ensureCollection(config.collection);
        const data = await find(this, config);
        return findUtil(config, data, [""]);
    }
    async findOne(config) {
        await this.ensureCollection(config.collection);
        return await findOne(this, config);
    }
    async update(config) {
        await this.ensureCollection(config.collection);
        return await update(this, config, false);
    }
    async updateOne(config) {
        await this.ensureCollection(config.collection);
        const data = await update(this, config, true);
        return data[0] ?? null;
    }
    async remove(config) {
        await this.ensureCollection(config.collection);
        return await remove(this, config, false);
    }
    async removeOne(config) {
        await this.ensureCollection(config.collection);
        const data = await remove(this, config, true);
        return data[0] ?? null;
    }
}
