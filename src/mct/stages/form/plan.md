# Plan for the "Form" Stage

## 1. **Purpose of the Form Stage**

- The Form stage is responsible for collecting user input through a series of grouped questions.
- It determines the user's profile, collects all required answers, and prepares the data for the next stage (e.g., results).
- It manages navigation between groups of questions and handles conditional visibility and validation.

---

## 2. **Core Concepts and Structure**

### a. **Groups**

- The form is divided into "groups" (e.g., customer-identifier, profile-specific groups, output).
- Each group contains one or more questions.
- Groups are managed by classes: `BaseGroup`, `QuestionGroup`, `MainGroup`, and `OutputGroup`.

### b. **Questions**

- Each question is an instance of the `Question` class.
- Questions can have dependencies (only shown if certain answers are given).
- Each question handles its own validation, visibility, and state.

### c. **Form Manager**

- The `MainFormManager` class orchestrates the form, managing groups, navigation, and state.
- It tracks which group and question are currently active.

---

## 3. **How the Stage is Triggered**

- The form stage is initialized by calling `initForm(component, options)` (see `index.ts`).
- This creates a `MainFormManager` instance and sets up the form UI and logic.

---

## 4. **Step-by-Step Flow**

### a. **Initialization**

1. **Create the Form Manager**

   - Instantiate `MainFormManager` with the root form element.
   - Initialize references to all key DOM elements (header, navigation buttons, group containers, etc.).

2. **Create Groups**

   - For each group element in the DOM, instantiate either a `MainGroup` or `OutputGroup`.
   - The first group is shown; others are hidden.

3. **Create Questions**
   - For each group, instantiate `Question` objects for each question element.
   - Set up event handlers for change and enter events.

### b. **User Interaction**

4. **Navigation**

   - Next/Previous buttons allow moving between questions and groups.
   - Navigation is only enabled if the current question is valid.

5. **Conditional Visibility**

   - When answers change, update which questions and groups are visible.
   - Only show questions whose dependencies are satisfied.

6. **Validation**
   - Each question validates its input.
   - A group is considered "complete" if all required questions are valid.

### c. **Profile Determination**

7. **Profile Selection**
   - The form determines the user's profile based on their answers.
   - The profile affects which groups/questions are shown.

### d. **Transition to Next Stage**

8. **Output Group**
   - Once the profile group is complete, the output group is shown.
   - When the output group is complete, the form triggers a transition to the "results" stage (via `MCTManager.goToStage('results')`).

---

## 5. **Key Methods and Events**

- **Group Navigation:** `navigateToNextGroup()`, `navigateToPreviousGroup()`
- **Question Navigation:** `navigate('next' | 'prev')` in `MainGroup`
- **Visibility Updates:** `updateGroupVisibility()`, `updateActiveQuestions()`
- **Validation:** `isComplete()` on groups, `isValid()` on questions
- **Event Handling:** Listeners for button clicks, input changes, and custom navigation events

---

## 6. **Possible Triggers for the Stage**

- User lands on the form page/component.
- User completes a previous stage and is routed to the form.
- Application logic calls `initForm()` to start the form stage.

---

## 7. **What Needs to Happen and When**

| Step | Action                             | Responsible Class/Method                                 | Trigger                  |
| ---- | ---------------------------------- | -------------------------------------------------------- | ------------------------ |
| 1    | Initialize form manager and groups | `initForm`, `MainFormManager`                            | On stage load            |
| 2    | Show first group, hide others      | `MainFormManager.init`                                   | On init                  |
| 3    | Create and initialize questions    | `MainGroup.initQuestions`                                | On group creation        |
| 4    | Handle user input and navigation   | `Question`, `MainGroup.navigate`                         | On input/change/enter    |
| 5    | Update visibility and validation   | `updateActiveQuestions`, `updateGroupVisibility`         | On answer change         |
| 6    | Determine user profile             | `determineProfile`                                       | On answer change         |
| 7    | Show/hide groups based on profile  | `updateGroupVisibility`                                  | On profile determination |
| 8    | Transition to output group/results | `navigateToNextGroup`, `MCTManager.goToStage('results')` | On group completion      |

---

## 8. **Edge Cases and Error Handling**

- If a required answer is missing, navigation is disabled.
- If a group or question is not found, log an error and prevent navigation.
- If profile cannot be determined, only show the identifier group.

---

## 9. **Extensibility**

- New groups or questions can be added by updating the DOM and the relevant group/question classes.
- Additional validation or conditional logic can be added in the `Question` or `MainGroup` classes.

---

## 10. **Summary**

- The form stage is a dynamic, profile-driven, multi-group questionnaire.
- It manages state, navigation, validation, and transitions to the next stage.
- All logic is encapsulated in manager, group, and question classes for modularity and clarity.
