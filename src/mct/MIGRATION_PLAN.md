# MCT Migration Plan: Stage Managers to Event-Driven Architecture

This document outlines the comprehensive plan for safely converting MCT stage managers to use stateful components and event bus integration.

## **Objective**
Convert the MCT application from manager-based architecture to event-driven component architecture, reducing dependencies on centralized managers and enabling reactive, decoupled communication.

## **Current State Analysis**

### **Problem Areas:**
- **Tight Coupling** - All managers have direct dependencies on MCTManager singleton
- **Manual DOM Synchronization** - Complex show/hide logic spread across multiple classes  
- **Callback-Based Communication** - No standardized event system between components
- **Imperative Navigation** - Manual stage transitions with complex conditional logic

### **Existing Assets:**
- **Component System** - Already built in `src/mct/shared/components/`
- **Event Bus** - TypeScript-safe event system with global bus
- **State Management** - Centralized state with persistence via StateManager
- **StatefulInputGroup** - Ready-to-use input component base class

---

## **Phase 1: Foundation Layer (Low Risk)**
*Status: 🔄 In Progress*  
*Estimated Duration: 1-2 weeks*

### **1.1 Enhanced Event System**
**Objective:** Establish complete event infrastructure before any manager changes

**Events to Add:**
```typescript
// Navigation Events
'stage:transition:request' | 'stage:transition:complete' | 'stage:validation:check'

// Form Events  
'form:question:activated' | 'form:question:deactivated' | 'form:group:complete'

// API Events
'api:products:loading' | 'api:products:success' | 'api:products:error'
'api:lenders:loading' | 'api:lenders:success' | 'api:lenders:error'

// State Events
'state:calculation:request' | 'state:calculation:complete'
```

**Files to Update:**
- `src/mct/shared/types/events.ts` - Add new event definitions
- `src/mct/shared/types/index.ts` - Export new event types

### **1.2 Component Infrastructure**
**New Components to Create:**
- **`NavigationComponent`** - Handles prev/next button states and transitions
- **`LoaderComponent`** - Manages loading states across different contexts  
- **`ValidationComponent`** - Centralized validation logic with event emission
- **`APIStateComponent`** - Manages API loading/error states

**Files to Create:**
- `src/mct/shared/components/ui/NavigationComponent.ts`
- `src/mct/shared/components/ui/LoaderComponent.ts`
- `src/mct/shared/components/ui/ValidationComponent.ts`
- `src/mct/shared/components/ui/APIStateComponent.ts`
- `src/mct/shared/components/ui/index.ts`

### **1.3 Backward Compatibility Layer**
**Implementation:**
- **Event Bridge** - Translate manager method calls to events during transition
- **State Synchronization** - Keep MCTManager state in sync with component events
- **Legacy Support** - Maintain all existing public manager APIs

**Files to Create:**
- `src/mct/shared/migration/EventBridge.ts` - Legacy-to-event translation
- `src/mct/shared/migration/index.ts`

---

## **Phase 2: Questions Stage Migration (Medium Risk)**
*Status: 📋 Planned*  
*Estimated Duration: 2-3 weeks*

### **2.1 Question Component Conversion**
**Target:** Convert `src/mct/stages/form/Questions.ts` to pure components

**Migration Steps:**
1. Create QuestionComponent extending StatefulInputGroup with event emissions
2. Move lender API calls to dedicated API components  
3. Convert `shouldBeVisible()` to event-driven visibility system
4. Replace direct validation with event-based validation

### **2.2 Group Component Migration** 
**Target:** Convert `src/mct/stages/form/Groups.ts` classes
- **MainGroup** → **MainGroupComponent** with stage transition events
- **OutputGroup** → **OutputGroupComponent** with API result handling

### **2.3 Form Manager Simplification**
**Target:** Reduce `Manager_Main.ts` and `Manager_Base.ts` responsibilities

---

