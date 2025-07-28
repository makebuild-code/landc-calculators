# MCT Visibility Manager

The `VisibilityManager` is a powerful engine for controlling element visibility based on dynamic conditions. It integrates seamlessly with the MCT state management system to show/hide elements based on user inputs and calculated values.

## Overview

The Visibility Manager provides declarative visibility control through HTML attributes, similar to the Calculation Manager. Elements can be automatically shown or hidden based on:

- **Input Answers**: Values from form inputs (e.g., `{PurchRemo} = Purchase`)
- **Calculated Values**: Results from calculations (e.g., `{LTV} > 80`)
- **Existence Checks**: Whether values are present or not (e.g., `{PropertyValue} not empty`)

## Usage

### Basic Setup

The Visibility Manager is automatically initialized when the MCT component starts. Simply add the `data-mct-visible-if` attribute to any element you want to control:

```html
<div data-mct-visible-if="{PurchRemo} = Purchase">This content only shows for purchase customers</div>
```

### Syntax

The visibility condition syntax follows this pattern:

```
data-mct-visible-if="{VariableName} operator value"
```

#### Variables

Variables are enclosed in curly braces `{}` and can reference:

- **Input Keys**: Any key from the `Inputs` type (e.g., `{PurchRemo}`, `{PropertyValue}`)
- **Calculation Keys**: Any key from the `Calculations` type (e.g., `{LTV}`, `{isProceedable}`)

#### Operators

| Operator    | Description        | Example                     |
| ----------- | ------------------ | --------------------------- |
| `=`         | Equals             | `{PurchRemo} = Purchase`    |
| `!=`        | Not equals         | `{PurchRemo} != Purchase`   |
| `>`         | Greater than       | `{LTV} > 80`                |
| `<`         | Less than          | `{PropertyValue} < 500000`  |
| `empty`     | Check if empty     | `{PropertyValue} empty`     |
| `not empty` | Check if not empty | `{PropertyValue} not empty` |
| `contains`  | String contains    | `{Lender} contains "Bank"`  |

#### Values

Values can be:

- **Strings**: `"Purchase"`, `'Remortgage'`
- **Numbers**: `80`, `500000`
- **Booleans**: `true`, `false`
- **Unquoted strings**: `Purchase`, `Remortgage`

## Examples

### Basic Equality

```html
<!-- Show only for purchase customers -->
<div data-mct-visible-if="{PurchRemo} = Purchase">
  <h3>Purchase-specific information</h3>
  <p>This content is only relevant for purchase customers.</p>
</div>

<!-- Show only for remortgage customers -->
<div data-mct-visible-if="{PurchRemo} = Remortgage">
  <h3>Remortgage-specific information</h3>
  <p>This content is only relevant for remortgage customers.</p>
</div>
```

### Numeric Comparisons

```html
<!-- Show warning for high LTV -->
<div data-mct-visible-if="{LTV} > 80">
  <div class="warning">
    <strong>High LTV Warning:</strong>
    Your loan-to-value ratio is above 80%, which may affect rates.
  </div>
</div>

<!-- Show standard rates for lower LTV -->
<div data-mct-visible-if="{LTV} <= 80">
  <div class="info">
    <strong>Standard Rates:</strong>
    You qualify for standard rates.
  </div>
</div>
```

### Existence Checks

```html
<!-- Show when property value is entered -->
<div data-mct-visible-if="{PropertyValue} not empty">
  <h3>Property Details</h3>
  <p>Property value: £{PropertyValue}</p>
</div>

<!-- Show when property value is missing -->
<div data-mct-visible-if="{PropertyValue} empty">
  <div class="required">Please enter the property value to continue.</div>
</div>
```

### Boolean Values

```html
<!-- Show when ready to proceed -->
<div data-mct-visible-if="{isProceedable} = true">
  <button class="proceed-btn">Proceed with Application</button>
</div>

<!-- Show when not ready -->
<div data-mct-visible-if="{isProceedable} = false">
  <div class="requirements">Please complete all required fields to proceed.</div>
</div>
```

