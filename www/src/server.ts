import FalconFrame from "@wxn0brp/falcon-frame";
import { createBinValthera } from "@wxn0brp/db-storage-bin";
import { ValtheraClass } from "@wxn0brp/db-core";
import { existsSync } from "fs";

const app = new FalconFrame();

let db: ValtheraClass = null;

app.get("/load", async (req, res) => {
    const dbPath = req.query.path;
    if (!dbPath) return { err: true, msg: "No path provided" };
    if (!existsSync(dbPath)) return { err: true, msg: "File does not exist" };
    const create = await createBinValthera(dbPath);
    db = create.db;
    return { err: false };
});

app.static("public");

app.listen(+process.env.PORT || 30564, true);