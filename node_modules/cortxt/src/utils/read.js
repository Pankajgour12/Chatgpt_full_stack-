import fs from "fs";
import path from "path";
import { shouldIgnore } from "./ignore.js";

export async function readProject(rootDir) {
  const data = {};
  let skipped = 0;
  
  if (!fs.existsSync(rootDir)) {
    console.error(`❌ Directory not found: ${rootDir}`);
    process.exit(1);
  }

  function walk(dir) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const relPath = path.relative(rootDir, fullPath);

        if (shouldIgnore(fullPath, file, rootDir)) continue;

        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            walk(fullPath);
          } else {
            if (stat.size > 1024 * 1024) { 
              skipped++;
              continue;
            }
            data[relPath] = fs.readFileSync(fullPath, "utf-8");
          }
        } catch (err) {
          console.warn(`⚠️  Skipping ${relPath}: ${err.message}`);
        }
      }
    } catch (err) {
      console.warn(`⚠️  Cannot read directory ${dir}: ${err.message}`);
    }
  }

  walk(rootDir);
  return { data, skipped };  // ✅ now matches context.js usage
}
