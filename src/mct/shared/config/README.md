# MCT Configuration System

This directory contains the centralized configuration system for the MCT module.

## Structure

```
src/mct/shared/config/
├── index.ts              # Main export - combines all configs
├── api.ts               # API configuration (endpoints, timeouts, etc.)
├── storage.ts           # Storage configuration (persistence settings)
├── dom.ts              # DOM attributes and classes
├── components.ts        # Component-specific configurations
├── profiles.ts          # Profile definitions
└── environment.ts       # Environment detection and overrides
```

## Usage

### Import the full configuration

```typescript
import { MCT_CONFIG } from '$mct/config';

// Access any configuration
const apiTimeout = MCT_CONFIG.api.timeout;
const formAttributes = MCT_CONFIG.dom.attributes.form;
```

### Import specific configurations

```typescript
import { API_CONFIG, DOM_CONFIG } from '$mct/config';

// Use specific configs
const endpoints = API_CONFIG.endpoints;
const formAttr = DOM_CONFIG.attributes.form;
```

### Legacy compatibility

```typescript
import { PROFILES, ENDPOINTS } from '$mct/config';

// These are aliases for backward compatibility
const profiles = PROFILES; // Same as PROFILES_CONFIG
const endpoints = ENDPOINTS; // Same as API_CONFIG.endpoints
```

## Benefits

1. **Single Source of Truth** - All configuration in one place
2. **Type Safety** - Full TypeScript support
3. **Environment Management** - Easy environment-specific overrides
4. **Maintainability** - Organized by domain
5. **Backward Compatibility** - Legacy exports maintained

## Adding New Configuration

1. Create a new file in the config directory (e.g., `new-feature.ts`)
2. Export your configuration object
3. Import and add it to the main `MCT_CONFIG` in `index.ts`
4. Update the `MCTConfig` interface in `types/config.ts`

## Environment Overrides

The system automatically detects the environment:

- `development` - When `NODE_ENV === 'development'`
- `staging` - When not on production domain
- `production` - When on `www.landc.co.uk`

You can add environment-specific overrides in the respective config files.
