import { unlink } from "fs/promises";
import { saveHeaderAndPayload } from "./head.js";
import { HEADER_SIZE } from "./static.js";
import { readData, roundUpCapacity, writeData } from "./utils.js";
import { _log } from "../log.js";
export async function optimize(cmp) {
    await _log(3, "Starting database optimization");
    const collections = cmp.meta.collections;
    const allData = new Map();
    for (const { name, offset } of collections) {
        await _log(6, "Reading collection for optimization:", name);
        const len = await readData(cmp.fd, offset, 4);
        const data = await readData(cmp.fd, offset + 4, len.readInt32LE(0));
        allData.set(name, data);
    }
    await _log(5, "Closing file for optimization");
    await cmp.close();
    await _log(6, "Deleting old database file for optimization");
    await unlink(cmp.path);
    await new Promise(resolve => setTimeout(resolve, 100));
    await _log(5, "Re-opening database file for optimization");
    await cmp.open();
    let offset = roundUpCapacity(cmp.meta, cmp.meta.payloadLength + HEADER_SIZE) + cmp.meta.blockSize;
    for (const [collection, data] of allData) {
        await _log(6, "Writing optimized collection:", collection);
        const len = roundUpCapacity(cmp.meta, data.length + 4);
        const buf = Buffer.alloc(4);
        buf.writeInt32LE(data.length, 0);
        await writeData(cmp.fd, offset, buf, 4);
        await writeData(cmp.fd, offset + 4, data, len);
        cmp.meta.collections.push({
            name: collection,
            offset,
            capacity: len
        });
        offset += len;
    }
    await saveHeaderAndPayload(cmp);
    await _log(3, "Database optimization complete");
}
