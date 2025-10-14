import "./app";
import "./fileBrowser";

const auth = (new URLSearchParams(window.location.search)).get("auth") || "";
document.cookie = `auth=${auth}`;