# Cortxt 🧠 - AI Context Provider

![Cortxt Banner](https://ik.imagekit.io/1ukuaaqqhl/cortxt2.png?updatedAt=1755861293199)

**The fastest way to provide project context to AI intelligence.**

AI-friendly CLI that instantly transforms your codebase into perfectly formatted context for ChatGPT, Claude, and any AI assistant.

## ⚡ Quick Start

```bash
# Get your entire project ready for AI in seconds
npx cortxt context

# Focus on a specific file  
npx cortxt file src/index.js

# Extract the folder structure
npx cortxt tree

# Extract just the dependencies
npx cortxt deps

# Give you cortxt quick commands list
npx cortxt list
```

## 🚀 Installation

```bash
npm install cortxt
```

## 🎯 Commands

### `npx cortxt context`
**📁 Extract full project** - All files & code, AI-optimized formatting with smart filtering

```bash
npx cortxt context                    # Complete project context (smart filtering)
npx cortxt context --force            # Include ALL files, bypass smart filtering
npx cortxt context --max-size 800     # Set custom size limit (KB)
npx cortxt context --verbose          # Show detailed scanning info
npx cortxt context --stats            # Display project statistics
```

### `npx cortxt file <filepath>`
**📄 Extract single file** - Perfect for focused AI assistance

```bash
npx cortxt file src/app.js      # Single file extraction
npx cortxt file README.md --lines  # Include line numbers
```

### `npx cortxt deps`
**📦 Extract dependencies** - Package info for AI analysis

```bash
npx cortxt deps                 # All dependencies
npx cortxt deps --dev-only      # Development dependencies only
npx cortxt deps --prod-only     # Production dependencies only
```

### `npx cortxt tree`
**🌲 Project structure** - Visual folder hierarchy

```bash
npx cortxt tree                 # Show project structure
npx cortxt tree --depth 5       # Custom depth level
```

### `npx cortxt stats`
**📊 Project statistics** - Complete project analysis

```bash
npx cortxt stats               # Files, lines, size breakdown
```

## ✨ What Makes Cortxt Special

**Cortxt** is the **ultimate AI context provider** that:

- 🧠 **AI-optimized formatting** - Perfect markdown structure every time
- 📋 **Instant clipboard copying** - Zero friction workflow
- 🎯 **Smart file filtering** - Ignores `node_modules`, `.git`, binaries automatically  
- 🤖 **Intelligent large project handling** - Auto-prioritizes important files for massive codebases
- 🚀 **Lightning fast scanning** - Process entire projects in seconds
- 💡 **Intelligent suggestions** - Context-aware help based on your project
- 🔍 **Project type detection** - Recognizes React, Next.js, Vue, Node.js, Python, Rust, Go
- ⚡ **Zero configuration** - Works instantly with any project type

## 🧠 Smart Large Project Handling

Cortxt automatically detects large projects (>500KB) and applies intelligent optimization:

### **Priority File Selection**
- **Core files first**: `package.json`, `README.md`, main entry points
- **Smart truncation**: Large files are safely truncated while preserving structure
- **Customizable limits**: Use `--max-size <kb>` to control total size
- **Force override**: Use `--force` to include everything regardless of size

### **Example: Large Project**
```bash
# Smart filtering (default for large projects)
npx cortxt context
# → 🧠 Smart processing for large project...
# → ✅ Processed 15 priority files (380KB) in 1.2s
# → 📊 Original: 247 files (2.1MB)

# Include everything
npx cortxt context --force
# → ✅ Processed 247 files (2.1MB) in 3.8s

# Custom size limit
npx cortxt context --max-size 600
# → Allows up to 600KB of content
```

## 📋 Perfect AI-Ready Output

Cortxt formats your code exactly how AI assistants expect it:

````markdown
### src/index.js
```javascript
function hello() {
  console.log("Hello World!");
}
```

### package.json
```json
{
  "name": "my-project",
  "version": "1.0.0"
}
```
````

## 🎨 Advanced Options

### **Context Command**
- `--force` - Include all files, bypass smart filtering
- `--max-size <kb>` - Maximum total size in KB (default: 400)
- `--verbose` - Detailed scanning information
- `--stats` - Complete project statistics

### **Other Commands**
- `--help` - Cortxt help box open
- `--lines` - Include line numbers for debugging
- `--dev-only` - Development dependencies only
- `--prod-only` - Production dependencies only  
- `--depth <n>` - Tree display depth (default: 3)

## 🔥 Power User Workflows

### **AI Code Review Workflow**
```bash
npx cortxt context
# → Paste into ChatGPT/Claude
# → "Please review this codebase for best practices"
```

### **Debugging Specific Issues**
```bash
npx cortxt file src/components/Header.jsx
# → Paste into AI with error message
# → Get instant solutions
```

### **Large Codebase Analysis**
```bash
# Get essential files only
npx cortxt context

# Get complete codebase (if needed)
npx cortxt context --force

# Focus on specific file
npx cortxt file src/core/engine.js
```

### **Architecture Planning**  
```bash
npx cortxt tree && npx cortxt deps
# → Share project structure + dependencies
# → Get architectural recommendations
```

### **Code Documentation**
```bash
npx cortxt context --stats
# → AI generates comprehensive project documentation
```

## 🌟 Key Features

- **🧠 AI-first design** - Built specifically for AI interactions
- **⚡ Instant results** - No waiting, no loading screens
- **🎯 Smart filtering** - Only includes relevant files
- **🤖 Large project optimization** - Handles massive codebases intelligently
- **🎨 Enhanced terminal colors** - Beautiful, modern CLI experience
- **📱 Universal compatibility** - Works with any project, any AI
- **🔒 Privacy focused** - Everything runs locally
- **📦 Lightweight** - Fast and efficient

## 💻 System Requirements

- **Node.js 14+** - Modern JavaScript runtime
- **npm** - Package manager

## 🚧 Coming Soon

- **📊 Advanced analytics** - Deeper project insights  
- **⚙️ Custom ignore patterns** - Fine-tune what gets included
- **🔌 IDE integrations** - VS Code, WebStorm support
- **☁️ Cloud sync** - Share contexts across devices
- **🎯 AI-specific presets** - Optimized contexts for different AI models

## 🤝 Perfect For

- **AI-assisted development** - ChatGPT, Claude, GitHub Copilot
- **Large codebase analysis** - Enterprise and open-source projects
- **Code reviews** - Share context with team members
- **Documentation** - Generate docs from your codebase  
- **Debugging** - Get AI help with complex issues
- **Learning** - Understand new codebases quickly

## 📈 Performance

- **Small projects (<100KB)**: Instant processing
- **Medium projects (100KB-500KB)**: ~1-2 seconds
- **Large projects (>500KB)**: Smart filtering keeps it under 3 seconds
- **Enterprise codebases**: Priority files only, blazing fast

---

**Cortxt 🧠** - *Your AI coding companion. Context made simple.*

**Ready to 10x your AI-assisted development?** → `npx cortxt context`