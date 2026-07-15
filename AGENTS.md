# Repository Guidelines

## Project Overview
Sketcher is a web-based interactive exercise application where users practice tracing geometric guides. It allows users to select different exercises (circles, ellipses, parallel lines, etc.), draw strokes on a canvas, and receive immediate scoring and feedback based on how closely their strokes match target curves.

## Architecture & Data Flow
- **Frontend Stack**: Vanilla TypeScript SPA with Vite, Tailwind CSS, and PostCSS.
- **UI Architecture**: Imperative DOM manipulation managed by a centralized `App` class in `src/main.ts`. UI components (Picker, Exercise, Overlay) are dynamically generated and destroyed.
- **Core Orchestration**:
  1. **Selection**: User picks an `ExerciseType`.
  2. **Template Generation**: `shapes/generateTemplate` constructs metadata and parameters.
  3. **Worksheet Management**: `worksheet/Worksheet` manages the interactive canvas, stroke collection, and layout state (undo, clear, active index).
  4. **Geometry Engine**: `geometry/` provides mathematical foundation for curves and point sampling.
  5. **Scoring Engine**: `scoring/` implements vector-based evaluation of user strokes against target curves.
  6. **Persistence**: Results and stats are synced to `localStorage` via `storage/historyStore.ts`.

## Key Directories
- `src/`: Primary source code.
  - `geometry/`: Math, curve sampling, and distance scoring.
  - `scoring/`: Scoring algorithms and vector evaluations.
  - `shapes/`: Exercise templates, rendering logic, and specific shape generators.
  - `storage/`: Persistence logic.
  - `worksheet/`: The "Engine" - manages canvas interaction, state, and layout.
  - `types.ts`: Shared TypeScript interfaces and discriminated unions.
- `tests/`: Unit and integration tests for geometry and shape generation.
- `ui/`: Frontend UI assets and components.

## Development Commands
- **Build**: `npm run build` (runs `tsc` then `vite build`).
- **Test**: `npm run test` (runs Vitest in a Node environment).
- **Dev**: `npm run dev` (starts Vite dev server).
- **Lint/Format**: Handled via `tsc` and standard Vite/Tailwind configurations.

## Code Conventions & Common Patterns
- **Type Safety**: Strict use of TypeScript interfaces and discriminated unions for `ExerciseParams` and `Template`.
- **Path Aliasing**: Use `@/` to reference the `src` directory.
- **Functional Geometry**: Geometry and scoring logic are "pure" functional code.
- **Stateful Class**: The `Worksheet` class encapsulates complex canvas state (active strokes, layout) while exposing a clean API.
- **Coordinate Systems**: Uses a "Canonical" coordinate system for math, scaled/offset to CSS dimensions at runtime.
- **Canvas Rendering**: Standard `requestAnimationFrame` loop with DPR correction for sharp rendering.
- **Error Handling**: Errors are treated as data (e.g., `PerPointError` objects) to provide visual feedback rather than throwing exceptions.
- **Styling**: Tailwind CSS utility classes with custom component layers (btn, panel) in `src/style.css`.
- **Async Patterns**: Minimal async usage; most logic is synchronous UI interaction.

## Important Files
- `src/main.ts`: Application entry point and UI controller.
- `src/types.ts`: Centralized type definitions.
- `src/storage/historyStore.ts`: Persistence layer.
- `src/worksheet/Worksheet.ts`: Core canvas engine.
- `vite.config.ts`: Build and alias configuration.
- `tsconfig.json`: TypeScript configuration (ES2022, strict mode).

## Runtime/Tooling Preferences
- **Runtime**: Node.js (for tests), Browser (for production).
- **Package Manager**: npm.
- **Tooling**: Vitest for testing, Vite for bundling, Tailwind CSS for styling.

## Testing & QA
- **Framework**: Vitest.
- **Strategy**: Domain-oriented testing for Shape Generation, Geometry Sampling, and Scoring.
- **Mocking**: Uses functional parameterization instead of explicit mock objects.
- **Key Checks**: Prioritizes mathematical correctness and boundary constraints (e.g., ensuring shapes remain within cell boundaries).
- **Environment**: Node.js environment for test execution.
