import chalk from "chalk";

// Brand colors and styles
export const colors = {
  // Brand
  brand: chalk.hex('#6366f1'), // Indigo
  logo: chalk.hex('#6366f1').bold,
  
  // Success states
  success: chalk.green.bold,
  checkmark: chalk.green('✅'),
  
  // Info states  
  info: chalk.cyan,
  scanning: chalk.cyan('🔍'),
  folder: chalk.blue('📁'),
  file: chalk.gray('📄'),
  
  // Warning states
  warning: chalk.yellow.bold,
  warningIcon: chalk.yellow('⚠️'),
  
  // Error states
  error: chalk.red.bold,
  errorIcon: chalk.red('❌'),
  
  // Stats and numbers
  number: chalk.magenta.bold,
  size: chalk.cyan,
  percentage: chalk.yellow,
  
  // Code and paths
  code: chalk.gray,
  path: chalk.dim,
  filename: chalk.white.bold,
  
  // Decorative
  separator: chalk.gray('━'.repeat(20)),
  bullet: chalk.dim('•'),
  arrow: chalk.dim('→'),
  
  // Progress
  progressFilled: chalk.green('▓'),
  progressEmpty: chalk.gray('░'),
};

// Helper functions for common UI patterns
export const ui = {
  // Headers
  header: (text) => colors.brand.bold(`\n🧠 ${text}\n`),
  
  // Success messages
  success: (text) => `${colors.checkmark} ${colors.success(text)}`,
  
  // Info messages
  info: (text) => `${colors.scanning} ${colors.info(text)}`,
  
  // Warning messages  
  warning: (text) => `${colors.warningIcon} ${colors.warning(text)}`,
  
  // Error messages
  error: (text) => `${colors.errorIcon} ${colors.error(text)}`,
  
  // File stats
  fileCount: (count) => `${colors.file} ${colors.number(count)} files`,
  fileSize: (size) => colors.size(`(${size})`),
  
  // Progress bar
  progress: (current, total, width = 20) => {
    const progress = current / total;
    const filled = Math.round(progress * width);
    const empty = width - filled;
    const percentage = Math.round(progress * 100);
    
    return `[${colors.progressFilled.repeat(filled)}${colors.progressEmpty.repeat(empty)}] ${colors.percentage(percentage + '%')}`;
  },
  
  // Separator
  separator: () => colors.separator,
  
  // Tips
  tip: (text) => colors.info(`💡 ${text}`),
  
  // File tree formatting
  treeItem: (icon, name, isLast = false) => {
    const connector = isLast ? '└── ' : '├── ';
    return `${colors.path(connector)}${icon} ${colors.filename(name)}`;
  },
  
  // Stats formatting
  stat: (label, value, unit = '') => {
    return `${colors.path('  ')}${colors.code(label.padEnd(15))} ${colors.number(value)} ${colors.dim(unit)}`;
  }
};