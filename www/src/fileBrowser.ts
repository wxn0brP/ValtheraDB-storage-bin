import { fget, qs } from "./utils";
import {
    fileSelectorPopup,
    fileList,
    currentPathElement,
    selectFileBtn,
    showAllFilesCheckbox,
    dbPathInput
} from "./dom";

export let currentDirectory = "/";
export let selectedFilePath: string | null = null;
let showAllFiles = false;

async function getCwd(): Promise<string> {
    const res = await fget("current-dir");
    if (res.err) {
        alert(res.msg);
        throw new Error(res.msg);
    }
    return res.path || "/";
}

export async function showFileSelector(initialPath: string | null = null) {
    const startingPath = initialPath || dbPathInput.value || await getCwd();

    if (startingPath && startingPath.includes("/")) {
        currentDirectory = startingPath.substring(0, startingPath.lastIndexOf("/")) || "/";
    } else {
        currentDirectory = await getCwd();
    }

    fileSelectorPopup.classList.add("active");
    await loadDir(currentDirectory);
}

export async function loadDir(dirPath: string) {
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
            parentItem.addEventListener("click", () => loadDir(parentDir));
            fileList.appendChild(parentItem);
        }

        for (const item of files) {
            const itemElement = document.createElement("div");
            const fullPath = dirPath === "/" ? `/${item.name}` : `${dirPath}/${item.name}`;

            if (item.isDirectory) {
                itemElement.className = "file-item directory";
                itemElement.innerHTML = `📁 ${item.name}`;
                itemElement.addEventListener("click", () => loadDir(fullPath));
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

export function selectFile(path: string) {
    if (path.endsWith("/") || (!path.includes(".") && !path.includes("/.."))) {
        loadDir(path);
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

export function closeFileSelector() {
    fileSelectorPopup.classList.remove("active");
    currentDirectory = "/";
    selectedFilePath = null;
    selectFileBtn.disabled = true;
}

export function handleShowAllFilesChange() {
    showAllFiles = showAllFilesCheckbox.checked;
    loadDir(currentDirectory);
}

export function handlePopupClick(e: Event) {
    if (e.target === fileSelectorPopup) {
        closeFileSelector();
    }
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

showAllFilesCheckbox.addEventListener("change", handleShowAllFilesChange);
fileSelectorPopup.addEventListener("click", handlePopupClick);