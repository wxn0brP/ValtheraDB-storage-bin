import { bucketIndex } from "./header.js";
import { writeVarint, readVarint } from "./varint.js";
import { FREE_BUCKET } from "./static.js";
export function newSpace(header) {
    return {
        header,
        freeLists: [
            [],
            [],
            [],
        ],
    };
}
export function addFreeSlot(space, slot) {
    if (slot.size <= 0)
        return;
    const bucket = bucketIndex(slot.size);
    const list = space.freeLists[bucket];
    const idx = findInsertIndex(list, slot.offset);
    list.splice(idx, 0, slot);
    coalesce(space, bucket, idx);
}
export function removeFreeSlot(space, offset) {
    for (let b = 0; b < FREE_BUCKET.COUNT; b++) {
        const idx = space.freeLists[b].findIndex(s => s.offset === offset);
        if (idx !== -1) {
            return space.freeLists[b].splice(idx, 1)[0];
        }
    }
    return null;
}
export function hasFreeSlot(space, size) {
    const bucket = bucketIndex(size);
    for (let b = bucket; b < FREE_BUCKET.COUNT; b++) {
        if (space.freeLists[b].length > 0)
            return true;
    }
    return false;
}
export function allocSlot(space, size) {
    const bucket = bucketIndex(size);
    for (let b = bucket; b < FREE_BUCKET.COUNT; b++) {
        const list = space.freeLists[b];
        for (let i = 0; i < list.length; i++) {
            const slot = list[i];
            if (slot.size >= size) {
                list.splice(i, 1);
                if (slot.size - size >= 8) {
                    const remainder = {
                        offset: slot.offset + size,
                        size: slot.size - size,
                    };
                    addFreeSlot(space, remainder);
                }
                return {
                    offset: slot.offset,
                    size,
                };
            }
        }
    }
    const offset = space.header.fileSize;
    space.header.fileSize += size;
    return {
        offset,
        size,
    };
}
export function allocAt(space, offset, size) {
    removeFreeSlot(space, offset);
    if (size > 0) {
        const rest = space.header.fileSize - (offset + size);
        if (rest > 0) {
            space.header.fileSize = offset + size;
        }
    }
}
export function growSlot(space, offset, oldSize, newSize) {
    const bucket = bucketIndex(newSize);
    for (let b = bucket; b < FREE_BUCKET.COUNT; b++) {
        const list = space.freeLists[b];
        for (let i = 0; i < list.length; i++) {
            const slot = list[i];
            if (slot.offset === offset + oldSize && slot.size >= newSize - oldSize) {
                list.splice(i, 1);
                const rest = slot.size - (newSize - oldSize);
                if (rest >= 8) {
                    addFreeSlot(space, {
                        offset: offset + newSize,
                        size: rest,
                    });
                }
                return true;
            }
            if (slot.offset === offset + newSize && slot.size >= oldSize) {
                return true;
            }
        }
    }
    const tail = space.header.fileSize;
    if (offset + oldSize === tail) {
        space.header.fileSize = offset + newSize;
        return true;
    }
    return false;
}
export function roundUp(size, blockSize) {
    if (blockSize <= 0)
        return size;
    return Math.ceil(size / blockSize) * blockSize;
}
export function sumFree(space) {
    let total = 0;
    for (const list of space.freeLists) {
        for (const s of list)
            total += s.size;
    }
    return total;
}
export function serializeFreeLists(space) {
    const parts = [];
    for (let b = 0; b < FREE_BUCKET.COUNT; b++) {
        const list = space.freeLists[b];
        const count = list.length;
        const header = Buffer.alloc(4 + 1 + list.length * 10);
        header.writeUInt32LE(count, 0);
        let off = 4;
        for (const slot of list) {
            off = writeVarint(slot.offset, header, off);
            off = writeVarint(slot.size, header, off);
        }
        parts.push(header.subarray(0, off));
    }
    const totalSize = parts.reduce((s, p) => s + p.length, 0);
    const out = Buffer.alloc(totalSize);
    let off = 0;
    for (const p of parts) {
        p.copy(out, off);
        off += p.length;
    }
    return out;
}
export function deserializeFreeLists(buf) {
    const lists = [
        [],
        [],
        [],
    ];
    let off = 0;
    for (let b = 0; b < FREE_BUCKET.COUNT; b++) {
        if (off + 4 > buf.length)
            break;
        const count = buf.readUInt32LE(off);
        off += 4;
        for (let i = 0; i < count; i++) {
            const o = readVarint(buf, off);
            off += o.size;
            const s = readVarint(buf, off);
            off += s.size;
            lists[b].push({
                offset: o.value,
                size: s.value,
            });
        }
    }
    return lists;
}
function findInsertIndex(list, offset) {
    let lo = 0;
    let hi = list.length;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (list[mid].offset < offset)
            lo = mid + 1;
        else
            hi = mid;
    }
    return lo;
}
function coalesce(space, bucket, idx) {
    const list = space.freeLists[bucket];
    let cur = list[idx];
    if (idx > 0 && list[idx - 1].offset + list[idx - 1].size === cur.offset) {
        const prev = list[idx - 1];
        prev.size += cur.size;
        list.splice(idx, 1);
        cur = prev;
        idx--;
    }
    if (idx + 1 < list.length && cur.offset + cur.size === list[idx + 1].offset) {
        const next = list[idx + 1];
        cur.size += next.size;
        list.splice(idx + 1, 1);
    }
    if (cur.size > FREE_BUCKET.MEDIUM_MAX) {
        const large = FREE_BUCKET.LARGE;
        list.splice(idx, 1);
        const largeIdx = findInsertIndex(space.freeLists[large], cur.offset);
        space.freeLists[large].splice(largeIdx, 0, cur);
    }
    else if (cur.size > FREE_BUCKET.SMALL_MAX) {
        const medium = FREE_BUCKET.MEDIUM;
        list.splice(idx, 1);
        const mediumIdx = findInsertIndex(space.freeLists[medium], cur.offset);
        space.freeLists[medium].splice(mediumIdx, 0, cur);
    }
}
