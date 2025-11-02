import toast from 'react-hot-toast';

/**
 * Custom hook for toast notifications
 * Provides easy-to-use methods for different toast types
 */
export const useToast = () => {
  const showSuccess = (message, duration = 3000) => {
    return toast.success(message, {
      duration,
      position: 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
      },
    });
  };

  const showError = (message, duration = 4000) => {
    return toast.error(message, {
      duration,
      position: 'top-right',
      style: {
        background: '#ef4444',
        color: '#fff',
      },
    });
  };

  const showInfo = (message, duration = 3000) => {
    return toast(message, {
      duration,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: '#3b82f6',
        color: '#fff',
      },
    });
  };

  const showWarning = (message, duration = 3500) => {
    return toast(message, {
      duration,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
      },
    });
  };

  const showLoading = (message) => {
    return toast.loading(message, {
      position: 'top-right',
    });
  };

  const dismiss = (toastId) => {
    toast.dismiss(toastId);
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    dismiss,
    // Direct access to toast for advanced usage
    toast,
  };
};

export default useToast;

