# Form Refactoring Plan: Event Bus & Stateful Components

## Current Architecture Analysis

### Pain Points

1. **Tight Coupling**: Multiple manager layers (MainFormManager, FormManager, GroupsManager) creating complex dependencies
2. **Limited Reusability**: Questions component tightly bound to form context, preventing reuse in results sidebar
3. **State Management**: State scattered across multiple managers without clear separation of concerns
4. **Event Flow**: Limited event-based communication, making cross-component updates difficult
5. **Component Configuration**: StatefulComponent options/state setup is confusing and needs simplification

### Existing Infrastructure

- ✅ EventBus already implemented with TypeScript support
- ✅ StatefulComponent/StatefulInputGroup base classes available
- ✅ Form events defined (FormEventNames enum)
- ✅ Questions already partially using StatefulInputGroup
- ✅ MCTManager as central state store

## Requirements Update (Based on Feedback)

### Sidebar Functionality

- Already built in Webflow with same grouping/questions structure
- Different DOM selector but reuses question components
- No output group needed
- Different buttons and behavior patterns
- **Key**: Full editing capabilities with save-on-demand (not per-question)

### State Management

- Questions update locally until user hits save
- Save button syncs all changes to MCTManager at once
- Storage updated only on save action

## Proposed Architecture (Proper Refactoring)

### Phase 0: Improve Base Components (2-3 hours)

#### 0.1 Restructure Component Hierarchy

```typescript
// Base level - Pure DOM manipulation, no events
interface BaseComponentConfig {
  element: HTMLElement;
  debug?: boolean;
}

// Interactive level - Adds all event handling (DOM + app events)
interface InteractiveComponentConfig extends BaseComponentConfig {
  autoBindEvents?: boolean;
  eventNamespace?: string;
}

// Stateful level - Adds state management
interface StatefulComponentConfig<TState> extends InteractiveComponentConfig {
  initialState: TState;
  persistState?: boolean;
}

// Move EventBus from BaseComponent to InteractiveComponent
abstract class InteractiveComponent extends BaseComponent {
  protected eventBus: EventBus; // <-- Moved here

  protected emit<T extends EventName>(event: T, payload: AllEvents[T]): void;
  protected on<T extends EventName>(event: T, handler: TypedEventHandler<T>): () => void;
}
```

#### 0.2 Enhanced Component Features

- **BaseComponent**: Add `isVisible()`, `getBoundingClientRect()`, `scrollIntoView()` wrappers
- **InteractiveComponent**: Add keyboard helpers (`isEnterKey()`, `isEscapeKey()`), focus management
- **StatefulComponent**: Add state validation hooks, batch updates, optional localStorage persistence

### Phase 1: Event-Driven Question Components (3-4 hours)

#### 1.1 Extend Event Types

```typescript
enum FormEventNames {
  // Enhanced existing events (keeping same names)
  QUESTION_CHANGED = 'form:question:changed', // Enhanced payload
  QUESTION_REQUIRED = 'form:question:required', // Used for visibility
  QUESTION_UNREQUIRED = 'form:question:unrequired', // Used for hiding

  // New events for cross-form communication
  QUESTIONS_SAVE_REQUESTED = 'form:questions:save:requested',
  QUESTIONS_SYNC_REQUESTED = 'form:questions:sync:requested',
  // ... existing events
}

interface FormEvents {
  // Enhanced payload for existing event
  [FormEventNames.QUESTION_CHANGED]: {
    question: QuestionComponent;
    questionId: string;
    groupName: string;
    value: InputValue;
    source: 'main' | 'sidebar';
  };

  // New sync events
  [FormEventNames.QUESTIONS_SYNC_REQUESTED]: {
    targetQuestionId: string;
    value: InputValue;
    source: 'main' | 'sidebar';
  };
  // ... other events
}
```

#### 1.2 Refactor QuestionComponent

```typescript
class QuestionComponent extends StatefulInputGroup<QuestionState> {
  private questionId: string;
  private source: 'main' | 'sidebar';

  protected onInit(): void {
    // Generate unique ID for cross-context identification
    this.questionId = `${this.groupName}-${this.initialName}`;

    // Listen for sync requests
    this.on(FormEventNames.QUESTIONS_SYNC_REQUESTED, (event) => {
      if (event.targetQuestionId === this.questionId) {
        this.syncValue(event.value);
      }
    });
  }

  protected handleChange(): void {
    const value = this.getValue();
    this.setState({ value, isValid: this.isValid() });

    // Emit enhanced QUESTION_CHANGED event
    this.emit(FormEventNames.QUESTION_CHANGED, {
      question: this,
      questionId: this.questionId,
      groupName: this.groupName,
      value,
      source: this.source,
    });
  }
}
```

### Phase 2: Question Registry & Factory (2-3 hours)

#### 2.1 Question Registry

**Purpose**: Central catalog tracking all questions across the app (like a library catalog)

- Keeps track of questions in both main form and sidebar
- Enables finding questions by ID or group
- Allows cross-form communication

