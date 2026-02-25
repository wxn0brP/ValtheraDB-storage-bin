import { HEADER_SIZE } from "./bin/static.js";
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
        crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
    CRC32_TABLE[i] = crc >>> 0;
}
export function crc32(buf, seed = 0xFFFFFFFF) {
    if (typeof buf === "string") {
        buf = new TextEncoder().encode(buf);
    }
    let crc = seed ^ 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        const byte = buf[i];
        crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ byte) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}
export async function getFileCrc(fd, short = false) {
    const { size } = await fd.stat();
    if (size < HEADER_SIZE)
        return { storedCrc: 0, computedCrc: 0 };
    const buffer = Buffer.alloc(size);
    await fd.read(buffer, 0, size, 0);
    const storedCrc = buffer.readUInt32LE(16);
    if (short && storedCrc === 0)
        return { storedCrc: 0, computedCrc: 0 };
    buffer.fill(0, 16, 20);
    const computedCrc = crc32(buffer);
    return {
        storedCrc,
        computedCrc
    };
}
