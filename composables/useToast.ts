import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  position: ToastPosition;
  dismissible: boolean;
  show: boolean;
}

const toasts = ref<Toast[]>([]);
let toastIdCounter = 0;

export const useToast = () => {
  const addToast = (
    message: string,
    type: ToastType = 'info',
    duration: number = 3000,
    position: ToastPosition = 'top-right',
    dismissible: boolean = true
  ): string => {
    const id = `toast-${++toastIdCounter}-${Date.now()}`;
    
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      position,
      dismissible,
      show: true
    };

    toasts.value.push(toast);

    // Auto-remove after duration (if duration > 0)
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration + 500); // Add extra time for animation
    }

    return id;
  };

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.value[index].show = false;
      // Remove from array after animation
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id);
      }, 300);
    }
  };

  const success = (message: string, duration?: number, position?: ToastPosition) => {
    return addToast(message, 'success', duration, position);
  };

  const error = (message: string, duration?: number, position?: ToastPosition) => {
    return addToast(message, 'error', duration, position);
  };

  const warning = (message: string, duration?: number, position?: ToastPosition) => {
    return addToast(message, 'warning', duration, position);
  };

  const info = (message: string, duration?: number, position?: ToastPosition) => {
    return addToast(message, 'info', duration, position);
  };

  const clearAll = () => {
    toasts.value.forEach(toast => {
      toast.show = false;
    });
    setTimeout(() => {
      toasts.value = [];
    }, 300);
  };

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll
  };
};
