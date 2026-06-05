import { matchObj } from "@wxn0brp/db-core/utils/process";
import { _log } from "../log.js";
import { findCollection } from "./data.js";
import { INT_SIZE } from "./static.js";
import { readCollectionEof, readData, writeData } from "./utils.js";
export async function remove(cmp, config, one) {
    await _log(2, "Removing from collection:", config.collection);
    const collection = findCollection(cmp, config.collection);
    let cursor = collection.offset + INT_SIZE;
    const collectionEOF = await readCollectionEof(cmp.fd, collection.offset);
    if (collectionEOF === 0)
        return [];
    const removed = [];
    const endOffset = collection.offset + INT_SIZE + collectionEOF;
    while (cursor < endOffset) {
        const dataLength = (await readData(cmp.fd, cursor, INT_SIZE)).readUInt32LE(0);
        cursor += INT_SIZE;
        const dataOffset = cursor;
        const data = await readData(cmp.fd, cursor, dataLength);
        cursor += dataLength;
        // if removed
        if (new Uint8Array(data).every(byte => byte === 0))
            continue;
        const obj = await cmp.options.format.decode(data, config.collection);
        if (!matchObj(config, obj))
            continue;
        await writeData(cmp.fd, dataOffset, Buffer.alloc(dataLength).fill(0), dataLength);
        removed.push(obj);
        if (one)
            break;
    }
    return removed;
}
