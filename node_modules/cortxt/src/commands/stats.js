import path from "path";
import { readProject } from "../utils/read.js";
import { formatBytes } from "../utils/helpers.js";
import { copyToClipboard } from "../utils/clipboard.js";
import { colors } from "../utils/colors.js";

export async function runStats() {
  try {
    console.log(`${colors.scanning} Analyzing project...`);
    
    const startTime = Date.now();
    const result = await readProject(process.cwd());
    const files = Object.entries(result.data);
    
    // Calculate statistics
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, [, content]) => sum + content.length, 0);
    const totalLines = files.reduce((sum, [, content]) => sum + content.split('\n').length, 0);
    const processTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`${colors.info('Processed')} ${colors.number(totalFiles)} ${colors.info('files in')} ${colors.number(processTime + 's')}`);
    
    // File extensions
    const extensions = {};
    files.forEach(([file]) => {
      const ext = path.extname(file) || 'no extension';
      extensions[ext] = (extensions[ext] || 0) + 1;
    });
    
    // Build output with enhanced formatting
    const output = `${colors.brand.bold('📊 Project Statistics')}
${colors.path('━'.repeat(20))}

${colors.info('📁 Total files:')} ${colors.number(totalFiles)}
${colors.info('💾 Total size:')} ${colors.size(formatBytes(totalSize))}
${colors.info('🔤 Lines of code:')} ${colors.number(totalLines.toLocaleString())}
${result.skipped > 0 ? `${colors.warning('⚠️  Skipped files:')} ${colors.number(result.skipped)}\n` : ''}
${colors.brand.bold('File Types:')}
${Object.entries(extensions)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 8)
  .map(([ext, count]) => {
    const percentage = ((count / totalFiles) * 100).toFixed(1);
    return `  ${colors.filename(ext.padEnd(8))} ${colors.number(count.toString().padStart(2))} files ${colors.percentage('(' + percentage + '%)')}`;
  }).join('\n')}

${colors.brand.bold('Top 5 Largest Files:')}
${files
  .map(([file, content]) => [file, content.length])
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .map(([file, size]) => `  ${colors.filename(file.padEnd(30))} ${colors.size(formatBytes(size))}`)
  .join('\n')}`;
    
    console.log(output);
    copyToClipboard(output);
    console.log(`\n${colors.success('✅ Project statistics copied to clipboard!')} ${colors.brand('Perfect for project overview')} ✨`);
    
  } catch (error) {
    console.error(`${colors.errorIcon} ${colors.error('Error:')} ${error.message}`);
    console.log(`💡 Make sure you're in a valid project directory`);
    process.exit(1);
  }
}