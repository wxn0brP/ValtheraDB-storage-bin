import { ValtheraClass } from "@wxn0brp/db-core";
import { BinManager, createBinValthera } from "@wxn0brp/db-storage-bin";
import FalconFrame from "@wxn0brp/falcon-frame";
import { existsSync } from "fs";
import { open } from "fs/promises";

const app = new FalconFrame();

let db: ValtheraClass | null = null;
let mgr: BinManager | null = null;
let dbPath: string | null = null;

const api = app.router("/api");

api.get("/load", async (req, res) => {
    dbPath = req.query.path as string;
    if (!dbPath) return { err: true, msg: "No path provided" };
    if (!existsSync(dbPath)) return { err: true, msg: "File does not exist" };

    try {
        const create = await createBinValthera(dbPath);
        db = create.db;
        mgr = create.mgr;
        return { err: false, msg: "Database loaded successfully." };
    } catch (error) {
        return { err: true, msg: `Failed to load database: ${(error as Error).message}` };
    }
});

api.get("/header", async (req, res) => {
    if (!mgr) {
        res.status(400);
        return { err: true, msg: "No database loaded" };
    }
    const headerInfo = mgr.meta;
    return headerInfo;
});

api.get("/hex-view", async (req, res) => {
    if (!dbPath) {
        res.status(400);
        return { err: true, msg: "No database loaded" };
    }
    const offset = parseInt(req.query.offset as string) || 0;
    const bytes = parseInt(req.query.bytes as string) || 256;

    const fd = await open(dbPath, "r");
    const buffer = Buffer.alloc(bytes);
    await fd.read(buffer, 0, bytes, offset);
    await fd.close();

    return {
        offset,
        bytes,
        hex: buffer.toString("hex"),
    };
});

api.get("/collections", async (req, res) => {
    if (!db) {
        res.status(400);
        return { err: true, msg: "No database loaded" };
    }
    const collections = await db.getCollections();
    return collections;
});

api.post("/query", async (req, res) => {
    if (!db) {
        res.status(400);
        return { err: true, msg: "No database loaded" };
    }
    const { collection, query, findOpts } = req.body;
    if (!collection) {
        res.status(400);
        return { err: true, msg: "No collection specified" };
    }

    const data = await db.find(collection, query || {}, findOpts);
    return data;
});

app.static("public");
app.static("dist");

app.listen(+process.env.PORT || 30564, true);