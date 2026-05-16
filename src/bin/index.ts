import * as msgpack from "@msgpack/msgpack";
import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { addId } from "@wxn0brp/db-core/helpers/addId";
import { DataInternal } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { findUtil } from "@wxn0brp/db-core/utils/action";
import { access, constants, FileHandle, open } from "fs/promises";
import { _log } from "../log";
import { add } from "./add";
import { ensureCollection } from "./collection";
import { find, findOne } from "./find";
import { FileMeta, openFile } from "./head";
import { optimize } from "./optimize";
import { removeCollection } from "./removeCollection";
import { remove } from "./remove";
import { update } from "./update";

async function safeOpen(path: string) {
    try {
        await access(path, constants.F_OK);
        return await open(path, "r+");
    } catch {
        _log(1, "Creating new file");
        return await open(path, "w+");
    }
}

export interface CollectionMeta {
    name: string;
    offset: number;
    capacity: number;
}

export interface Options {
    preferredSize: number;
    overwriteRemovedCollection: boolean;
    format: {
        encode(data: any, collection: string): Promise<Parameters<typeof Buffer.from>[0]>;
        decode(data: Buffer, collection: string): Promise<any>;
    }
}

export class BinManager extends ActionsBase {
    public fd: null | FileHandle = null;
    public meta: FileMeta;
    public options: Options;
    _inited = false;

    /**
     * Constructs a new BinManager instance.
     * @param path - File path.
     * @param [preferredSize=512] - The preferred block size for the database. Must be a positive number (preferredSize > 0)
     * @throws If the path is not provided, or the preferred size is
     * not a positive number.
     */
    constructor(public path: string, options?: Partial<Options>) {
        super();
        if (!path) throw new Error("Path not provided");

        this.options = {
            preferredSize: 512,
            overwriteRemovedCollection: false,
            format: {
                encode: async (data: any) => msgpack.encode(data),
                decode: async (data: Buffer) => msgpack.decode(data)
            },
            ...options
        }

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

    async issetCollection(collection: string) {
        return this.meta.collections.map(c => c.name).includes(collection);
    }

    async ensureCollection(collection: string) {
        if (!this.fd) throw new Error("File not open");
        if (this.meta.collections.find(c => c.name === collection)) return false;

        await ensureCollection(this, collection, 0, false);

        return true;
    }

    async optimize() {
        if (!this.fd) throw new Error("File not open");
        await optimize(this);
    }

    async removeCollection(collection: string) {
        if (!this.fd) throw new Error("File not open");
        await removeCollection(this, collection);
        return true;
    }

    async add(config: VQueryT.Add): Promise<DataInternal> {
        await this.ensureCollection(config.collection);
        await addId(config, this, false);
        await add(this, config);
        return config.data;
    }

    async find(config: VQueryT.Find): Promise<DataInternal[]> {
        await this.ensureCollection(config.collection);
        const data = await find(this, config);
        return findUtil(config, data, [""]);
    }

    async findOne(config: VQueryT.FindOne): Promise<DataInternal | null> {
        await this.ensureCollection(config.collection);
        return await findOne(this, config);
    }

    async update(config: VQueryT.Update): Promise<DataInternal[]> {
        await this.ensureCollection(config.collection);
        return await update(this, config, false);
    }

    async updateOne(config: VQueryT.Update): Promise<DataInternal | null> {
        await this.ensureCollection(config.collection);
        const data = await update(this, config, true);
        return data[0] ?? null;
    }

    async remove(config: VQueryT.Remove): Promise<DataInternal[]> {
        await this.ensureCollection(config.collection);
        return await remove(this, config, false);
    }

    async removeOne(config: VQueryT.Remove): Promise<DataInternal | null> {
        await this.ensureCollection(config.collection);
        const data = await remove(this, config, true);
        return data[0] ?? null;
    }
}
