# Plan for the "Results" Stage

## 1. **Purpose of the Results Stage**

- The Results stage is responsible for displaying products that the customer may like based on the answers to the form.
- There are some inputs that allow the user to change the parameters passed in to the API.
- It renders summary information (of answers given), lender/product details (data passed by the API based on their answers), and other outputs based on the user's answers and API results.
- It allows the user to filter, load more, and interact with the results.
- Each result has a button, the actions of the button will depend on data from the answers and the data returned by the API for the result.

---

## 2. **Core Concepts and Structure**

### a. **ResultsManager**

- The main class is `ResultsManager`, which manages rendering, data fetching, and event handling for the results UI.
- It is initialized with a root component and options.

### b. **Results Data**

- Results are structured as an array of `{ key: string, value: string }` objects, representing different output sections (e.g., summary, lenders, details).
- The manager fetches product data from an API and formats it for display.

### c. **Options and Configuration**

- The stage can be configured via `ResultsOptions` (e.g., number of results, which sections to show, error handling).

---

## 3. **How the Stage is Triggered**

- The results stage is initialized by calling `initResults(component, options)`
- Typically triggered after the form stage is completed and the user proceeds to view results.

---

## 4. **Step-by-Step Flow**

### a. **Initialization**

1. **Create the Results Manager**

   - Instantiate `ResultsManager` with the root results element and options.
   - Optionally auto-load results if configured.

2. **Render Initial Outputs**
   - Render summary, lender, and details sections (if enabled in options).
   - Display placeholders or loading states as needed.

### b. **Data Fetching and Rendering**

3. **Build API Request**

   - Construct a request object from the user's answers (via `MCTManager.getAnswers()`).
   - Call the products API to fetch available products.

4. **Render Results**
   - On successful API response, render all enabled templates (summary, lenders, details).
   - On error, render an error message and call any error handlers.

### c. **User Interaction**

5. **Event Binding**
   - Bind events for input/select changes, pagination, filter resets, etc.
   - Update results dynamically as the user interacts with filters.

---

## 5. **Key Methods and Events**

- **Initialization:** `init()`
- **Data Fetching:** `loadAndRenderResults()`, `buildProductsRequest()`
- **Rendering:** `renderAllTemplates()`, `renderSummary()`, `renderLenders()`, `renderDetails()`, `renderError()`
- **Display:** `setResultsData()`, `displayResults()`
- **Event Handling:** (to be filled in by user)

---

## 6. **Possible Triggers for the Stage**

- User completes the form and is routed to the results stage.
- Application logic calls `initResults()` to start the results stage.
- (Add any additional triggers here)

---

## 7. **What Needs to Happen and When**

| Step | Action                        | Responsible Class/Method        | Trigger                |
| ---- | ----------------------------- | ------------------------------- | ---------------------- |
| 1    | Initialize results manager    | `initResults`, `ResultsManager` | On stage load          |
| 2    | Render initial outputs        | `ResultsManager.init`           | On init                |
| 3    | Fetch and render results      | `loadAndRenderResults`          | On init or user action |
| 4    | Bind user interaction events  | (TBD)                           | On init                |
| 5    | Update results on interaction | (TBD)                           | On filter/input change |
| 6    | Handle errors                 | `renderError`                   | On API error           |
| 7    | (Add more steps as needed)    | (TBD)                           | (TBD)                  |

---

## 8. **Edge Cases and Error Handling**

- If the API request fails, display an error message and call the error handler if provided.
- If no products are found, display a suitable message in the details section.
- (Add more edge cases as needed)

---

## 9. **Extensibility**

- Additional result sections can be added by extending the rendering logic and updating the template structure.
- More filters, sorting, or pagination features can be added by binding new events and updating the API request logic.
- (Add more extensibility notes as needed)

---

## 10. **Summary**

- The results stage fetches, formats, and displays product and summary data based on user input.
- It is modular, event-driven, and can be extended with new features or output sections.
- (Add any final notes or summary points here)
