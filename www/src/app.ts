import { fget, qi, qs } from "./utils";
import {
    dbPathInput,
    headerOutput,
    hexOutput,
    collectionsSelect,
    jsonOutput,
} from "./dom";

let currentOffset = 0;
let chunkSize = +qi("#chunk-size").value || 256;

export async function loadFile() {
    const path = dbPathInput.value;
    if (!path) {
        alert("Please provide a file path.");
        return;
    }
    const result = await fget(`load?path=${encodeURIComponent(path)}`);
    if (result.err) {
        alert(result.msg);
        return;
    }

    loadHeader();
    loadHexView();
    loadCollections();
}

export async function loadHeader() {
    const data = await fget("header");
    headerOutput.textContent = JSON.stringify(data, null, 2);
}

export async function loadHexView(offset = 0) {
    currentOffset = offset;
    const data = await fget(`hex-view?offset=${offset}&bytes=${chunkSize}`);
    hexOutput.textContent = data.hex;
}

export async function loadCollections() {
    const collections = await fget("collections");
    collectionsSelect.innerHTML = collections.map((c: string) => `<option value="${c}">${c}</option>`).join("");
}

export async function viewCollection() {
    const collection = collectionsSelect.value;
    if (!collection) {
        alert("Please select a collection");
        return;
    }
    const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection })
    });
    const data = await response.json();
    jsonOutput.textContent = JSON.stringify(data, null, 2);
}

qs("#load-db").addEventListener("click", loadFile);
qs("#view-collection").addEventListener("click", viewCollection);

qs("#prev-chunk").addEventListener("click", () => {
    if (currentOffset > 0) {
        loadHexView(currentOffset - chunkSize);
    }
});

qs("#next-chunk").addEventListener("click", () => {
    loadHexView(currentOffset + chunkSize);
});

qs("#chunk-size").addEventListener("change", (e: Event) => {
    const val = (e.target as HTMLSelectElement).value;
    if (val === "custom") {
        chunkSize = +prompt("Enter chunk size:");
    } else {
        chunkSize = +val;
    }
    loadHexView(currentOffset);
});

dbPathInput.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") loadFile();
});