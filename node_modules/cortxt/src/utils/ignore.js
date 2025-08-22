const defaultIgnore = ["node_modules", ".git", "dist", "build"];
const ignoreFiles = ["package-lock.json", "yarn.lock"];

export function shouldIgnore(fullPath, fileName) {
  return (
    defaultIgnore.some(rule => fullPath.includes(rule)) ||
    ignoreFiles.includes(fileName)
  );
}