## **Phase 3: Results Stage Migration (Medium Risk)**
*Status: 📋 Planned*  
*Estimated Duration: 2-3 weeks*

### **3.1 Results Component Architecture**
**Target:** Convert `src/mct/stages/results/Manager.ts`

**New Components:**
- **`ProductSearchComponent`** - Handles API calls and result rendering
- **`FilterComponent`** - Self-contained filtering with automatic API triggers
- **`DialogComponent`** - Modal management for booking/application flows
- **`PaginationComponent`** - Independent pagination logic

---

## **Phase 4: Appointment Stage Migration (Higher Risk)**
*Status: 📋 Planned*  
*Estimated Duration: 3-4 weeks*

### **4.1 Complex Component Breakdown**
**Target:** `src/mct/stages/appointment/Manager.ts` - Most complex manager

**Component Strategy:**
- **`CalendarComponent`** - Date/time selection with slot availability
- **`BookingFormComponent`** - Contact form with validation
- **`PanelSwitchComponent`** - Navigation between calendar and form
- **`BookingStateComponent`** - Coordination of booking flow state

---

## **Phase 5: Manager Simplification (Low Risk)**
*Status: 📋 Planned*  
*Estimated Duration: 1-2 weeks*

### **5.1 MCTManager Refactoring**
**Objective:** Reduce MCTManager to thin coordination layer

**Retained Responsibilities:**
- Stage Orchestration - High-level stage transitions
- State Persistence - localStorage integration  
- Component Registration - Component lifecycle management

**Removed Responsibilities:**
- Direct DOM Manipulation - Moved to components
- Business Logic - Moved to specialized components
- API Calls - Moved to API components

---

## **Risk Mitigation Strategies**

### **1. Incremental Deployment**
- **Feature Flags** - Toggle between old and new implementations
- **A/B Testing** - Roll out to percentage of users
- **Rollback Plan** - Quick revert capability for each phase

### **2. Testing Strategy**
- **Unit Tests** - Individual component testing with event mocking
- **Integration Tests** - Event flow validation
- **E2E Tests** - Full user journey validation with Playwright
- **Performance Tests** - Event system overhead monitoring

### **3. Monitoring & Debugging**
- **Event Logging** - Comprehensive event flow logging
- **Performance Metrics** - Component lifecycle performance
- **Error Tracking** - Enhanced error reporting with event context

---

## **Success Metrics**

### **Technical Metrics:**
- **Reduced Coupling** - Fewer direct dependencies between managers
- **Code Coverage** - Maintained or improved test coverage
- **Bundle Size** - No significant increase in bundle size
- **Performance** - No regression in page load or interaction times

### **Developer Experience:**
- **Component Reusability** - Components used across multiple contexts
- **Testing Ease** - Simplified component testing
- **Debug Experience** - Improved debugging with event flow visibility
- **Maintenance** - Reduced bug reports and faster feature development

---

## **Implementation Timeline**

- **Weeks 1-2:** Phase 1 - Foundation ⭐ **CURRENT**
- **Weeks 3-5:** Phase 2 - Questions Migration  
- **Weeks 6-8:** Phase 3 - Results Migration
- **Weeks 9-12:** Phase 4 - Appointment Migration
- **Weeks 13-14:** Phase 5 - Manager Cleanup

**Total Estimated Duration: 3-4 months**

---

## **Progress Tracking**

### **Phase 1 Tasks:**
- [ ] Add missing event type definitions
- [ ] Create NavigationComponent
- [ ] Create LoaderComponent  
- [ ] Create ValidationComponent
- [ ] Create APIStateComponent
- [ ] Build EventBridge for backward compatibility
- [ ] Update component index exports
- [ ] Test event system integration

### **Next Steps:**
After Phase 1 completion, begin Phase 2 with Questions component conversion.

---

*Last Updated: [Current Date]*
*Status: Phase 1 Foundation Layer in progress*