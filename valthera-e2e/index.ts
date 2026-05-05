import { rm } from "fs/promises";
import { BinManager, BinFileAction } from "../src/index";

const TEST_FILE = "/tmp/valthera-e2e-bin-test.val";

export default async () => {
    await rm(TEST_FILE, { force: true });
    const mgr = new BinManager(TEST_FILE, { crc: 2 });
    const actions = new BinFileAction(mgr);
    await actions.init();
    return actions;
}
