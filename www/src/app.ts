import { fget, qi, qs } from "./utils";
import {
    dbPathInput,
    headerOutput,
    hexOutput,
    collectionsSelect,
    jsonOutput,
    hexModeSelect,
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
    const data = await fget(`hex-view?offset=${offset}&bytes=${chunkSize}&mode=${hexModeSelect.value}`);
    if (data.err) {
        alert(data.msg);
        return;
    }
    hexOutput.innerHTML = "";
    for (let i = 0; i < data.hex.length; i++) {
        const lineData = data.hex[i] as { addr: string, ascii: string, hex?: string };
        let line = "";

        if (lineData.hex) {
            line += lineData.hex.split(" ").map((hex, j) => `<span class="hex" data-id="${i}-${j}">${hex}</span>`).join(" ") + "&nbsp;".repeat(3);
        }
        line += lineData.ascii.split("").map((char, j) => `<span class="ascii" data-id="${i}-${j}">${char}</span>`).join("");

        hexOutput.innerHTML += `
            <div class="line">
                ${lineData.addr}
                ${line}
            </div>
        `;
    }
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

qs("#reset-chunk").addEventListener("click", () => {
    loadHexView(0);
});

hexModeSelect.addEventListener("change", () => {
    loadHexView(currentOffset);
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