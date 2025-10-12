const qs = <T = HTMLDivElement>(selector: string) => document.querySelector(selector)! as T;
const qi = (selector: string) => document.querySelector(selector)! as HTMLInputElement;

const dbPathInput = qi("#db-path");
const headerOutput = qs("#header-output");
const hexOutput = qs("#hex-output");
const collectionsSelect = qs<HTMLSelectElement>("#collections");
const jsonOutput = qs("#json-output");

let currentOffset = 0;
const chunkSize = 256;

async function fget(url: string) {
    const response = await fetch("/api/" + url);
    return await response.json();
}

async function loadFile() {
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

async function loadHeader() {
    const data = await fget("header");
    headerOutput.textContent = JSON.stringify(data, null, 2);
}

async function loadHexView(offset = 0) {
    currentOffset = offset;
    const data = await fget(`hex-view?offset=${offset}&bytes=${chunkSize}`);
    hexOutput.textContent = data.hex.replace(/(.{32})/g, "$1\n");
}

async function loadCollections() {
    const collections = await fget("collections");
    collectionsSelect.innerHTML = collections.map((c: string) => `<option value="${c}">${c}</option>`).join("");
}

async function viewCollection() {
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
dbPathInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loadFile();
});