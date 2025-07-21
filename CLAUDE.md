# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Primary Development:**
- `pnpm dev` - Start development server with live reload on http://localhost:3000
- `pnpm build` - Build for production to `dist/` directory
- `pnpm install` - Install dependencies (uses pnpm, not npm)

**Code Quality:**
- `pnpm lint` - Run ESLint and Prettier checks
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm check` - TypeScript type checking without emitting files
- `pnpm format` - Format code with Prettier

**Testing:**
- `pnpm test` - Run Playwright tests
- `pnpm test:ui` - Run Playwright tests with UI
- `pnpm playwright install` - Install browser dependencies for testing

**Development Workflow Scripts:**
- `pnpm feature` - Create feature branch
- `pnpm bug` - Create bug fix branch  
- `pnpm commit` - Interactive commit helper
- `pnpm push:branch` - Push current branch
- `pnpm merge:into` - Merge branch helper

## Architecture Overview

This is a **Webflow-integrated TypeScript application** built on the Finsweet Developer Starter template. The codebase powers API-driven components for a mortgage/lending calculator tool (MCT).

### Core Structure

**Entry Point:** `src/index.ts` initializes all modules when Webflow loads:
- `bestbuys` - Best buy recommendations
- `calculators` - Calculation widgets  
- `components` - Shared UI components
- `costofdoingnothing` - Cost analysis tools
- `mct` - **Main MCT system** (Mortgage Calculator Tool)

### MCT System Architecture

The MCT (Mortgage Calculator Tool) is the primary feature with a sophisticated component-based architecture:

**Core Manager:** `MCTManager` in `src/mct/shared/MCTManager.ts` orchestrates:
- **State Management** - Centralized state with persistence
- **Stage Management** - Multi-stage user flow (Questions → Results → Appointment)
- **API Integration** - Multiple API clients for different services
- **Event System** - Global event bus for component communication

**Three-Stage Flow:**
1. **Questions Stage** (`src/mct/stages/form/`) - Form inputs and validation
2. **Results Stage** (`src/mct/stages/results/`) - Product recommendations
3. **Appointment Stage** (`src/mct/stages/appointment/`) - Booking system

**Component System:** Modern component architecture in `src/mct/shared/components/`:
- `BaseComponent` - Lifecycle management, DOM utilities
- `InteractiveComponent` - Event handling, cleanup
- `StatefulComponent` - State management with change detection
- Global event bus for decoupled component communication

### Key Systems

**State Management:** 
- `StateManager` - Centralized state with persistence
- `CalculationManager` - Calculation logic and caching
- `VisibilityManager` - Dynamic UI visibility control

**API Layer:** Multiple specialized API clients in `src/mct/shared/api/methods/`:
- `ProductsAPI` - Product recommendations
- `LendersAPI` - Lender information
- `CreateLeadAndBookingAPI` - Lead generation
- `LogUserEventsAPI` - Analytics and tracking

**TypeScript Configuration:**
- Path aliases configured for clean imports (e.g., `$mct/api`, `$utils/*`)
- Strict TypeScript with comprehensive type definitions in `src/mct/shared/types/`

### Build System

**esbuild-based** with configuration in `bin/build.js`:
- Development: Watch mode with live reload
- Production: Minified, optimized bundles
- Single entry point builds to `dist/index.js`

### Testing Strategy

**Playwright** for end-to-end testing:
- Test files in `/tests/` directory
- Development server automatically starts during tests
- Component testing utilities available in browser console

### Development Notes

**Webflow Integration:** Components initialize via `window.Webflow.push()` callback
**Persistence:** State automatically persists to localStorage with `LANDC_MCT_` prefix
**Debug Tools:** Event bus and component testing available in browser console on MCT pages
**Git Workflow:** Uses feature/bug branch workflow with helper scripts

### Important Patterns

- Use path aliases for imports (configured in tsconfig.json)
- Components communicate via global event bus, not direct method calls
- State changes trigger automatic recalculation and UI updates
- All API calls go through centralized client with error handling
- TypeScript types are comprehensive - leverage them for development