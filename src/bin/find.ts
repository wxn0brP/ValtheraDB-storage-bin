import { DataInternal } from "@wxn0brp/db-core/types/data";
import { BinManager } from ".";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { _log } from "../log";
import { findCollection } from "./data";
import { INT_SIZE } from "./static";
import { readCollectionEof, readData } from "./utils";
import { findObj } from "@wxn0brp/db-core/utils/process";

export async function findOne(cmp: BinManager, config: VQueryT.FindOne): Promise<DataInternal | null> {
    await _log(2, "Find one in collection:", config.collection);

    const collection = findCollection(cmp, config.collection);

    let cursor = collection.offset + INT_SIZE;
    const collectionEOF = (await readData(cmp.fd, collection.offset, INT_SIZE)).readUInt32LE(0);
    if (collectionEOF === 0) return null;

    const endOffset = collection.offset + INT_SIZE + collectionEOF;
    while (cursor < endOffset) {
        const dataLength = (await readData(cmp.fd, cursor, INT_SIZE)).readUInt32LE(0);
        cursor += INT_SIZE;

        const data = await readData(cmp.fd, cursor, dataLength);
        cursor += dataLength;

        // if removed
        if (new Uint8Array(data).every(byte => byte === 0)) continue;

        const obj = await cmp.options.format.decode(data, config.collection);

        const res = findObj(config, obj);
        if (res) return res;
    }

    return null;
}

export async function find(cmp: BinManager, config: VQueryT.Find): Promise<DataInternal[]> {
    await _log(2, "Find in collection:", config.collection);

    const collection = findCollection(cmp, config.collection);

    let cursor = collection.offset + INT_SIZE;
    const collectionEOF = await readCollectionEof(cmp.fd, collection.offset);
    if (collectionEOF === 0) return [];

    const res: DataInternal[] = [];
    const endOffset = collection.offset + INT_SIZE + collectionEOF;
    while (cursor < endOffset) {
        const dataLength = (await readData(cmp.fd, cursor, INT_SIZE)).readUInt32LE(0);
        cursor += INT_SIZE;

        const data = await readData(cmp.fd, cursor, dataLength);
        cursor += dataLength;

        // if removed
        if (new Uint8Array(data).every(byte => byte === 0)) continue;

        const obj = await cmp.options.format.decode(data, config.collection);

        const match = findObj(config, obj);
        if (match) res.push(match);
    }

    return res;
}
