import { getFileCrc } from "../crc32.js";
import { _log } from "../log.js";
import { saveHeaderAndPayload } from "./head.js";
import { detectCollisions, pushToFreeList, readData, roundUpCapacity, writeData } from "./utils.js";
export function findCollection(cmp, name) {
    return cmp.meta.collections.find(c => c.name === name);
}
export async function findFreeSlot(cmp, size) {
    const { meta } = cmp;
    await _log(6, "Finding free slot for size:", size);
    const idx = meta.freeList.findIndex(f => f.capacity >= size);
    if (idx === -1) {
        await _log(6, "No suitable free slot found.");
        return undefined;
    }
    const slot = meta.freeList[idx];
    await _log(6, "Free slot found at index:", idx, "with capacity:", slot.capacity);
    meta.freeList.splice(idx, 1);
    await _log(6, "Slot removed from freeList:", slot);
    return slot;
}
export async function writeLogic(cmp, collection, data) {
    const { fd, meta } = cmp;
    await _log(3, "Writing data to collection:", collection);
    const existingCollection = findCollection(cmp, collection);
    const encoded = Buffer.from(await cmp.options.format.encode(data, collection));
    const length = encoded.length;
    const capacity = roundUpCapacity(meta, length + 4);
    let offset = existingCollection?.offset;
    let existingOffset = existingCollection?.offset;
    let existingCapacity = existingCollection?.capacity;
    const collision = detectCollisions(meta, offset, capacity, [collection]);
    if (collision || !existingCollection) {
        if (collision)
            await _log(2, "Collision detected");
        const slot = await findFreeSlot(cmp, capacity);
        if (slot) {
            offset = slot.offset;
            await _log(4, "Found free slot at offset:", offset);
        }
        else {
            offset = meta.fileSize;
            meta.fileSize += capacity;
            await _log(4, "No free slot found, appending at offset:", offset);
        }
        if (!existingCollection) {
            meta.collections.push({ name: collection, offset, capacity });
        }
        else if (collision) {
            pushToFreeList(meta, existingOffset, existingCapacity);
            meta.collections = meta.collections.map(c => {
                if (c.offset === existingOffset)
                    return { name: c.name, offset, capacity };
                return c;
            });
        }
        await _log(3, "Collection written");
        await saveHeaderAndPayload(cmp);
    }
    const buf = Buffer.alloc(4);
    buf.writeUInt32LE(length, 0);
    await writeData(fd, offset, buf, 4);
    await writeData(fd, offset + 4, encoded, capacity);
    if (existingCollection && length >= existingCollection.capacity) {
        meta.collections = meta.collections.map(c => {
            if (c.offset === offset)
                return { name: c.name, offset, capacity };
            return c;
        });
        await saveHeaderAndPayload(cmp);
        await _log(2, "Capacity exceeded");
    }
    else {
        const crc = cmp.options.crc;
        if (crc === 3 || crc === 4) {
            const { computedCrc } = await getFileCrc(fd);
            const crcBuf = Buffer.alloc(16);
            crcBuf.writeUInt32LE(computedCrc);
            await writeData(fd, 16, crcBuf, 16);
        }
    }
}
export async function readLogic(cmp, collection) {
    const collectionMeta = findCollection(cmp, collection);
    if (!collectionMeta)
        throw new Error("Collection not found");
    const len = await readData(cmp.fd, collectionMeta.offset, 4);
    const data = await readData(cmp.fd, collectionMeta.offset + 4, len.readUInt32LE(0));
    return await cmp.options.format.decode(data, collection);
}
