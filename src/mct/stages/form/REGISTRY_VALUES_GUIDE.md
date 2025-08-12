# QuestionRegistry getValues() Guide

## Overview

The `getValues()` method in QuestionRegistry provides a performant way to extract question values with flexible filtering options. This is useful for different journeys and use cases where you need specific subsets of form data.

## Basic Usage

```typescript
import { QuestionRegistry } from './QuestionRegistry';

const registry = QuestionRegistry.getInstance();

// Get all visible question values
const visibleValues = registry.getValues({ visibleOnly: true });

// Get only valid questions from main form
const mainFormValues = registry.getValues({ 
  context: 'main',
  validOnly: true 
});
```

## Filtering Options

### GetValuesOptions Interface

```typescript
interface GetValuesOptions {
  context?: 'main' | 'sidebar';      // Filter by context
  visibleOnly?: boolean;             // Only visible questions
  validOnly?: boolean;               // Only valid questions
  requiredOnly?: boolean;            // Only required questions
  groupName?: GroupNameENUM;         // Filter by group
  includeNames?: InputKeysENUM[];    // Include specific questions
  excludeNames?: InputKeysENUM[];    // Exclude specific questions
  useFinalNames?: boolean;           // Use final names as keys
}
```

## Common Use Cases

### 1. Form Submission
Get all visible and valid questions from the main form:

```typescript
const submitData = registry.getValues({
  context: 'main',
  visibleOnly: true,
  validOnly: true
});
```

### 2. Sidebar Save
Get all valid questions from the sidebar:

```typescript
const sidebarData = registry.getValues({
  context: 'sidebar',
  validOnly: true
});
```

### 3. Group-Specific Values
Get values from a specific group:

```typescript
const residentialData = registry.getValues({
  groupName: GroupNameENUM.Residential,
  visibleOnly: true
});
```

### 4. Journey-Specific Fields
Include only specific fields for a journey:

```typescript
const purchaseJourneyData = registry.getValues({
  includeNames: [
    InputKeysENUM.PropertyPrice,
    InputKeysENUM.LoanAmount,
    InputKeysENUM.DepositAmount,
    InputKeysENUM.LoanType
  ],
  validOnly: true
});
```

### 5. Exclude Sensitive Fields
Get all values except certain fields:

```typescript
const publicData = registry.getValues({
  visibleOnly: true,
  excludeNames: [
    InputKeysENUM.PhoneNumber,
    InputKeysENUM.Email,
    InputKeysENUM.FullName
  ]
});
```

## Using Presets

For common scenarios, use the `getValuesByPreset()` method:

```typescript
// Preset options
type PresetName = 'formSubmit' | 'sidebarSave' | 'allVisible' | 'allValid';

// Examples
const submitValues = registry.getValuesByPreset('formSubmit');
const sidebarValues = registry.getValuesByPreset('sidebarSave');

// With additional options
const residentialSubmit = registry.getValuesByPreset('formSubmit', {
  groupName: GroupNameENUM.Residential
});
```

### Available Presets

1. **formSubmit**: Main context, visible and valid only
2. **sidebarSave**: Sidebar context, valid only
3. **allVisible**: All visible questions
4. **allValid**: All valid questions

## Performance Considerations

1. **Single Iteration**: The method uses a single pass through all questions
2. **O(1) Lookups**: Include/exclude lists are converted to Sets
3. **Early Returns**: Filters are checked in order of performance impact
4. **No Duplicates**: Processed names are tracked to prevent overwrites

## Integration Examples

### With MCTManager

```typescript
// Replace direct answer access
const oldWay = MCTManager.getAnswers();

// With filtered access
const newWay = QuestionRegistry.getInstance().getValues({
  visibleOnly: true,
  validOnly: true
});
```

### With API Calls

```typescript
async function submitForm() {
  const registry = QuestionRegistry.getInstance();
  
  // Get only valid, visible values for submission
  const formData = registry.getValues({
    context: 'main',
    visibleOnly: true,
    validOnly: true
  });
  
  // Send to API
  await api.submitAnswers(formData);
}
```

### With Calculations

```typescript
function calculateLTV() {
  const registry = QuestionRegistry.getInstance();
  
  // Get specific fields needed for calculation
  const values = registry.getValues({
    includeNames: [
      InputKeysENUM.PropertyPrice,
      InputKeysENUM.LoanAmount
    ],
    validOnly: true
  });
  
  if (values.PropertyPrice && values.LoanAmount) {
    return (values.LoanAmount / values.PropertyPrice) * 100;
  }
  return null;
}
```

## Best Practices

1. **Use Specific Filters**: More filters = better performance
2. **Leverage Presets**: Use presets for common scenarios
3. **Cache Results**: If using the same filters multiple times
4. **Validate First**: Use `validOnly: true` to ensure data quality

## Debugging

Use `getDebugInfo()` to understand the registry state:

```typescript
const debug = registry.getDebugInfo();
console.log('Total questions:', debug.totalInstances);
console.log('Unique questions:', debug.uniqueQuestions);
console.log('Question map:', debug.questionMap);
```