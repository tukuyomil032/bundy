# Bundy - Package Dependency Visualizer

A lightweight, browser-based tool to visualize package dependencies from `package.json` and lockfiles. Bundy supports all major package managers and provides interactive tree and mind-map views.

## Features

- **Multi-lockfile Support**: Parses npm, Yarn (v1 & v2 Berry), and pnpm lockfiles
- **Dual Visualization**: 
  - **Tree View**: Hierarchical tree structure with expand/collapse
  - **Mind Map View**: D3.js-based interactive graph visualization with zoom and pan
- **GitHub Integration**: Fetch and analyze packages directly from public GitHub repositories
- **Local File Upload**: Drag-and-drop or manual file selection for offline analysis
- **Advanced Filtering**:
  - Search by package name (incremental)
  - Filter by dependency type (dependencies, devDependencies, peerDependencies, optionalDependencies)
  - Adjustable visibility depth
- **Dependency Analysis**:
  - Automatic circular dependency detection
  - Duplicate version detection
  - Direct dependency count per package
  - Dependency path visualization
- **Export**: Download analysis results as JSON
- **Privacy-First**: All processing happens in the browser—no data is sent to external servers

## Tech Stack

- Vue3 
- TypeScript
- Vite
- Tailwind CSS 

## Supported Package Managers

| Manager | Lockfile | Version Support |
|---------|----------|-----------------|
| npm     | `package-lock.json` | v1, v2, v3 |
| Yarn    | `yarn.lock` | v1 (classic), v2+ (Berry) |
| pnpm    | `pnpm-lock.yaml` | v5, v6, v9 |
| Bun     | `bun.lock` | v1.2+ (text format) |

> **Note:** Bun v1.2+ uses the text-based `bun.lock` format. The older binary `bun.lockb` format is not supported (use `bun install --save-text-lockfile` to generate `bun.lock`).

## Installation & Usage

### Option 1: Live Demo
Visit the [live web app](https://bundy-sand.vercel.app/#/) (if deployed) to start visualizing immediately.

### Option 2: Local Development

```bash
git clone https://github.com/tukuyomil032/bundy.git
cd bundy
pnpm install
pnpm run dev
```

Then open `http://localhost:5173` in your browser.

### Option 3: Build & Deploy

```bash
pnpm run build
```

The `dist/` folder contains static files ready for deployment to Vercel, GitHub Pages, or any static hosting service.

## Usage Guide

### Getting Started

1. **Home Page**: Choose your input method
   - **Local Upload**: Drag and drop `package.json` + optional lockfile
   - **GitHub**: Enter a public repository URL or `owner/repo` format

2. **Analysis Page**: Explore the dependency tree
   - **Switch Views**: Use the Tree/Map toggle in the header
   - **Search**: Type a package name to filter results
   - **Filter**: Toggle dependency types (dep/dev/peer/opt)
   - **Adjust Depth**: Use the depth slider to limit tree expansion
   - **Click Nodes**: Select a package to view details in the side panel

3. **Tree View**
   - Click the expand icon (▾/▸) to toggle child visibility
   - Badges show the number of hidden children when collapsed
   - Circular dependencies are marked with ↺

4. **Mind Map View**
   - Scroll to zoom in/out (5% to 300%)
   - Drag to pan across the visualization
   - Click "Center" to reset to initial position
   - Adjust depth slider to control tree expansion
   - Icons: ↺ = circular dependency, +N = hidden children

5. **Export**: Click "↓ JSON" to save analysis results

## Security Considerations

- **No data transmission**: All processing occurs locally in your browser
- **GitHub API read-only**: Only fetches public repository content
- **Input validation**: Package names and versions are validated before display
- **Safe parsing**: Uses standard JSON/YAML parsers with error handling
- **XSS protection**: Vue's template escaping and D3's text methods prevent HTML injection

## Project Structure

```
src/
├── components/
│   ├── DetailPanel.vue          # Selected node information panel
│   ├── FilterBar.vue            # Search & filter controls
│   ├── InputPanel/
│   │   ├── LocalUpload.vue      # Drag-drop file uploader
│   │   └── GitHubInput.vue      # GitHub URL input form
│   ├── MindMap/
│   │   └── MindMapView.vue      # D3.js interactive graph
│   └── Tree/
│       ├── TreeNode.vue         # Recursive tree node component
│       └── TreeView.vue         # Tree container with controls
├── parsers/
│   ├── npm.ts                   # npm lockfile parser
│   ├── yarn.ts                  # Yarn lock parser
│   ├── pnpm.ts                  # pnpm-lock.yaml parser
│   └── index.ts                 # Parser orchestration & tree builder
├── services/
│   └── github.ts                # GitHub file fetching service
├── stores/
│   └── analysis.ts              # Pinia store for analysis state
├── types/
│   └── index.ts                 # TypeScript type definitions
├── views/
│   ├── HomeView.vue             # Landing / input page
│   └── AnalysisView.vue         # Analysis & visualization page
├── router.ts                     # Vue Router configuration
├── main.ts                       # Application entry point
└── style.css                     # Global styles & CSS variables
```

## Development

### Available Scripts

```bash
pnpm run dev          # Start development server (Vite)
pnpm run build        # Build for production
pnpm run preview      # Preview production build locally
pnpm run lint-dry     # Check code with ESLint
pnpm run format       # Format code with Prettier
pnpm run format:check # Check formatting without changes
```
## Performance

- Tree rendering: < 100ms for typical projects
- Mind map rendering: < 500ms (depends on D3 layout calculation)
- File upload parsing: < 1s for most lockfiles
- All visualizations update reactively as you filter

## License

MIT License

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Questions?** Create an issue or reach out via GitHub.

Made with 💚 by [tukuyomil032](https://github.com/tukuyomil032)
