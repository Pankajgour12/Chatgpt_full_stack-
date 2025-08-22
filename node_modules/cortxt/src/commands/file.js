import fs from "fs";
import path from "path";
import { copyToClipboard } from "../utils/clipboard.js";
import { formatBytes } from "../utils/helpers.js";
import { colors } from "../utils/colors.js";

export async function runFile(filePath, options = {}) {
  try {
    console.log(
      `${colors.scanning || '🔍'} Reading file: ${colors.filename ? colors.filename(filePath) : filePath}`
    );

    const absPath = path.resolve(process.cwd(), filePath);
    const code = fs.readFileSync(absPath, "utf-8");

    // Calculate file stats
    const fileSize = Buffer.byteLength(code, "utf8");
    const lineCount = code.split("\n").length;

    // Safe color function calls with fallbacks
    const infoColor = colors.info || ((text) => text);
    const sizeColor = colors.size || ((text) => text);
    const dimColor = colors.dim || ((text) => text);
    const numberColor = colors.number || ((text) => text);

    console.log(
      `${infoColor("File size:")} ${sizeColor(
        formatBytes(fileSize)
      )} ${dimColor("|")} ${infoColor("Lines:")} ${numberColor(
        lineCount
      )}`
    );

    let formatted;
    if (options.lines) {
      // Add line numbers if requested
      const numberedCode = code
        .split("\n")
        .map((line, index) => `${String(index + 1).padStart(3, " ")}: ${line}`)
        .join("\n");
      formatted = `\n\n### ${filePath} (with line numbers)\n\`\`\`\n${numberedCode}\n\`\`\``;
    } else {
      formatted = `\n\n### ${filePath}\n\`\`\`\n${code}\n\`\`\``;
    }

    copyToClipboard(formatted);
    
    const successColor = colors.success || ((text) => text);
    const brandColor = colors.brand || ((text) => text);
    
    console.log(
      `\n${successColor(
        `✅ File "${filePath}" copied to clipboard!`
      )} ${brandColor("Ready for AI review")} ✨`
    );
  } catch (error) {
    const errorIcon = colors.errorIcon || '❌';
    const errorColor = colors.error || ((text) => text);
    const warningIcon = colors.warningIcon || '⚠️';
    const warningColor = colors.warning || ((text) => text);
    const brandBold = colors.brand?.bold || colors.brand || ((text) => text);

    console.error(`${errorIcon} ${errorColor("Error:")} ${error.message}`);
    
    if (error.code === "ENOENT") {
      console.log(
        `${warningIcon} ${warningColor(`File "${filePath}" not found`)}`
      );
      console.log(`💡 Check the file path and try again`);
    } else if (error.code === "EISDIR") {
      console.log(
        `${warningIcon} ${warningColor(
          `"${filePath}" is a directory, not a file`
        )}`
      );
      console.log(
        `💡 Try: ${brandBold("cortxt tree")} to see directory structure`
      );
    }
    process.exit(1);
  }
}