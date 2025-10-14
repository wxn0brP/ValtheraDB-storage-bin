const qs = <T = HTMLDivElement>(selector: string) => document.querySelector(selector)! as T;
const qi = (selector: string) => document.querySelector(selector)! as HTMLInputElement;
export { }

const auth = (new URLSearchParams(window.location.search)).get("auth") || "";
document.cookie = `auth=${auth}`;

const dbPathInput = qi("#db-path");
const headerOutput = qs("#header-output");
const hexOutput = qs("#hex-output");
const collectionsSelect = qs<HTMLSelectElement>("#collections");
const jsonOutput = qs("#json-output");

const fileSelectorPopup = qs("#file-selector-popup");
const fileList = qs("#file-list");
const currentPathElement = qs("#current-path");
const selectFileBtn = qs<HTMLButtonElement>("#select-file-btn");
const showAllFilesCheckbox = qs<HTMLInputElement>("#show-all-files");

let currentOffset = 0;
const chunkSize = 256;
let selectedFilePath: string | null = null;
let currentDirectory = "/";

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

async function showFileSelector(initialPath: string | null = null) {
    const startingPath = initialPath || dbPathInput.value || await getCurrentWorkingDirectory();

    if (startingPath && startingPath.includes("/")) {
        currentDirectory = startingPath.substring(0, startingPath.lastIndexOf("/")) || "/";
    } else {
        currentDirectory = await getCurrentWorkingDirectory();
    }

    fileSelectorPopup.classList.add("active");
    await loadDirectoryContent(currentDirectory);
}

async function getCurrentWorkingDirectory(): Promise<string> {
    const res = await fget("current-dir");
    if (res.err) {
        alert(res.msg);
        throw new Error(res.msg);
    }
    return res.path || "/";
}

let showAllFiles = false;

async function loadDirectoryContent(dirPath: string) {
    try {
        const showAllParam = showAllFiles ? "&showAll=true" : "";
        const result = await fget(`list-dir?dir=${encodeURIComponent(dirPath)}${showAllParam}`);

        if (result.err) {
            alert(result.msg);
            return;
        }

        const files: { name: string; type: string; isDirectory: boolean }[] = result;
        currentPathElement.textContent = dirPath;
        fileList.innerHTML = "";

        if (dirPath !== "/" && dirPath !== "") {
            const parentDir = dirPath.substring(0, dirPath.lastIndexOf("/")) || "/";
            const parentItem = document.createElement("div");
            parentItem.className = "file-item directory";
            parentItem.innerHTML = `📁 .. (Parent Directory)`;
            parentItem.addEventListener("click", () => loadDirectoryContent(parentDir));
            fileList.appendChild(parentItem);
        }

        for (const item of files) {
            const itemElement = document.createElement("div");
            const fullPath = dirPath === "/" ? `/${item.name}` : `${dirPath}/${item.name}`;

            if (item.isDirectory) {
                itemElement.className = "file-item directory";
                itemElement.innerHTML = `📁 ${item.name}`;
                itemElement.addEventListener("click", () => loadDirectoryContent(fullPath));
            } else {
                let icon = "📄";
                if (item.type == "db") icon = "📦";

                itemElement.className = "file-item file";
                itemElement.innerHTML = `${icon} ${item.name}`;
                itemElement.addEventListener("click", () => selectFile(fullPath));
            }

            fileList.appendChild(itemElement);
        }
    } catch (error) {
        console.error("Error loading directory:", error);
        alert("Failed to load directory content");
    }
}

function selectFile(path: string) {
    if (path.endsWith("/") || (!path.includes(".") && !path.includes("/.."))) {
        loadDirectoryContent(path);
        return;
    }

    selectedFilePath = path;
    dbPathInput.value = path;

    const fileItems = fileList.querySelectorAll(".file-item");
    fileItems.forEach(item => {
        if (item.textContent?.includes(path.split("/").pop() || "")) {
            item.classList.add("selected");
        } else {
            item.classList.remove("selected");
        }
    });

    selectFileBtn.disabled = false;
}

function closeFileSelector() {
    fileSelectorPopup.classList.remove("active");
    currentDirectory = "/";
    selectedFilePath = null;
    selectFileBtn.disabled = true;
}

qs("#browse-files").addEventListener("click", () => showFileSelector());
qs("#close-popup").addEventListener("click", closeFileSelector);
qs("#cancel-popup").addEventListener("click", closeFileSelector);

selectFileBtn.addEventListener("click", () => {
    if (selectedFilePath) {
        dbPathInput.value = selectedFilePath;
        closeFileSelector();
    }
});

showAllFilesCheckbox.addEventListener("change", function () {
    showAllFiles = this.checked;
    loadDirectoryContent(currentDirectory);
});

fileSelectorPopup.addEventListener("click", (e) => {
    if (e.target === fileSelectorPopup) {
        closeFileSelector();
    }
});

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