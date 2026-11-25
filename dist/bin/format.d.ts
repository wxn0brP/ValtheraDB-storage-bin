export interface FormatCodec {
    encode(data: any, collection: string): Promise<Buffer>;
    decode(data: Buffer, collection: string): Promise<any>;
}
export declare function defaultFormat(): FormatCodec;
