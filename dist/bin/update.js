import { matchObj, updateObj } from "@wxn0brp/db-core/utils/process";
import { _log } from "../log.js";
import { findCollection } from "./data.js";
import { saveHeaderAndPayload } from "./head.js";
import { INT_SIZE } from "./static.js";
import { readCollectionEof, readData, roundUpCapacity, writeData } from "./utils.js";
export async function update(cmp, config, one) {
    await _log(2, "Updating in collection:", config.collection);
    if (typeof config.updater === "object" && Object.keys(config.updater).length === 0)
        return [];
    const collection = findCollection(cmp, config.collection);
    const collectionEOF = await readCollectionEof(cmp.fd, collection.offset);
    if (collectionEOF === 0)
        return [];
    const updated = [];
    let cursor = collection.offset + INT_SIZE;
    const fileEnd = cmp.meta.fileSize;
    let fileEndCursor = fileEnd + INT_SIZE;
    let newLen = 0;
    let isUpdated = false;
    async function writeRecord(data, length, lengthBuff) {
        await writeData(cmp.fd, fileEndCursor, lengthBuff, INT_SIZE);
        fileEndCursor += INT_SIZE;
        await writeData(cmp.fd, fileEndCursor, data, length);
        fileEndCursor += length;
        newLen += INT_SIZE + length;
    }
    const endOffset = collection.offset + INT_SIZE + collectionEOF;
    const lengthBuff = Buffer.alloc(INT_SIZE);
    while (cursor < endOffset) {
        const dataLengthBuffer = await readData(cmp.fd, cursor, INT_SIZE);
        const dataLength = dataLengthBuffer.readUInt32LE(0);
        cursor += INT_SIZE;
        const data = await readData(cmp.fd, cursor, dataLength);
        cursor += dataLength;
        // if removed
        if (new Uint8Array(data).every(byte => byte === 0))
            continue;
        if (one && isUpdated) {
            await writeRecord(data, dataLength, dataLengthBuffer);
            continue;
        }
        const obj = await cmp.options.format.decode(data, config.collection);
        const match = matchObj(config, obj);
        if (!match) {
            await writeRecord(data, dataLength, dataLengthBuffer);
            continue;
        }
        const updatedObj = updateObj(config, obj);
        const encoded = Buffer.from(await cmp.options.format.encode(updatedObj, config.collection));
        const encodedLen = encoded.length;
        lengthBuff.writeUInt32LE(encodedLen, 0);
        await writeRecord(encoded, encodedLen, lengthBuff);
        isUpdated = true;
        updated.push(updatedObj);
    }
    if (newLen <= collectionEOF) {
        const chunkSize = 2048;
        const tmpBuffer = Buffer.alloc(chunkSize);
        const loopCount = Math.floor((newLen + INT_SIZE) / chunkSize);
        for (let i = 0; i < loopCount; i++) {
            const readDataOffset = cmp.meta.fileSize + i * chunkSize;
            const writeDataOffset = collection.offset + i * chunkSize;
            await cmp.fd.read(tmpBuffer, 0, chunkSize, readDataOffset);
            await cmp.fd.write(tmpBuffer, 0, chunkSize, writeDataOffset);
        }
        const lastChunkSize = (newLen + INT_SIZE) % chunkSize;
        if (lastChunkSize) {
            const readDataOffset = cmp.meta.fileSize + loopCount * chunkSize;
            const writeDataOffset = collection.offset + loopCount * chunkSize;
            await cmp.fd.read(tmpBuffer, 0, lastChunkSize, readDataOffset);
            await cmp.fd.write(tmpBuffer, 0, lastChunkSize, writeDataOffset);
        }
    }
    else {
        cmp.meta.freeList.push({ capacity: collection.capacity, offset: collection.offset });
        collection.offset = cmp.meta.fileSize;
        collection.capacity = roundUpCapacity(cmp.meta, newLen);
        cmp.meta.fileSize += collection.capacity;
        await saveHeaderAndPayload(cmp);
        lengthBuff.writeUInt32LE(newLen, 0);
        await writeData(cmp.fd, collection.offset, lengthBuff, INT_SIZE);
    }
    return updated;
}
