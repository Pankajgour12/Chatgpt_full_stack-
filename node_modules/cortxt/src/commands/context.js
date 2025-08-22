// src/commands/context.js
import fs from "fs";
import path from "path";
import { readProject } from "../utils/read.js";
import { copyToClipboard } from "../utils/clipboard.js";
import { formatBytes, getProjectName } from "../utils/helpers.js";
import { colors, ui } from "../utils/colors.js";
import chalk from "chalk";

export async function runContext(options = {}) {
  try {
    console.log("🔍 Scanning project...");

    const projectName = getProjectName();
    const projectType = detectProjectType();

    if (projectName) {
      const displayName = projectType
        ? `${projectName} (${projectType})`
        : projectName;
      console.log(`Project: ${displayName}`);
    }

    const startTime = Date.now();
    const result = await readProject(process.cwd(), options);

    let files = Object.entries(result.data);
    const originalFileCount = files.length;
    const originalTotalSize = files.reduce(
      (sum, [, content]) => sum + content.length,
      0
    );

    if (originalFileCount === 0) {
      console.log("❌ No files found to process");
      console.log(
        "💡 Not in a project folder? Navigate to your code directory first"
      );
      return;
    }

    // Smart handling for large projects
    if (originalTotalSize > 500000 && !options.force) {
      console.log("🧠 Smart processing for large project...");
      files = handleLargeProject(files, options);
    }

    console.log("Processing files...");

    const finalFileCount = files.length;
    const finalTotalSize = files.reduce(
      (sum, [, content]) => sum + content.length,
      0
    );

    const formatted = files
      .map(([file, code]) => `\n\n### ${file}\n\`\`\`\n${code}\n\`\`\``)
      .join("\n");

    // Show stats
    const processTime = ((Date.now() - startTime) / 1000).toFixed(1);

    if (finalFileCount !== originalFileCount) {
      console.log(
        `✅ Processed ${finalFileCount} priority files (${formatBytes(
          finalTotalSize
        )}) in ${processTime}s`
      );
      console.log(
        `📊 Original: ${originalFileCount} files (${formatBytes(
          originalTotalSize
        )})`
      );
    } else {
      console.log(
        `✅ Processed ${finalFileCount} files (${formatBytes(
          finalTotalSize
        )}) in ${processTime}s`
      );
    }

    if (result.skipped > 0) {
      console.log(`Skipped ${result.skipped} binary/large files`);
    }

    if (options.stats) {
      showDetailedStats(files, finalTotalSize);
    }

    // Copy to clipboard
    const clipboardSuccess = copyToClipboard(formatted);
    if (clipboardSuccess) {
      console.log("📋 Copied to clipboard - Paste to any AI & watch magic ✨");
    }

    // Smart suggestions based on project
    showSmartSuggestions(
      finalTotalSize,
      finalFileCount,
      files,
      originalTotalSize !== finalTotalSize
    );

    if (options.verbose) {
      console.log(
        `\nStats: ${finalFileCount} files, ${formatBytes(
          finalTotalSize
        )}, ~${Math.round(finalTotalSize / 4)} tokens`
      );
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.code === "ENOENT") {
      console.log(
        "💡 Not in a project folder? Navigate to your code directory first"
      );
    } else {
      console.log("💡 Make sure you're in a valid project directory");
    }
    process.exit(1);
  }
}

function handleLargeProject(files, options) {
  // Priority order for files
  const filePriority = {
    "package.json": 100,
    "README.md": 90,
    "index.js": 80,
    "main.js": 80,
    "app.js": 80,
    "server.js": 75,
  };

  // Get file priority score
  function getFilePriority(filename) {
    // Exact match
    if (filePriority[filename]) return filePriority[filename];

    // Extension-based priority
    const ext = path.extname(filename).toLowerCase();
    const extensionPriority = {
      ".js": 70,
      ".ts": 70,
      ".jsx": 65,
      ".tsx": 65,
      ".vue": 60,
      ".py": 60,
      ".go": 55,
      ".rs": 55,
      ".md": 50,
      ".json": 30,
      ".yaml": 25,
      ".yml": 25,
    };

    return extensionPriority[ext] || 20;
  }

  // Truncate very large files
  function truncateIfNeeded(content, filename, maxLength = 5000) {
    if (content.length <= maxLength) return content;

    const truncated = content.substring(0, maxLength);
    const lastNewline = truncated.lastIndexOf("\n");
    const safeContent =
      lastNewline > 0 ? truncated.substring(0, lastNewline) : truncated;

    return `${safeContent}\n\n// ... (file truncated - showing first ${safeContent.length} of ${content.length} characters)\n// Use 'cortxt file ${filename}' for complete content`;
  }

  // Sort files by priority
  const prioritizedFiles = files
    .map(([file, content]) => ({
      file,
      content: truncateIfNeeded(content, file),
      priority: getFilePriority(path.basename(file)),
      size: content.length,
    }))
    .sort((a, b) => b.priority - a.priority);

  // Select files that fit within reasonable size limit
  let currentSize = 0;
  const maxSize = options.maxSize ? parseInt(options.maxSize) * 1024 : 400000; // 400KB default
  const selectedFiles = [];

  for (const fileObj of prioritizedFiles) {
    if (
      currentSize + fileObj.content.length > maxSize &&
      selectedFiles.length > 5
    ) {
      break; // Stop adding files but ensure we have at least 5 files
    }
    selectedFiles.push([fileObj.file, fileObj.content]);
    currentSize += fileObj.content.length;
  }

  return selectedFiles;
}

