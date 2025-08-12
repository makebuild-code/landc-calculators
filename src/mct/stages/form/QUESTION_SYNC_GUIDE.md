# Question Sync Guide

## Overview

The QuestionFactory and QuestionRegistry work together to automatically synchronize questions with the same `initialName` across different contexts (main form and sidebar).

## How It Works

1. **Question Registration**: When a question is created via `QuestionFactory.create()`, it's automatically registered in the QuestionRegistry using its `initialName` as the key.

2. **Auto-Sync Setup**: The factory sets up event listeners on each question to listen for `QUESTION_CHANGED` events.

3. **Value Synchronization**: When a question value changes, all other questions with the same `initialName` are automatically updated.

## Usage Example

```typescript
// Creating questions in main form
const mainQuestions = document.querySelectorAll('[data-group="residential"] [data-form-question]');
mainQuestions.forEach((element, index) => {
  QuestionFactory.create(element as HTMLElement, {
    groupName: 'residential',
    indexInGroup: index,
    source: 'main',
    onChange: () => console.log('Main question changed'),
    onEnter: () => console.log('Enter pressed in main'),
  });
});

// Creating questions in sidebar
const sidebarQuestions = document.querySelectorAll('[data-sidebar] [data-form-question]');
sidebarQuestions.forEach((element, index) => {
  QuestionFactory.create(element as HTMLElement, {
    groupName: 'residential',
    indexInGroup: index,
    source: 'sidebar',
    onChange: () => console.log('Sidebar question changed'),
    onEnter: () => console.log('Enter pressed in sidebar'),
  });
});
```

## Key Points

1. **Automatic Sync**: Questions with the same `initialName` automatically sync across contexts
2. **No Manual Setup**: Just use `QuestionFactory.create()` and sync happens automatically
3. **Registry Access**: Use `QuestionRegistry.getInstance()` to query questions
4. **Debug Info**: Call `QuestionRegistry.getInstance().getDebugInfo()` to see all registered questions

## Debugging

Enable console logging to see sync activity:
- `[QuestionFactory] Setting up auto-sync for question: PropertyPrice`
- `[QuestionFactory] Question changed: PropertyPrice`
- `[QuestionFactory] Found 2 questions with same name`
- `[QuestionFactory] Syncing value to question in sidebar context`

## Cleanup

When destroying questions, use `QuestionFactory.destroy()` to properly clean up event listeners and registry entries.