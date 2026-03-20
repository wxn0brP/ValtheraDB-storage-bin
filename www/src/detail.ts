import { detailsPopup, hexModeSelect, hexOutput } from "./dom";

let showingDetails = 0;

hexOutput.addEventListener("mousemove", (e: MouseEvent) => {
    removeClass("gold");
    const target = e.target as HTMLElement;
    if (showingDetails && target !== detailsPopup && Date.now() - showingDetails > 2000) {
        showingDetails = 0;
        detailsPopup.style.display = "none";
        removeClass("selected");
    }

    const id = target.getAttribute("data-id");
    if (!id) return;

    hexOutput.querySelectorAll(`[data-id="${id}"]`).forEach(el => el.classList.add("gold"));
});

hexOutput.addEventListener("click", (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const id = target.getAttribute("data-id");
    if (!id) return;

    removeClass("selected");
    hexOutput.querySelectorAll(`[data-id="${id}"]`).forEach(el => el.classList.add("selected"));

    showingDetails = Date.now();
    const [line, idx] = id.split("-");
    const blockSize = hexModeSelect.value === "wide-ascii" ? 64 : 16;
    const offset = parseInt(line) * blockSize + parseInt(idx);

    detailsPopup.innerHTML = `
        <div><strong>Offset (hex):</strong><span>${offset.toString(16).padStart(8, "0")}</span></div>
        <div><strong>Offset (decimal):</strong><span>${offset}</span></div>
    `;

    const mouseX = e.clientX;
    const mouseY = e.clientY;
    detailsPopup.style.left = `${mouseX}px`;
    detailsPopup.style.top = `${mouseY}px`;
    detailsPopup.style.display = "";
});

detailsPopup.addEventListener("mouseleave", () => {
    showingDetails = 0;
    detailsPopup.style.display = "none";
    removeClass("selected");
});

function removeClass(className: string) {
    hexOutput.querySelectorAll(`.${className}`).forEach(el => el.classList.remove(className));
}
