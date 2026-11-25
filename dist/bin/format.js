import * as msgpack from "@msgpack/msgpack";
export function defaultFormat() {
    return {
        encode: async (data) => Buffer.from(msgpack.encode(data)),
        decode: async (data) => msgpack.decode(data),
    };
}
