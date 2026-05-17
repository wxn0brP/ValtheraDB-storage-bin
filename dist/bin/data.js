import { _log } from "../log.js";
export function findCollection(cmp, name) {
    return cmp.meta.collections.find(c => c.name === name);
}
export async function getFreeSlot(cmp, size) {
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
