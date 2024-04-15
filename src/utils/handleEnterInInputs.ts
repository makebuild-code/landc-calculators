import type { Input } from 'src/types';

/**
 * Function to run a callback on Enter when input is focused and remove the listener on focus out
 * @param input The input to add the listeners to
 * @param callback The function to run/remove on focus change
 */
export const handleEnterInInputs = (input: Input, callback: () => void) => {
  const runOnEnterWrapper = (event: Event) => {
    runOnEnter(event as KeyboardEvent);
  };

  input.addEventListener('focus', handleFocus, true);
  input.addEventListener('blur', handleBlur, true);

  function handleFocus(): void {
    input.addEventListener('keydown', runOnEnterWrapper);
  }

  function handleBlur(): void {
    input.removeEventListener('keydown', runOnEnterWrapper);
  }

  function runOnEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      callback();
    }
  }
};
