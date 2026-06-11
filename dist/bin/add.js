import { _log } from "../log.js";
import { ensureCollection } from "./collection.js";
import { INT_SIZE } from "./static.js";
import { readCollectionEof, writeData } from "./utils.js";
export async function add(cmp, config) {
    const { data } = config;
    const { fd } = cmp;
    await _log(3, "Writing data to collection:", config.collection);
    const encoded = Buffer.from(await cmp.options.format.encode(data, config.collection));
    const length = encoded.length;
    await _log(5, "Encoded data length:", length);
    const collection = await ensureCollection(cmp, config.collection, length, true);
    const collectionEOF = await readCollectionEof(fd, collection.offset);
    await _log(5, "Read collection EOF:", collectionEOF);
    // skip: collection length metadata + collection length
    const offset = collection.offset + collectionEOF + INT_SIZE;
    await _log(5, "Calculated offset:", offset);
    const dataLengthBuffer = Buffer.alloc(INT_SIZE);
    dataLengthBuffer.writeUInt32LE(length, 0);
    await writeData(fd, offset, dataLengthBuffer, INT_SIZE);
    await writeData(fd, offset + INT_SIZE, encoded, length);
    const newEOF = collectionEOF + INT_SIZE + length;
    await _log(5, "New collection EOF:", newEOF);
    const collectionLengthBuffer = Buffer.alloc(INT_SIZE);
    collectionLengthBuffer.writeUInt32LE(newEOF, 0);
    await writeData(fd, collection.offset, collectionLengthBuffer, INT_SIZE);
}
