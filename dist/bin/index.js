import { access, constants, open } from "fs/promises";
import { _log } from "../log.js";
import { version } from "../version.js";
import { defaultFormat } from "./format.js";
import { flushMeta, loadMeta } from "./meta.js";
import { allocSlot, addFreeSlot, roundUp } from "./space.js";
import { COLLECTION_FLAG } from "./static.js";
import { deserialize as indexDeserialize, newIndex as newCollectionIndex, serialize, } from "./idindex.js";
import { readAt, writeData } from "./utils.js";
import { decodeRecord, RECORD_FLAG } from "./record.js";
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
    recordCaches = new Map();
    indexCache = new Map();
    dirtyIndexes = new Set();
    dirtyCollections = new Set();
    collectionsDirty = true;
    _inited = false;
    smartExecutor = true;
    version = "bin-storage-" + version;
    constructor(path, options) {
        this.path = path;
        if (!path)
            throw new Error("Path not provided");
        this.options = {
            preferredSize: 512,
            growthFactor: 2,
            overwriteRemovedCollection: false,
            defaultIndexed: false,
            recordCrc: false,
            recordCacheEnabled: true,
            recordCacheSize: 1024,
            format: defaultFormat(),
            ...options,
        };
        if (!this.options.preferredSize || this.options.preferredSize <= 0)
            throw new Error("Preferred size not provided correctly");
        if (this.options.growthFactor < 1.1)
            throw new Error("Growth factor must be >= 1.1");
    }
    async init() {
        if (this.fd)
            return;
        this.fd = await safeOpen(this.path);
        const stats = await this.fd.stat();
        this.meta = await loadMeta(this);
        if (stats.size === 0) {
            await flushMeta(this);
            this.meta.header.fileSize = (await this.fd.stat()).size;
        }
    }
    async close() {
        if (this.fd) {
            await this.flushIndexes();
            await this.fd.close();
            this.fd = null;
        }
    }
    [Symbol.asyncDispose]() {
        return this.close();
    }
    async flushIndexes() {
        if (!this.fd)
            return;
        for (const name of this.dirtyIndexes) {
            const collection = this.meta.collectionByName.get(name);
            const index = this.indexCache.get(name);
            if (!collection || !index)
                continue;
            const totalEntries = index.base.length + index.delta.length;
            if (totalEntries === 0)
                continue;
            const buf = await this._serializeIndex(index);
            await this._writeIndex(name, collection, buf);
        }
        this.dirtyIndexes.clear();
    }
    async _serializeIndex(index) {
        return serialize(index);
    }
    async _writeIndex(name, collection, buf) {
        const newLen = buf.length;
        const oldOffset = collection.header.indexOffset;
        const oldLen = collection.header.indexLen;
        const aligned = Math.ceil(newLen / this.meta.header.blockSize) *
            this.meta.header.blockSize;
        const slot = this.allocSpace(aligned);
        await this.writeAt(slot.offset, buf);
        if (aligned > newLen) {
            await this.writeAt(slot.offset + newLen, Buffer.alloc(aligned - newLen, 0));
        }
        collection.header.indexOffset = slot.offset - collection.headerOffset;
        collection.header.indexLen = newLen;
        if (oldOffset > 0 && oldLen > 0) {
            this.freeSpace(collection.headerOffset + oldOffset, Math.max(oldLen, aligned));
        }
        this.invalidateRecordCache(name);
    }
    getRecordCache(name) {
        if (!this.options.recordCacheEnabled)
            return null;
        let cache = this.recordCaches.get(name);
        if (!cache) {
            cache = new Map();
            this.recordCaches.set(name, cache);
        }
        const max = this.options.recordCacheSize;
        if (cache.size > max) {
            const drop = cache.size - max;
            const it = cache.keys();
            for (let i = 0; i < drop; i++) {
                const k = it.next().value;
                if (k === undefined)
                    break;
                cache.delete(k);
            }
        }
        return cache;
    }
    invalidateRecordCache(name) {
        if (name === "*") {
            this.recordCaches.clear();
        }
        else {
            this.recordCaches.delete(name);
        }
    }
    async getOrLoadIndex(name) {
        const cached = this.indexCache.get(name);
        if (cached)
            return cached;
        const collection = this.meta.collectionByName.get(name);
        if (!collection)
            return null;
        if (collection.header.indexOffset === 0 ||
            collection.header.indexLen === 0) {
            const fresh = newCollectionIndex();
            this.indexCache.set(name, fresh);
            return fresh;
        }
        const idxBuf = Buffer.alloc(collection.header.indexLen);
        await this.fd.read(idxBuf, 0, idxBuf.length, collection.headerOffset + collection.header.indexOffset);
        const idx = indexDeserialize(idxBuf);
        this.indexCache.set(name, idx);
        return idx;
    }
    markIndexDirty(name) {
        this.dirtyIndexes.add(name);
    }
    invalidateIndexCache(name) {
        this.indexCache.delete(name);
        this.dirtyIndexes.delete(name);
    }
    markCollectionDirty(name) {
        this.dirtyCollections.add(name);
    }
    allocSpace(size) {
        const aligned = roundUp(size, this.meta.header.blockSize);
        if (aligned < size)
            throw new Error("overflow in allocation size");
        return allocSlot(this.meta.space, aligned);
    }
    freeSpace(offset, size) {
        addFreeSlot(this.meta.space, {
            offset,
            size: roundUp(size, this.meta.header.blockSize),
        });
    }
    async writeAt(offset, data) {
        if (!this.fd)
            throw new Error("File not open");
        await this.fd.write(data, 0, data.length, offset);
    }
    async writeData(offset, data, capacity) {
        await writeData(this.fd, offset, data, capacity);
    }
    async readRecordPayload(collectionName, recordOffset) {
        const collection = this.meta.collectionByName.get(collectionName);
        if (!collection)
            return null;
        const cache = this.getRecordCache(collectionName);
        if (cache && cache.has(recordOffset)) {
            return cache.get(recordOffset);
        }
        if (recordOffset < collection.headerOffset ||
            recordOffset >= collection.headerOffset + collection.header.used)
            return null;
        const headerBuf = await readAt(this.fd, recordOffset, 6);
        if (headerBuf.length === 0)
            return null;
        const headerProbe = decodeRecord(headerBuf, 0);
        if (!headerProbe)
            return null;
        if (headerProbe.flags & RECORD_FLAG.DELETED)
            return null;
        const payload = await readAt(this.fd, recordOffset, headerProbe.totalSize);
        const rec = decodeRecord(payload, 0);
        if (!rec)
            return null;
        if (rec.flags & RECORD_FLAG.DELETED)
            return null;
        if (cache)
            cache.set(recordOffset, rec.data);
        return rec.data;
    }
    getCollectionFlags(name) {
        const c = this.meta.collectionByName.get(name);
        return c ? c.header.flags : 0;
    }
    setCollectionIndexed(name, indexed) {
        const c = this.meta.collectionByName.get(name);
        if (!c)
            return;
        if (indexed)
            c.header.flags |= COLLECTION_FLAG.INDEXED;
        else
            c.header.flags &= ~COLLECTION_FLAG.INDEXED;
    }
}
