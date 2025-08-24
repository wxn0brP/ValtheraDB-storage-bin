import * as msgpack from "@msgpack/msgpack";
import { access, constants, open } from "fs/promises";
import { getFileCrc } from "../crc32.js";
import { _log } from "../log.js";
import { readLogic, writeLogic } from "./data.js";
import { openFile } from "./head.js";
import { optimize } from "./optimize.js";
import { removeCollection } from "./rm.js";
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
export class BinManager {
    path;
    fd = null;
    meta;
    options;
    /**
     * Constructs a new BinManager instance.
     * @param path - File path.
     * @param [preferredSize=512] - The preferred block size for the database. Must be a positive number (preferredSize > 0)
     * @throws If the path is not provided, or the preferred size is
     * not a positive number.
     */
    constructor(path, options) {
        this.path = path;
        if (!path)
            throw new Error("Path not provided");
        this.options = {
            preferredSize: 512,
            crc: 2,
            overwriteRemovedCollection: false,
            format: {
                encode: async (data) => msgpack.encode(data),
                decode: async (data) => msgpack.decode(data)
            },
            ...options
        };
        if (!this.options.preferredSize || this.options.preferredSize <= 0)
            throw new Error("Preferred size not provided");
    }
    async open() {
        this.fd = await safeOpen(this.path);
        await openFile(this);
    }
    async close() {
        if (this.fd) {
            const buff = Buffer.alloc(8);
            if (this.options.crc) {
                const { computedCrc: crc } = await getFileCrc(this.fd);
                buff.writeUInt32LE(crc, 0);
            }
            else {
                buff.fill(0, 0, 8);
            }
            await this.fd.write(buff, 0, 8, 16);
            await this.fd.close();
            this.fd = null;
        }
    }
    async write(collection, data) {
        if (!this.fd)
            throw new Error("File not open");
        await writeLogic(this, collection, data);
    }
    async read(collection) {
        if (!this.fd)
            throw new Error("File not open");
        return await readLogic(this, collection);
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
    }
}
