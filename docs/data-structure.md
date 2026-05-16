# Data Structure

This document describes the data structure used by the binary database format.

## File Layout

The file is structured as follows:

1. **Header (64 bytes)**: Contains metadata about the file.
2. **Payload**: Contains the serialized collections and free list data.
3. **Data Blocks**: Contains the actual data for each collection.

### Header

The header is a fixed-size block of 64 bytes, structured as follows:

| Offset | Size | Name         | Description                                           |
|--------|------|--------------|-------------------------------------------------------|
| 0      | 4    | Version      | File format version (currently 1)                     |
| 4      | 4    | Payload Len  | Length of the payload data                            |
| 8      | 4    | Payload Off  | Offset of the payload data from the header start      |
| 12     | 4    | Block Size   | Preferred block size for allocations                  |
| 16     | 48   | Reserved     | Reserved for future use                               |

### Payload

The payload contains the serialized list of collections and free blocks. It is a msgpack-encoded object with the following structure:

```ts
[
  [string, number, number][], // Collections: [name, offset, capacity]
  [number, number][]          // Free blocks: [offset, capacity]
]
```

### Data Blocks

Each collection's data is stored in a data block. The block structure consists of:

1. **Total Length (4 bytes)**: A 32-bit unsigned integer (`Uint32`) representing the total size of the data section.

2. **Records (variable length)**: A sequence of `N` records, where each record follows this format:
  - **Record Length (4 bytes)**: A `Uint32` specifying the length of the data within this specific record.
  - **Record Data (N bytes)**: The actual data, with the length defined by the preceding field.

Logical structure:

```text
[ Total Length (Uint32) ]
[ Record 1 Length (Uint32) | Record 1 Data ]
[ Record 2 Length (Uint32) | Record 2 Data ]
...
[ Record N Length (Uint32) | Record N Data ]
```

The data within the records can be serialized using msgpack or another user-defined format.
