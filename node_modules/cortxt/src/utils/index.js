import { Command } from "commander";
import { runContext } from "../commands/context.js";
import { runFile } from "../commands/file.js";
import { runDeps } from "../commands/deps.js";
import { runTree } from "../commands/tree.js";
import { runStats } from "../commands/stats.js";
import { colors } from "../utils/colors.js";

const program = new Command();

// Brand header
function showBrand() {
  console.log(`\n${colors.brand('📦 Cortxt v1.0.0')} - ${colors.info('Fastest way to provide project context to AI intelligence.')}\n`);
}

program
  .name("cortxt")
  .description("🧠 Cortxt – Simplest way to share project context with AI.")
  .version("1.0.0");

program
  .command("context")
  .description("📁 Extract full project (all files & code)")
  .option("-v, --verbose", "show detailed scanning info")
  .option("-s, --stats", "show project statistics")
  .option("--force", "include all files regardless of size")
  .option("--max-size <size>", "maximum total size in KB (default: 400)", "400")
  .action((options) => {
    showBrand();
    runContext(options);
  });

program
  .command("file <filepath>")
  .description("📄 Extract a single file's code")
  .option("-l, --lines", "include line numbers")
  .action((filepath, options) => {
    showBrand();
    runFile(filepath, options);
  });

program
  .command("deps")
  .description("📦 Extract only dependencies from package.json")
  .option("--dev-only", "include only devDependencies")
  .option("--prod-only", "include only dependencies (production)")
  .action((options) => {
    showBrand();
    runDeps(options);
  });

program
  .command("tree")
  .description("🌲 Show project folder structure")
  .option("-d, --depth <n>", "maximum depth to show", "3")
  .action((options) => {
    showBrand();
    runTree(options);
  });

program
  .command("stats")
  .description("📊 Show project statistics (files, lines, size)")
  .action(() => {
    showBrand();
    runStats();
  });

// Custom help - Simple and clean with strategic highlighting
program.configureHelp({
  formatHelp: () => {
    return `${colors.brand.bold('Cortxt Help Commands')} 🤝

${colors.info('USAGE:')}
  ${colors.brand('cortxt')} <command> [options]

${colors.info('COMMANDS:')}
  ${colors.filename('context')}                 Extract full project (all files & code)
  ${colors.filename('file <filepath>')}         Extract a single file's code
  ${colors.filename('deps')}                    Extract only dependencies from package.json
  ${colors.filename('tree')}                    Show project folder structure
  ${colors.filename('stats')}                   Show project statistics (files, lines, size)

${colors.info('CONTEXT OPTIONS:')}
  -v, --verbose           Show detailed scanning info
  -s, --stats             Show project statistics
  --force                 Include all files regardless of size
  --max-size <size>       Maximum total size in KB (default: 400)

${colors.info('OTHER OPTIONS:')}
  --version               Show version number
  --help, -h              Show help for a command

${colors.info('EXAMPLES:')}
  ${colors.brand('cortxt context')}              # Copy entire project code to clipboard
  ${colors.brand('cortxt context --force')}      # Include all files, bypass smart filtering
  ${colors.brand('cortxt context --max-size 800')}  # Set custom size limit
  ${colors.brand('cortxt file src/app.js')}      # Copy only one file's code
  ${colors.brand('cortxt deps')}                 # Copy dependencies
  ${colors.brand('cortxt tree')}                 # Show folder structure
  ${colors.brand('cortxt stats')}                # Show project stats

${colors.success('✨ All output is automatically copied to clipboard!')}`;
  }
});

// Handle no command - Simple quick start with highlighting
program.action(() => {
  console.log(`${colors.info('--->>>>> 👉 Cortxt Quick Commands 👇 <<<<<---')}

  ${colors.brand.bold('cortxt context')}          # Extract all code (smart filtering)
  ${colors.brand.bold('cortxt context --force')}  # Extract all code (no filtering)
  ${colors.brand.bold('cortxt file <path>')}      # Extract one file
  ${colors.brand.bold('cortxt deps')}             # Extract dependencies
  ${colors.brand.bold('cortxt tree')}             # Show folder structure
  ${colors.brand.bold('cortxt stats')}            # Show project stats
  ${colors.brand.bold('cortxt --help')}           # Show help

${colors.success('✨ Output is copied to clipboard automatically.')}`);
});

program.parse(process.argv);