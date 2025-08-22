// src/utils/helpers.js
import fs from "fs";
import path from "path";

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getProjectName() {
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      return pkg.name;
    }
    return path.basename(process.cwd());
  } catch {
    return null;
  }
}

export function formatFileTree(dir, prefix = "", maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return "";
  
  try {
    const files = fs.readdirSync(dir);
    let result = "";
    
    files.forEach((file, index) => {
      const fullPath = path.join(dir, file);
      const isLast = index === files.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const nextPrefix = prefix + (isLast ? "    " : "│   ");
      
      try {
        const stat = fs.statSync(fullPath);
        const icon = stat.isDirectory() ? "📁 " : "📄 ";
        result += `${prefix}${connector}${icon}${file}\n`;
        
        if (stat.isDirectory() && !shouldIgnoreForTree(file)) {
          result += formatFileTree(fullPath, nextPrefix, maxDepth, currentDepth + 1);
        }
      } catch (err) {
        // Skip files we can't read
      }
    });
    
    return result;
  } catch (err) {
    return "";
  }
}

function shouldIgnoreForTree(fileName) {
  const ignorePatterns = ["node_modules", ".git", "dist", "build", ".cache"];
  return ignorePatterns.some(pattern => fileName.includes(pattern));
}

export function createProgressBar(current, total, width = 20) {
  const progress = current / total;
  const filled = Math.round(progress * width);
  const empty = width - filled;
  
  return "[" + "▓".repeat(filled) + "░".repeat(empty) + "] " + 
         Math.round(progress * 100) + "%";
}