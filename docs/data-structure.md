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
| 16     | 4    | CRC32        | CRC32 checksum of the file (excluding this field)     |
| 20     | 44   | Reserved     | Reserved for future use                               |

### Payload

The payload contains the serialized list of collections and free blocks. It is a msgpack-encoded object with the following structure:

```ts
{
  c: [string, number, number][]; // Collections: [name, offset, capacity]
  f: [number, number][];         // Free blocks: [offset, capacity]
}
```

### Data Blocks

Each collection's data is stored in a data block. A data block consists of:

1. **Length (4 bytes)**: A 32-bit unsigned integer representing the length of the data (Uint32).
2. **Data (variable)**: The actual data, padded to the nearest block size.

The data is serialized using msgpack.