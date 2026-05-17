import { _log } from "../log.js";
import { findCollection, getFreeSlot } from "./data.js";
import { saveHeaderAndPayload } from "./head.js";
import { INT_SIZE } from "./static.js";
import { readCollectionEof, readData, roundUpCapacity, writeData } from "./utils.js";
export async function ensureCollection(cmp, name, length, append) {
    let lengthToStore;
    const existingCollection = findCollection(cmp, name);
    const isLastCollection = existingCollection && cmp.meta.collections[cmp.meta.collections.length - 1].offset === existingCollection.offset;
    if (existingCollection) {
        if (append) {
            const collectionEOF = await readCollectionEof(cmp.fd, existingCollection.offset);
            lengthToStore = roundUpCapacity(cmp.meta, INT_SIZE + collectionEOF + INT_SIZE + length);
            await _log(6, "Append mode, calculated lengthToStore:", lengthToStore);
        }
        else {
            lengthToStore = roundUpCapacity(cmp.meta, length + INT_SIZE);
        }
        await _log(6, "Existing collection found:", existingCollection.name, "capacity:", existingCollection.capacity, "needed:", lengthToStore);
        if (existingCollection.capacity >= lengthToStore) {
            await _log(5, "Existing collection has enough capacity, reusing");
            return existingCollection;
        }
        await _log(5, "Existing collection too small, moving to free list and creating new");
        cmp.meta.collections = cmp.meta.collections.filter(c => c.name !== name);
    }
    else {
        lengthToStore = roundUpCapacity(cmp.meta, length + INT_SIZE);
        await _log(6, "No existing collection found, calculated lengthToStore:", lengthToStore);
    }
    let newCollection;
    // if exists and is last collection -> reuse offset
    if (existingCollection && isLastCollection) {
        newCollection = { name, offset: existingCollection.offset, capacity: lengthToStore };
        cmp.meta.fileSize += lengthToStore - existingCollection.capacity;
    }
    else {
        const slot = await getFreeSlot(cmp, lengthToStore);
        if (slot) {
            await _log(6, "Using free slot at offset:", slot.offset, "capacity:", slot.capacity);
            newCollection = { name, offset: slot.offset, capacity: slot.capacity };
        }
        else {
            await _log(6, "No free slot, appending at offset:", cmp.meta.fileSize);
            newCollection = { name, offset: cmp.meta.fileSize, capacity: lengthToStore };
            cmp.meta.fileSize += lengthToStore;
        }
    }
    cmp.meta.collections.push(newCollection);
    if (existingCollection) {
        if (!isLastCollection) {
            const chunkSize = 2048;
            const tmpBuffer = Buffer.alloc(chunkSize);
            const collectionLength = (await readData(cmp.fd, existingCollection.offset, INT_SIZE)).readUInt32LE(0);
            const loopCount = Math.floor((collectionLength + INT_SIZE) / chunkSize);
            await _log(3, "Copying", collectionLength, "bytes from old offset", existingCollection.offset, "to new offset", newCollection.offset);
            for (let i = 0; i < loopCount; i++) {
                const readDataOffset = existingCollection.offset + i * chunkSize;
                const writeDataOffset = newCollection.offset + i * chunkSize;
                await cmp.fd.read(tmpBuffer, 0, chunkSize, readDataOffset);
                await cmp.fd.write(tmpBuffer, 0, chunkSize, writeDataOffset);
            }
            const lastChunkSize = (collectionLength + INT_SIZE) % chunkSize;
            if (lastChunkSize) {
                const readDataOffset = existingCollection.offset + loopCount * chunkSize;
                const writeDataOffset = newCollection.offset + loopCount * chunkSize;
                await cmp.fd.read(tmpBuffer, 0, lastChunkSize, readDataOffset);
                await cmp.fd.write(tmpBuffer, 0, lastChunkSize, writeDataOffset);
            }
            cmp.meta.freeList.push(existingCollection);
        }
    }
    else {
        // Write 0 length for new collection
        const collectionLengthBuffer = Buffer.alloc(INT_SIZE);
        collectionLengthBuffer.writeUInt32LE(0, 0);
        await writeData(cmp.fd, newCollection.offset, collectionLengthBuffer, INT_SIZE);
    }
    await saveHeaderAndPayload(cmp);
    await _log(5, "Collection ensured:", newCollection);
    return newCollection;
}