function detectProjectType() {
  const cwd = process.cwd();
  const hasFile = (name) => fs.existsSync(path.join(cwd, name));

  if (hasFile("package.json")) {
    try {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(cwd, "package.json"), "utf-8")
      );

      // React/Next.js
      if (pkg.dependencies?.react || pkg.dependencies?.next) {
        return hasFile("next.config.js") ? "⚛️ Next.js" : "⚛️ React";
      }

      // Vue.js
      if (pkg.dependencies?.vue || hasFile("vue.config.js")) {
        return "🟢 Vue.js";
      }

      // Node.js API
      if (pkg.dependencies?.express || pkg.dependencies?.fastify) {
        return "🚀 Node.js API";
      }

      return "📦 Node.js";
    } catch {
      return "📦 Node.js";
    }
  }

  if (hasFile("requirements.txt") || hasFile("setup.py")) {
    return "🐍 Python";
  }

  if (hasFile("Cargo.toml")) {
    return "🦀 Rust";
  }

  if (hasFile("go.mod")) {
    return "🐹 Go";
  }

  return null;
}

function showSmartSuggestions(totalSize, fileCount, files, wasOptimized) {
  if (wasOptimized) {
    console.log(`🎯 Smart optimization applied - showing priority files`);
    console.log(
      `💡 Use ${colors.brand.bold(
        "cortxt context --force"
      )} to include all files`
    );
    console.log(
      `💡 Or ${colors.brand.bold(
        "cortxt file <specific-file>"
      )} for individual files`
    );
  } else if (totalSize > 800000) {
    console.log(
      `📊 Large project - perfect for AI analysis with smart filtering`
    );
  } else if (totalSize > 200000) {
    const mainFiles = files.filter(
      ([file]) =>
        file.includes("index.") ||
        file.includes("main.") ||
        file.includes("app.")
    );
    if (mainFiles.length > 0) {
      console.log(
        `💡 Project is large! Try: ${colors.brand.bold(
          "cortxt file " + mainFiles[0][0]
        )} for focused help`
      );
    } else {
      console.log(
        `💡 Project is large! Try: ${colors.brand.bold(
          "cortxt file <specific-file>"
        )} for focused help`
      );
    }
  } else if (fileCount < 3) {
    console.log("💡 Small project detected. Perfect for AI analysis!");
  } else if (fs.existsSync(path.join(process.cwd(), "package.json"))) {
    console.log(`💡 Need help? Try ${colors.brand.bold("cortxt --help")} 🤝`);
  } else {
    console.log(
      `✨ Ready to share with AI! Try ${colors.brand.bold(
        "cortxt --help"
      )} for more options 🤝`
    );
  }
}

function showDetailedStats(files, totalSize) {
  console.log(`\nDetailed Statistics:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━`);

  // File type breakdown
  const extensions = {};
  files.forEach(([file]) => {
    const ext = file.split(".").pop() || "no extension";
    extensions[ext] = (extensions[ext] || 0) + 1;
  });

  console.log(`File Types:`);
  Object.entries(extensions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .forEach(([ext, count]) => {
      const percentage = ((count / files.length) * 100).toFixed(1);
      console.log(
        `  .${ext.padEnd(6)} ${count
          .toString()
          .padStart(2)} files (${percentage}%)`
      );
    });

  // Largest files
  const sortedBySize = files
    .map(([file, content]) => [file, content.length])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  console.log(`\nLargest Files:`);
  sortedBySize.forEach(([file, size]) => {
    console.log(`  ${file.padEnd(25)} ${formatBytes(size)}`);
  });
}
