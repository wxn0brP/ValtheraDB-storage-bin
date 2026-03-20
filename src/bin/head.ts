import { BinManager, CollectionMeta } from ".";
import { getFileCrc } from "../crc32";
import { _log } from "../log";
import { findFreeSlot } from "./data";
import { HEADER_SIZE, VERSION } from "./static";
import { detectCollisions, pushToFreeList, roundUpCapacity, writeData } from "./utils";

export interface Block {
    offset: number;
    capacity: number;
};

export interface FileMeta {
    collections: CollectionMeta[];
    freeList: Block[];
    fileSize: number;
    payloadLength: number;
    payloadOffset: number;
    blockSize: number;
}

export async function openFile(cmp: BinManager) {
    const { fd, options } = cmp;
    const stats = await fd.stat();
    const fileSize = stats.size;
    await _log(2, "File size:", fileSize);

    const meta: FileMeta = {
        collections: [],
        freeList: [],
        fileSize,
        payloadLength: 0,
        payloadOffset: 0,
        blockSize: options.preferredSize ?? 256,
    }
    cmp.meta = meta;

    if (fileSize < HEADER_SIZE) {
        await _log(2, "Initializing new file header");
        await saveHeaderAndPayload(cmp);
        await _log(6, "Header initialized with size:", HEADER_SIZE);
        return meta;
    }

    const headerBuf = Buffer.alloc(HEADER_SIZE);
    await fd.read(headerBuf, 0, HEADER_SIZE, 0);
    await _log(6, "Header read from file");

    const version = headerBuf.readUInt32LE(0);
    if (version !== VERSION) {
        await _log(6, "err", `Unsupported file version: ${version}`);
        throw new Error(`Unsupported file version ${version}`);
    }
    await _log(2, "File version:", version);

    const payloadLength = headerBuf.readUInt32LE(4);
    meta.payloadLength = payloadLength;
    await _log(6, "Payload length:", payloadLength);

    const payloadOffset = headerBuf.readUInt32LE(8);
    meta.payloadOffset = payloadOffset;
    await _log(6, "Payload offset:", payloadOffset);

    const blockSize = headerBuf.readUInt32LE(12);
    meta.blockSize = blockSize;
    await _log(2, "Block size:", blockSize);

    if (options.crc) {
        const { computedCrc, storedCrc } = await getFileCrc(fd);
        const validCrc = computedCrc === storedCrc || storedCrc === 0;
        await _log(2, "CRC:", computedCrc, "Needed CRC:", storedCrc, "Valid:", validCrc);
        if (storedCrc === 0) {
            await _log(1, "Warning: CRC is zero, CRC will not be checked");
        }
        if (!validCrc) {
            await _log(0, "err", "Invalid CRC");
            if (options.crc === 2 || options.crc === 4)
                throw new Error("Invalid CRC");
        }
    }

    if (payloadOffset + payloadLength > fileSize - HEADER_SIZE) {
        await _log(6, "err", "Invalid payload length");
        throw new Error("Invalid payload length");
    }

    if (payloadLength === 0) {
        await _log(6, "Empty payload, initializing collections and freeList");
        return meta;
    }

    await readHeaderPayload(cmp);
    return meta;
}

export async function readHeaderPayload(cmp: BinManager) {
    const { fd, meta } = cmp;
    const { payloadLength, payloadOffset } = meta;

    const payloadBuf = Buffer.alloc(payloadLength);
    const { bytesRead } = await fd.read(payloadBuf, 0, payloadLength, HEADER_SIZE + payloadOffset);
    await _log(6, `Payload header read, bytesRead: ${bytesRead}`);

    if (bytesRead < payloadLength) {
        await _log(6, "err", `Incomplete payload header read: expected ${payloadLength} bytes, got ${bytesRead}`);
        throw new Error(`Incomplete payload header read: expected ${payloadLength} bytes, got ${bytesRead}`);
    }

    const obj = await cmp.options.format.decode(payloadBuf, "") as {
        c: [string, number, number][];
        f: [number, number][];
    };

    meta.collections = (obj.c || []).map(([name, offset, capacity]) => ({ name, offset, capacity }));
    meta.freeList = (obj.f || []).map(([offset, capacity]) => ({ offset, capacity }));

    await _log(6, "Collections and freeList loaded", meta);
}

export function getHeaderPayload(meta: FileMeta) {
    return {
        c: meta.collections.map(({ name, offset, capacity }) => ([name, offset, capacity])),
        f: meta.freeList.map(({ offset, capacity }) => [offset, capacity]),
    };
}

export async function saveHeaderAndPayload(cmp: BinManager, recursion = false) {
    const { fd, meta, options } = cmp;
    if (!fd) throw new Error("File not open");

    const { collections, freeList, fileSize } = meta;
    await _log(6, "Saving header payload:", collections, freeList);

    const payloadObj = getHeaderPayload(meta);

    const payloadBuf = Buffer.from(await cmp.options.format.encode(payloadObj, ""));
    if (payloadBuf.length > 64 * 1024) {
        console.error("Header payload too large");
        throw new Error("Header payload too large");
    }

    await _log(6, "Header payload length:", payloadBuf.length);

    const headerBuf = Buffer.alloc(HEADER_SIZE);
    headerBuf.writeUInt32LE(VERSION, 0);
    headerBuf.writeUInt32LE(payloadBuf.length, 4);
    headerBuf.writeUInt32LE(meta.payloadOffset, 8);
    headerBuf.writeUInt32LE(meta.blockSize, 12);
    meta.payloadLength = payloadBuf.length;

    if (options.crc) {
        const { computedCrc: crc } = await getFileCrc(fd);
        headerBuf.writeUInt32LE(crc, 16);
    }

    await _log(6, "Writing header:", headerBuf.toString("hex"));

    // Write header
    await fd.write(headerBuf, 0, HEADER_SIZE, 0);
    // Write payload
    const roundPayload = roundUpCapacity(meta, payloadBuf.length);

    if (detectCollisions(meta, HEADER_SIZE + meta.payloadOffset, roundPayload)) {
        await _log(2, "Collision detected");
        const slot = !recursion && await findFreeSlot(cmp, roundPayload);
        if (slot) {
            meta.payloadOffset = slot.offset - HEADER_SIZE;
        } else {
            meta.payloadOffset = meta.fileSize - HEADER_SIZE;
            meta.fileSize += roundPayload;
        }
        pushToFreeList(meta, meta.payloadOffset, roundPayload);

        return await saveHeaderAndPayload(cmp, true);
    }

    await writeData(fd, HEADER_SIZE + meta.payloadOffset, payloadBuf, roundPayload);

    await _log(6, "Payload written");

    // Update file size if header + payload bigger
    meta.fileSize = Math.max(fileSize, HEADER_SIZE + roundPayload);
}
