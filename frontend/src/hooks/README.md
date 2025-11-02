# Custom Hooks

## useToast Hook

A centralized hook for toast notifications across all pages.

### Usage

```javascript
import { useToast } from '../hooks/useToast';

function MyComponent() {
  const { showSuccess, showError, showInfo, showWarning, showLoading, dismiss } = useToast();

  const handleAction = async () => {
    try {
      showLoading('Processing...');
      await someApiCall();
      showSuccess('Action completed successfully!');
    } catch (error) {
      showError('Failed to complete action');
    } finally {
      dismiss(); // Dismiss loading toast
    }
  };

  return (
    <button onClick={handleAction}>
      Do Something
    </button>
  );
}
```

### Available Methods

- `showSuccess(message, duration?)` - Show success toast (green)
- `showError(message, duration?)` - Show error toast (red)
- `showInfo(message, duration?)` - Show info toast (blue)
- `showWarning(message, duration?)` - Show warning toast (yellow)
- `showLoading(message)` - Show loading toast (indefinite)
- `dismiss(toastId?)` - Dismiss a specific toast or all toasts
- `toast` - Direct access to react-hot-toast for advanced usage

### Features

- Consistent styling across all toast types
- Automatic positioning (top-right)
- Customizable durations
- Loading state support
- Easy to use in any component

### Example Use Cases

```javascript
// Success
showSuccess('Transaction saved successfully!');

// Error
showError('Failed to load data');

// Warning
showWarning('Please fill all required fields');

// Info
showInfo('Changes saved automatically');

// Loading
const toastId = showLoading('Uploading file...');
// ... do async work ...
dismiss(toastId);
showSuccess('File uploaded!');
```

