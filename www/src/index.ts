import "./app";
import "./fileBrowser";
import "./detail";

const auth = (new URLSearchParams(window.location.search)).get("auth") || "";
document.cookie = `auth=${auth}`;
