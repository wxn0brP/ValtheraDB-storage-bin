import { qs, qi } from "./utils";

export const dbPathInput = qi("#db-path");
export const headerOutput = qs("#header-output");
export const hexOutput = qs("#hex-output");
export const collectionsSelect = qs<HTMLSelectElement>("#collections");
export const jsonOutput = qs("#json-output");

export const fileSelectorPopup = qs("#file-selector-popup");
export const fileList = qs("#file-list");
export const currentPathElement = qs("#current-path");
export const selectFileBtn = qs<HTMLButtonElement>("#select-file-btn");
export const showAllFilesCheckbox = qi("#show-all-files");
export const hexModeSelect = qs<HTMLSelectElement>("#hex-mode");

export const detailsPopup = qs("#details-popup"); 
