export interface IndexEntry {
    id: string;
    offset: number;
}
export interface CollectionIndex {
    base: IndexEntry[];
    delta: IndexEntry[];
}
export declare const DELTA_MERGE_THRESHOLD = 64;
export declare function newIndex(): CollectionIndex;
export declare function lookup(index: CollectionIndex, id: string): number | null;
export declare function insert(index: CollectionIndex, id: string, offset: number): boolean;
export declare function remove(index: CollectionIndex, id: string): boolean;
export declare function update(index: CollectionIndex, id: string, newOffset: number): boolean;
export declare function size(index: CollectionIndex): number;
export declare function serialize(index: CollectionIndex): Buffer;
export declare function deserialize(buf: Buffer): CollectionIndex;
export declare function needsMerge(index: CollectionIndex): boolean;
export declare function mergeDelta(index: CollectionIndex): void;
