import { BinManager, CollectionMeta } from ".";
import { _log } from "../log";
import { FileMeta } from "./head";

export function findCollection(cmp: BinManager, name: string): CollectionMeta | undefined {
    return cmp.meta.collections.find(c => c.name === name);
}

export async function getFreeSlot(cmp: BinManager, size: number): Promise<FileMeta["freeList"][number] | undefined> {
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
