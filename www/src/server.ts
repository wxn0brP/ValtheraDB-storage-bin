import { ValtheraClass } from "@wxn0brp/db-core";
import { BinManager, createBinValthera } from "@wxn0brp/db-storage-bin";
import FalconFrame, { RouteHandler } from "@wxn0brp/falcon-frame";
import { randomUUID } from "crypto";
import { existsSync, readdirSync, statSync } from "fs";
import { createServer } from "http";
import { extname } from "path";

const accessSecret = randomUUID();
const secure = process.env.NODE_ENV !== "experimental";
const app = new FalconFrame();

let db: ValtheraClass | null = null;
let mgr: BinManager | null = null;
let dbPath: string | null = null;

const api = app.router("/api");

const requireLoad: RouteHandler = (_, res, next) => {
    if (!db) {
        res.status(400);
        return { err: true, msg: "No database loaded" };
    }
    next();
}

api.use("/", (req, res, next) => {
    if (!secure) return next();

    if (req.socket.remoteAddress !== "127.0.0.1") {
        res.status(403);
        return { err: true, msg: "Forbidden" };
    }

    const auth = req.cookies.auth as string;
    if (auth !== accessSecret) {
        res.status(401);
        return { err: true, msg: "Unauthorized" };
    }

    next();
})

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

api.get("/header", requireLoad, async (req, res) => {
    const headerInfo = mgr.meta;
    return headerInfo;
});

function toHexDump(buffer: Buffer, offset: number, mode: string): { addr: string, ascii: string, hex?: string }[] {
    const lines = [];
    const blockSize = mode === "wide-ascii" ? 64 : 16;
    for (let i = 0; i < buffer.length; i += blockSize) {
        const block = buffer.subarray(i, i + blockSize);
        const hex = block.toString("hex").match(/.{1,2}/g)?.join(" ") || "";
        const ascii = block.toString("ascii")
            .replace(/[^\x20-\x7E]/g, ".");

        const addr = (offset + i).toString(16).padStart(8, "0");
        const line: any = { addr, ascii };
        if (mode === "full") line.hex = hex.padEnd(3 * blockSize - 1);
        lines.push(line);
    }
    return lines;
}

api.get("/hex-view", requireLoad, async (req, res) => {
    const offset = parseInt(req.query.offset as string) || 0;
    let bytes = parseInt(req.query.bytes as string) || 256;
    const fileSize = mgr.meta.fileSize;

    if (offset >= fileSize) {
        res.status(400).json({ err: true, msg: "Offset exceeds file size" });
        return;
    }
    if (offset + bytes > fileSize) {
        bytes = fileSize - offset;
    }

    const buffer = Buffer.alloc(bytes);
    await mgr.fd.read(buffer, 0, bytes, offset);

    const hex = toHexDump(buffer, offset, req.query.mode || "full");

    return {
        offset,
        bytes,
        hex
    }
});

api.get("/collections", requireLoad, async (req, res) => {
    const collections = await db.getCollections();
    return collections;
});

api.post("/query", requireLoad, async (req, res) => {
    const { collection, query, findOpts } = req.body;
    if (!collection) {
        res.status(400);
        return { err: true, msg: "No collection specified" };
    }

    const data = await db.find(collection, query || {}, findOpts);
    return data;
});

api.get("/current-dir", () => ({ path: process.cwd() }));

api.get("/list-dir", (req, res) => {
    const dir = req.query.dir as string;
    if (!dir) {
        res.status(400);
        return { err: true, msg: "No directory specified" };
    }
    try {
        const files = readdirSync(dir);
        const showAll = req.query.showAll === "true";

        const fileObjects = files.map(file => {
            const filePath = dir + (dir.endsWith("/") ? "" : "/") + file;
            const fileStat = statSync(filePath);
            const isDirectory = fileStat.isDirectory();
            let fileType = "other";

            if (isDirectory) {
                fileType = "directory";
            } else {
                const ext = extname(file).slice(1);
                fileType = ["vdb", "vfsp", "val"].includes(ext) ? "db" : "other";
            }

            return {
                name: file,
                type: fileType,
                isDirectory: isDirectory
            };
        });

        if (showAll) return fileObjects;

        const filteredFileObjects = fileObjects.filter(fileObj =>
            fileObj.isDirectory ||
            fileObj.type === "db"
        );
        return filteredFileObjects;

    } catch (error) {
        res.status(500);
        return { err: true, msg: `Error reading directory: ${(error as Error).message}` };
    }
});

app.static("public");
app.static("dist");

const port = +process.env.PORT || 30564;
const server = createServer(app.getApp());
server.listen(port, "127.0.0.1", () => {
    console.log(`Server started http://localhost:${port}/?auth=` + accessSecret);
});