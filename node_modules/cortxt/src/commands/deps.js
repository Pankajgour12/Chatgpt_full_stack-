import fs from "fs";
import path from "path";
import { copyToClipboard } from "../utils/clipboard.js";
import { colors } from "../utils/colors.js";

export async function runDeps(options = {}) {
  try {
    console.log(`${colors.scanning} Extracting dependencies...`);
    
    const pkgPath = path.join(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    
    let deps = {};
    
    // Handle filtering options
    if (options.devOnly) {
      deps = { devDependencies: pkg.devDependencies || {} };
      console.log(`${colors.info('Found')} ${colors.number(Object.keys(deps.devDependencies).length)} ${colors.info('dev dependencies')}`);
    } else if (options.prodOnly) {
      deps = { dependencies: pkg.dependencies || {} };
      console.log(`${colors.info('Found')} ${colors.number(Object.keys(deps.dependencies).length)} ${colors.info('production dependencies')}`);
    } else {
      deps = {
        dependencies: pkg.dependencies || {},
        devDependencies: pkg.devDependencies || {}
      };
      const totalDeps = Object.keys(deps.dependencies).length + Object.keys(deps.devDependencies).length;
      console.log(`${colors.info('Found')} ${colors.number(totalDeps)} ${colors.info('total dependencies')}`);
    }

    const formatted = `\n\n### package.json dependencies\n\`\`\`json\n${JSON.stringify(deps, null, 2)}\n\`\`\``;
    
    console.log(formatted);
    copyToClipboard(formatted);
    console.log(`\n${colors.success('✅ Dependencies copied to clipboard!')} ${colors.brand('Ready for AI analysis')} ✨`);
    
  } catch (error) {
    console.error(`${colors.errorIcon} ${colors.error('Error:')} ${error.message}`);
    if (error.code === 'ENOENT') {
      console.log(`${colors.warningIcon} ${colors.warning('No package.json found in current directory')}`);
      console.log(`💡 Make sure you're in a Node.js project directory`);
    }
    process.exit(1);
  }
}