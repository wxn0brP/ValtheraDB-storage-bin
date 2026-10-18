import { _log } from "../log.js";
export async function writeData(fd, offset, data, capacity) {
    if (!fd)
        throw new Error("File not open");
    if (data.length > capacity)
        throw new Error("Data size exceeds capacity");
    await _log(6, "Writing data at offset:", offset, "length:", data.length, "capacity:", capacity);
    await fd.write(data, 0, data.length, offset);
    await _log(5, "Bytes written:", data.length);
    if (data.length < capacity) {
        const pad = Buffer.alloc(capacity - data.length, 0);
        const padStart = offset + data.length;
        await _log(6, "Padding with zeros:", pad.length, "at offset:", padStart);
        await fd.write(pad, 0, pad.length, padStart);
    }
    await _log(6, "Data written");
}
export async function readData(fd, offset, length) {
    if (!fd)
        throw new Error("File not open");
    if (length <= 0)
        return Buffer.alloc(0);
    await _log(6, "Reading data from offset:", offset, "length:", length);
    const buf = Buffer.alloc(length);
    const { bytesRead } = await fd.read(buf, 0, length, offset);
    await _log(5, "Bytes read:", bytesRead);
    return buf;
}
export async function writeAt(fd, offset, data) {
    if (!fd)
        throw new Error("File not open");
    await fd.write(data, 0, data.length, offset);
}
export async function readAt(fd, offset, length) {
    if (!fd)
        throw new Error("File not open");
    if (length <= 0)
        return Buffer.alloc(0);
    const buf = Buffer.alloc(length);
    await fd.read(buf, 0, length, offset);
    return buf;
}
export async function readFd(fd, length, pos) {
    if (!fd)
        throw new Error("File not open");
    if (length <= 0)
        return Buffer.alloc(0);
    const buf = Buffer.alloc(length);
    await fd.read(buf, 0, length, pos);
    return buf;
}
