import clipboardy from "clipboardy";

export function copyToClipboard(text) {
  try {
    clipboardy.writeSync(text);
  } catch (err) {
    console.error("⚠️ Clipboard error:", err.message);
  }
}