### Complex Conditions

```html
<!-- High-value property with high LTV -->
<div data-mct-visible-if="{PropertyValue} > 500000">
  <div data-mct-visible-if="{LTV} > 80">
    <div class="premium-warning">
      <strong>Premium Rates Required:</strong>
      High-value property with high LTV requires premium rates.
    </div>
  </div>
</div>
```

## Integration with State Management

The Visibility Manager automatically:

1. **Subscribes to state changes** from the `StateManager`
2. **Re-evaluates conditions** when inputs or calculations change
3. **Updates element visibility** only when necessary (performance optimized)
4. **Caches visibility states** to avoid unnecessary DOM updates

### State Change Events

The manager listens for:

- `inputs` changes: When user answers change
- `calculations` changes: When calculated values update

## API Reference

### Public Methods

#### `initialize(component: HTMLElement): void`

Initialize the visibility manager for a component. Automatically called by MCTManager.

#### `addElement(element: HTMLElement, condition: string): void`

Manually add an element to visibility management.

```typescript
const visibilityManager = MCTManager.getVisibilityManager();
visibilityManager.addElement(myElement, '{LTV} > 80');
```

#### `removeElement(element: HTMLElement): void`

Remove an element from visibility management.

#### `forceUpdate(): void`

Force update visibility for all managed elements.

#### `isElementVisible(element: HTMLElement): boolean`

Get current visibility state of an element.

#### `getManagedElements(): HTMLElement[]`

Get all elements currently managed by visibility.

### Accessing the Manager

```typescript
// Get the visibility manager instance
const visibilityManager = MCTManager.getVisibilityManager();

// Add custom visibility logic
visibilityManager.addElement(customElement, '{CustomValue} = true');
```

## Performance Considerations

- **Efficient Updates**: Only updates DOM when visibility actually changes
- **Caching**: Maintains visibility state cache to avoid redundant operations
- **Event-Driven**: Only re-evaluates when relevant state changes
- **Lazy Initialization**: Only processes elements with visibility attributes

## Error Handling

- **Invalid Conditions**: Logs warnings and defaults to visible
- **Missing Variables**: Treats as undefined (empty)
- **Type Mismatches**: Attempts type conversion where possible
- **Graceful Degradation**: Elements remain visible if condition parsing fails

## Best Practices

1. **Use Descriptive Variable Names**: Make conditions readable
2. **Test Edge Cases**: Ensure conditions work with empty/null values
3. **Keep Conditions Simple**: Avoid overly complex nested conditions
4. **Use Appropriate Operators**: Choose the right operator for the data type
5. **Document Complex Logic**: Add comments for complex visibility rules

## Migration from Existing Systems

The Visibility Manager can coexist with existing visibility systems:

```html
<!-- Old system -->
<div data-condition='{"dependsOn": "purchRemo", "operator": "equal", "value": "Purchase"}'>Old visibility content</div>

<!-- New system -->
<div data-mct-visible-if="{PurchRemo} = Purchase">New visibility content</div>
```

## Troubleshooting

### Common Issues

1. **Element not hiding/showing**: Check variable name spelling and case
2. **Condition not working**: Verify the variable exists in inputs or calculations
3. **Performance issues**: Avoid too many visibility conditions on the same page
4. **Type errors**: Ensure numeric comparisons use numeric values

### Debug Mode

Enable debug logging to see condition evaluations:

```typescript
// Add to your initialization
console.log('Visibility conditions:', visibilityManager.getManagedElements());
```

## Future Enhancements

Potential future features:

- **Logical Operators**: `AND`, `OR`, `NOT` combinations
- **Complex Expressions**: Mathematical operations in conditions
- **Custom Functions**: User-defined visibility functions
- **Animation Support**: Smooth show/hide transitions
- **Condition Groups**: Group related visibility rules