```typescript
class QuestionRegistry {
  private static instance: QuestionRegistry;
  private questions = new Map<string, Set<QuestionComponent>>();

  register(question: QuestionComponent): void {
    const id = question.getQuestionId();
    if (!this.questions.has(id)) {
      this.questions.set(id, new Set());
    }
    this.questions.get(id)!.add(question);
  }

  getByContext(questionId: string, context: 'main' | 'sidebar'): QuestionComponent | undefined {
    const questions = this.questions.get(questionId);
    if (!questions) return undefined;

    return Array.from(questions).find((q) => q.getSource() === context);
  }

  getAllByGroup(groupName: string): QuestionComponent[] {
    const results: QuestionComponent[] = [];
    this.questions.forEach((questionSet) => {
      questionSet.forEach((question) => {
        if (question.getGroupName() === groupName) {
          results.push(question);
        }
      });
    });
    return results;
  }
}
```

#### 2.2 Question Factory

**Purpose**: Consistent initialization of existing Webflow HTML elements

- Wraps existing HTML with JavaScript behavior (no HTML creation)
- Ensures consistent configuration
- Automatically registers questions

```typescript
class QuestionFactory {
  static create(
    element: HTMLElement, // <-- Existing Webflow element
    options: {
      groupName: string;
      indexInGroup: number;
      source: 'main' | 'sidebar';
    }
  ): QuestionComponent {
    // Wrap existing element with component behavior
    const question = new QuestionComponent({
      element, // Uses existing HTML, doesn't create new
      ...options,
      onChange: () => {}, // No-op, using events
      onEnter: () => {}, // No-op, using events
    });

    // Register for cross-form communication
    QuestionRegistry.getInstance().register(question);
    return question;
  }
}

// Usage example:
const webflowElement = document.querySelector('[data-question="property-price"]');
const question = QuestionFactory.create(webflowElement, {
  groupName: 'residential',
  indexInGroup: 0,
  source: 'main',
});
```

### Phase 3: Refactor Groups as Stateful Components (3-4 hours) ✅ COMPLETE

#### 3.1 Convert BaseGroup to StatefulComponent

**Implemented Changes:**

1. **BaseGroup now extends StatefulComponent**:
   - Added generic typing `BaseGroup<T extends GroupState>`
   - Proper state management with `GroupState` interface
   - Integrated with existing event system
   - Removed redundant abstract method declarations

2. **QuestionGroup refactored**:
   - Created `QuestionGroupState` interface with additional properties
   - Converted `activeQuestionIndex` to getter/setter pattern
   - Implemented `bindEvents()` for reactive updates
   - Added `updateGroupState()` for state synchronization

3. **OutputGroup refactored**:
   - Created `OutputGroupState` interface
   - Converted internal state to use StatefulComponent
   - Proper lifecycle methods (`onInit`, `bindEvents`)

```typescript
// Final implementation structure
export interface GroupState {
  isVisible: boolean;
  isActive: boolean;
  isComplete: boolean;
  name: GroupNameENUM | null;
  index: number;
}

export abstract class BaseGroup<T extends GroupState = GroupState> extends StatefulComponent<T> {
  protected formManager: FormManager;

  constructor(options: GroupOptions, initialState: T) {
    super(
      {
        element: options.element,
        debug: true,
        eventNamespace: `group-${initialState.name || 'unknown'}`,
      },
      initialState
    );
    
    this.formManager = options.formManager;
  }

  // Getters for common properties
  public get name(): GroupNameENUM | null {
    return this.state.name;
  }

  public get index(): number {
    return this.state.index;
  }

  public getIsVisible(): boolean {
    return this.state.isVisible;
  }
}

// QuestionGroup with proper state management
export interface QuestionGroupState extends GroupState {
  activeQuestionIndex: number;
  validQuestions: Set<string>;
  totalQuestions: number;
  completedQuestions: number;
}

export abstract class QuestionGroup extends BaseGroup<QuestionGroupState> {
  // activeQuestionIndex uses setter for cleaner API
  public get activeQuestionIndex(): number {
    return this.state.activeQuestionIndex;
  }

  public set activeQuestionIndex(value: number) {
    this.setState({ activeQuestionIndex: value });
  }

  // Reactive state updates
  private updateGroupState(): void {
    const validQuestions = new Set<string>();
    let completedQuestions = 0;
    let isComplete = true;

    this.questions.forEach((q) => {
      if (q.getQuestionId) {
        const questionId = q.getQuestionId();
        if (q.isValid()) {
          validQuestions.add(questionId);
          completedQuestions++;
        } else if (q.isRequired()) {
          isComplete = false;
        }
      }
    });

    this.setState({ 
      validQuestions, 
      completedQuestions,
      isComplete,
      totalQuestions: this.questions.length
    });

    // Emit group state change
    this.emit(FormEventNames.GROUP_COMPLETED, {
      groupId: this.state.name || '',
      answers: []  // TODO: Fix this - needs proper InputData[]
    });
  }
}
```

