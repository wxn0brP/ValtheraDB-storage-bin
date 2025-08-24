import { BinManager } from ".";
import { findCollection } from "./data";
import { saveHeaderAndPayload } from "./head";
import { writeData } from "./utils";

export async function removeCollection(cmp: BinManager, collection: string) {
    const { meta, fd, options } = cmp;
    const collectionMeta = findCollection(cmp, collection);
    if (!collectionMeta) throw new Error("Collection not found");

    if (meta.collections.length === 1) {
        meta.collections = [];
        meta.freeList = [];
        await fd.truncate(0);
        await saveHeaderAndPayload(cmp);
        return;
    }

    meta.collections.splice(meta.collections.findIndex(c => c.name === collection), 1);
    meta.freeList.push({
        offset: collectionMeta.offset,
        capacity: collectionMeta.capacity
    });

    if (options.overwriteRemovedCollection) {
        await writeData(fd, collectionMeta.offset, Buffer.alloc(collectionMeta.capacity), collectionMeta.capacity);
    }

    await saveHeaderAndPayload(cmp);
}