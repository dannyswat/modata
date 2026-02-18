# Modata

A visual data modeling diagram tool for React. Create entity-relationship diagrams with an intuitive drag-and-drop interface.

## Features

- 🎨 Interactive entity-relationship diagram editor
- 🔄 Multiple relationship types (1:1, 1:N, N:M)
- 📦 Sub-entities and enum types support
- 🎯 Auto-layout with configurable directions
- 💾 Import/Export schemas (JSON, PNG, SVG)
- 🎨 Customizable entity colors
- 📱 Responsive and touch-friendly
- 💪 TypeScript support

## Installation

```bash
npm install modata
# or
yarn add modata
# or
pnpm add modata
```

## Usage

```tsx
import { ModataCanvas } from 'modata';
import 'modata/styles.css';
import '@xyflow/react/dist/style.css';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ModataCanvas />
    </div>
  );
}
```

## API

### ModataCanvas

The main component that renders the entire diagram editor with sidebar controls.

```tsx
<ModataCanvas />
```

### Hooks

#### useDiagramStore

Access the diagram state and actions:

```tsx
import { useDiagramStore } from 'modata';

function MyComponent() {
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const addEntity = useDiagramStore((s) => s.addEntity);
  
  // Add entity programmatically
  const handleAdd = () => {
    addEntity({ x: 100, y: 100 });
  };
  
  return <button onClick={handleAdd}>Add Entity</button>;
}
```

### Utilities

#### Auto Layout

```tsx
import { autoLayout } from 'modata';

const layoutedNodes = autoLayout(nodes, edges, 'TB'); // 'TB' or 'LR'
```

#### Export

```tsx
import { exportPng, exportSvg, exportSchemaJSON } from 'modata';

// Export as PNG
await exportPng('my-diagram.png', nodes);

// Export as SVG
await exportSvg('my-diagram.svg', nodes);

// Export schema as JSON
const schema = useDiagramStore.getState().toDiagramSchema();
exportSchemaJSON(schema);
```

#### Persistence

```tsx
import { 
  saveDiagram, 
  loadDiagram, 
  listSavedDiagrams 
} from 'modata';

// Save to localStorage
saveDiagram(schema);

// Load from localStorage
const loaded = loadDiagram('diagram-name');

// List all saved diagrams
const diagrams = listSavedDiagrams();
```

## Types

### Field Types

- Primitive: `int`, `uuid`, `decimal`, `string`, `boolean`, `date`, `datetime`
- Enum: Custom enums with user-defined options
- Sub-entity: Nested entity definitions

### Relationship Types

- **1:1** (One-to-One)
- **1:N** (One-to-Many) - Direction can be swapped
- **N:M** (Many-to-Many)

## Development

```bash
# Install dependencies
npm install

# Run demo app
npm run dev

# Build library
npm run build:lib

# Build demo
npm run build
```

## Publishing to NPM

To publish this package to npm:

1. **Build the library**:
   ```bash
   npm run build:lib
   ```

2. **Update version** in `package.json` (following [semver](https://semver.org/)):
   ```bash
   npm version patch  # or minor, or major
   ```

3. **Login to npm** (if not already logged in):
   ```bash
   npm login
   ```

4. **Publish**:
   ```bash
   npm publish
   ```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