**Key Improvements:**
- Groups now have reactive state management
- Event-driven communication through EventBus
- Proper TypeScript typing throughout
- Lifecycle methods for better initialization
- State changes automatically tracked and subscribable
- Uses QuestionFactory for consistent initialization

### Phase 4: Implement Sidebar Manager (3-4 hours)

#### 4.1 Create SidebarFormManager

```typescript
class SidebarFormManager extends FormManager {
  private pendingChanges = new Map<string, InputValue>();
  private updateButton: HTMLButtonElement;

  public init(): void {
    super.init();

    // Initialize groups with sidebar context
    this.initializeGroups('sidebar');

    // Listen to main form question changes
    this.on(FormEventNames.QUESTION_CHANGED, (event) => {
      if (event.source === 'main') {
        this.syncQuestionFromMain(event);
      }
    });

    // Setup save button
    this.updateButton.addEventListener('click', () => {
      this.saveAllChanges();
    });
  }

  private syncQuestionFromMain(event: FormEvents[FormEventNames.QUESTION_CHANGED]): void {
    const sidebarQuestion = QuestionRegistry.getInstance().getByContext(event.questionId, 'sidebar');

    if (sidebarQuestion) {
      sidebarQuestion.setValue(event.value);
    }
  }

  private saveAllChanges(): void {
    const answerData: InputData[] = [];

    this.questions.forEach((question) => {
      if (question.isValid()) {
        answerData.push({
          key: question.getInitialName() as InputKey,
          name: question.getFinalName() as InputName,
          value: question.getValue() as InputValue,
          valid: true,
          location: 'sidebar',
          source: 'user',
        });
      }
    });

    // Save to MCTManager
    MCTManager.setAnswers(answerData);

    // Emit save event
    this.eventBus.emit(FormEventNames.ANSWERS_SAVED, {
      answers: answerData,
      source: 'sidebar',
    });

    // Sync back to main form
    this.syncToMainForm();
  }

  private syncToMainForm(): void {
    this.questions.forEach((question) => {
      this.eventBus.emit(FormEventNames.QUESTIONS_SYNC_REQUESTED, {
        targetQuestionId: question.getQuestionId(),
        value: question.getValue(),
        source: 'sidebar',
      });
    });
  }
}
```

### Phase 5: Update Initialization Flow (2-3 hours)

#### 5.1 Update Form Initialization

```typescript
// In initForm function
export function initForm(
  element: HTMLElement,
  options: { mode: 'main' | 'sidebar'; prefill: boolean }
): FormManager | null {
  if (options.mode === 'main') {
    const manager = new MainFormManager(element);
    manager.init();
    return manager;
  } else {
    const manager = new SidebarFormManager(element);
    manager.init();
    return manager;
  }
}
```

#### 5.2 Update Results Manager

```typescript
// In results/Manager.ts
class ResultsManager {
  private sidebar: SidebarFormManager | null = null;

  public init(): void {
    // Find sidebar element
    const sidebarElement = queryElement('[data-mct-sidebar]', this.component);
    if (sidebarElement) {
      this.sidebar = new SidebarFormManager(sidebarElement);
      this.sidebar.init();
    }

    // Listen for answer changes to update results
    this.eventBus.on(FormEventNames.ANSWERS_SAVED, (event) => {
      if (event.source === 'sidebar') {
        this.updateResults();
      }
    });
  }
}
```

## Implementation Timeline

| Phase     | Duration        | Description                                              | Status     |
| --------- | --------------- | -------------------------------------------------------- | ---------- |
| Phase 0   | 2-3 hours       | Improve base components (config layering, EventBus move) | Pending    |
| Phase 1   | 3-4 hours       | Event-driven questions                                   | ✅ Complete |
| Phase 2   | 2-3 hours       | Registry (catalog) & Factory (wrapper)                   | ✅ Complete |
| Phase 3   | 3-4 hours       | Stateful groups                                          | ✅ Complete |
| Phase 4   | 3-4 hours       | Sidebar implementation                                   | Pending    |
| Phase 5   | 2-3 hours       | Integration & testing                                    | Pending    |
| **Total** | **15-21 hours** | Full implementation                                      |            |

## Benefits

1. **Clean Architecture**: Clear separation of concerns with event-driven communication
2. **Reusability**: Questions work seamlessly in both contexts
3. **Maintainability**: Easier to add new features or modify behavior
4. **Type Safety**: Full TypeScript support with typed events
5. **Debugging**: Better event flow visibility and state tracking
6. **Performance**: Efficient updates through targeted event handling

## Migration Strategy

1. **Branch Strategy**: Create feature branch `feature/event-driven-forms`
2. **Incremental Changes**: Implement phases sequentially with tests
3. **Feature Flag**: Use environment variable to toggle between old/new
4. **Parallel Testing**: Run both implementations side-by-side
5. **Gradual Rollout**: Switch specific groups/questions incrementally

## Next Steps

1. Approve the 15-21 hour timeline for proper implementation
2. Start with Phase 0 to improve base components
3. Implement comprehensive tests for each phase
4. Document new patterns for team adoption
