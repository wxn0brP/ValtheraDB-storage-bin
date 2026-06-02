import { rename, rm } from "fs/promises";
import { BinManager } from ".";
import { ensureCollection } from "./collection";
import { saveHeaderAndPayload } from "./head";
import { INT_SIZE } from "./static";
import { readCollectionEof, readData, writeData } from "./utils";
import { _log } from "../log";

function isRemovedRecord(data: Buffer) {
    return new Uint8Array(data).every(byte => byte === 0);
}

async function appendRawRecord(target: BinManager, collectionName: string, recordLengthBuffer: Buffer, data: Buffer) {
    const collection = await ensureCollection(target, collectionName, data.length, true);
    const collectionEOF = await readCollectionEof(target.fd, collection.offset);
    const offset = collection.offset + collectionEOF + INT_SIZE;

    await writeData(target.fd, offset, recordLengthBuffer, INT_SIZE);
    await writeData(target.fd, offset + INT_SIZE, data, data.length);

    const newEOF = collectionEOF + INT_SIZE + data.length;
    const collectionLengthBuffer = Buffer.alloc(INT_SIZE);
    collectionLengthBuffer.writeUInt32LE(newEOF, 0);
    await writeData(target.fd, collection.offset, collectionLengthBuffer, INT_SIZE);
}

async function copyLiveRecords(source: BinManager, target: BinManager, collectionName: string, sourceOffset: number, collectionEOF: number) {
    let readCursor = sourceOffset + INT_SIZE;
    const endOffset = readCursor + collectionEOF;

    while (readCursor < endOffset) {
        const recordLengthBuffer = await readData(source.fd, readCursor, INT_SIZE);
        const recordLength = recordLengthBuffer.readUInt32LE(0);
        readCursor += INT_SIZE;

        const data = await readData(source.fd, readCursor, recordLength);
        readCursor += recordLength;

        if (isRemovedRecord(data)) continue;

        await appendRawRecord(target, collectionName, recordLengthBuffer, data);
    }
}

export async function optimize(cmp: BinManager) {
    await _log(3, "Starting database optimization");
    const collections = [...cmp.meta.collections];

    const tmpPath = `${cmp.path}.tmp`;
    await _log(6, "Removing stale optimization temp file:", tmpPath);
    await rm(tmpPath, { force: true });

    const tmpMgr = new BinManager(tmpPath, cmp.options);
    let tmpOpened = false;
    let originalClosed = false;

    try {
        await tmpMgr.init();
        tmpOpened = true;

        const lengthBuffer = Buffer.alloc(INT_SIZE);
        for (const { name, offset } of collections) {
            await _log(6, "Optimizing collection:", name);
            const collectionEOF = await readCollectionEof(cmp.fd, offset);

            const collectionMeta = await ensureCollection(tmpMgr, name, 0, false);
            lengthBuffer.writeUInt32LE(0, 0);
            await writeData(tmpMgr.fd, collectionMeta.offset, lengthBuffer, INT_SIZE);
            await copyLiveRecords(cmp, tmpMgr, name, offset, collectionEOF);
        }

        await saveHeaderAndPayload(tmpMgr);
        await tmpMgr.close();
        tmpOpened = false;

        await _log(5, "Closing original file for optimization");
        await cmp.close();
        originalClosed = true;

        await _log(5, "Replacing original database with optimized temp file");
        await rename(tmpPath, cmp.path);
        await cmp.init();
        originalClosed = false;
    } catch (err) {
        if (tmpOpened) await tmpMgr.close();
        await rm(tmpPath, { force: true });
        if (originalClosed) await cmp.init();
        throw err;
    }

    await _log(3, "Database optimization complete");
}
