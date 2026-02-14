import { _log } from "../log.js";
export function roundUpCapacity(result, size) {
    return Math.ceil(size / result.blockSize) * result.blockSize;
}
export async function writeData(fd, offset, data, capacity) {
    if (!fd)
        throw new Error("File not open");
    if (data.length > capacity)
        throw new Error("Data size exceeds capacity");
    await _log(6, "Writing data at offset:", offset, "length:", data.length, "capacity:", capacity);
    const { bytesWritten } = await fd.write(data, 0, data.length, offset);
    await _log(5, "Bytes written:", bytesWritten);
    if (data.length < capacity) {
        const pad = Buffer.alloc(capacity - data.length, 0);
        const padStart = offset + data.length;
        await _log(6, "Padding with zeros:", pad.length, "at offset:", padStart);
        const { bytesWritten: padBytesWritten } = await fd.write(pad, 0, pad.length, padStart);
        await _log(6, "Bytes written:", padBytesWritten);
    }
    await _log(6, "Data written");
}
export async function readData(fd, offset, length) {
    if (!fd)
        throw new Error("File not open");
    await _log(6, "Reading data from offset:", offset, "length:", length);
    const buf = Buffer.alloc(length);
    const { bytesRead } = await fd.read(buf, 0, length, offset);
    await _log(5, "Bytes read:", bytesRead);
    return buf;
}
export function optimizeFreeList(blocks) {
    if (blocks.length <= 1)
        return blocks;
    const sorted = [...blocks].sort((a, b) => a.offset - b.offset);
    const merged = [];
    let current = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
        const next = sorted[i];
        if (current.offset + current.capacity === next.offset) {
            current = {
                offset: current.offset,
                capacity: current.capacity + next.capacity
            };
        }
        else {
            merged.push(current);
            current = next;
        }
    }
    merged.push(current);
    return merged;
}
function checkCollection(start1, end1, start2, end2) {
    _log(6, "Checking collection:", start1, end1, start2, end2);
    return start1 < end2 && start2 < end1;
}
export function detectCollisions(result, start, size, skip = []) {
    for (const { name, offset, capacity } of result.collections) {
        if (skip.includes(name))
            continue;
        if (checkCollection(offset, offset + capacity, start, start + size))
            return true;
    }
    return false;
}
export function pushToFreeList(result, offset, len) {
    result.freeList.push({
        offset,
        capacity: roundUpCapacity(result, len),
    });
    result.freeList = optimizeFreeList(result.freeList);
}
