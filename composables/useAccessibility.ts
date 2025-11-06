import { onMounted, onUnmounted, Ref } from 'vue';

/**
 * Keyboard navigation helper
 */
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeydown = (event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl === undefined || event.ctrlKey === shortcut.ctrl;
      const shiftMatch = shortcut.shift === undefined || event.shiftKey === shortcut.shift;
      const altMatch = shortcut.alt === undefined || event.altKey === shortcut.alt;
      const metaMatch = shortcut.meta === undefined || event.metaKey === shortcut.meta;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
        if (shortcut.preventDefault) {
          event.preventDefault();
        }
        shortcut.handler(event);
        break;
      }
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });

  return {
    handleKeydown
  };
};

/**
 * Focus trap for modal/overlay accessibility
 */
export const useFocusTrap = (containerRef: Ref<HTMLElement | null>) => {
  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let firstFocusable: HTMLElement | null = null;
  let lastFocusable: HTMLElement | null = null;

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    if (!containerRef.value) return;

    const focusables = Array.from(
      containerRef.value.querySelectorAll<HTMLElement>(focusableElements)
    ).filter(el => !el.hasAttribute('disabled'));

    if (focusables.length === 0) return;

    firstFocusable = focusables[0];
    lastFocusable = focusables[focusables.length - 1];

    if (event.shiftKey) {
      // Shift + Tab: backward
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab: forward
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  const activate = () => {
    if (!containerRef.value) return;

    // Focus first element
    setTimeout(() => {
      const focusables = Array.from(
        containerRef.value!.querySelectorAll<HTMLElement>(focusableElements)
      ).filter(el => !el.hasAttribute('disabled'));

      if (focusables.length > 0) {
        focusables[0].focus();
      }
    }, 100);

    window.addEventListener('keydown', handleKeydown);
  };

  const deactivate = () => {
    window.removeEventListener('keydown', handleKeydown);
  };

  onMounted(() => {
    activate();
  });

  onUnmounted(() => {
    deactivate();
  });

  return {
    activate,
    deactivate
  };
};

/**
 * Announce screen reader messages
 */
export const useScreenReaderAnnounce = () => {
  let announcer: HTMLElement | null = null;

  const createAnnouncer = () => {
    if (typeof document === 'undefined') return;

    announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(announcer);
  };

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcer) {
      createAnnouncer();
    }

    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = '';
      
      // Small delay to ensure screen reader picks up the change
      setTimeout(() => {
        if (announcer) {
          announcer.textContent = message;
        }
      }, 100);
    }
  };

  onMounted(() => {
    createAnnouncer();
  });

  onUnmounted(() => {
    if (announcer && announcer.parentNode) {
      announcer.parentNode.removeChild(announcer);
    }
  });

  return {
    announce
  };
};

/**
 * Manage skip links for keyboard navigation
 */
export const useSkipLinks = () => {
  const skipToMain = () => {
    const main = document.querySelector('main, [role="main"]');
    if (main && main instanceof HTMLElement) {
      main.tabIndex = -1;
      main.focus();
      main.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const skipToNav = () => {
    const nav = document.querySelector('nav, [role="navigation"]');
    if (nav && nav instanceof HTMLElement) {
      nav.tabIndex = -1;
      nav.focus();
      nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return {
    skipToMain,
    skipToNav
  };
};

/**
 * Escape key handler for closing overlays
 */
export const useEscapeKey = (callback: () => void) => {
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      callback();
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
};

/**
 * Arrow key navigation for lists
 */
export const useArrowKeyNavigation = (
  items: Ref<any[]>,
  selectedIndex: Ref<number>,
  onSelect?: (index: number) => void
) => {
  const handleKeydown = (event: KeyboardEvent) => {
    if (!items.value || items.value.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex.value = Math.min(selectedIndex.value + 1, items.value.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
        break;
      case 'Home':
        event.preventDefault();
        selectedIndex.value = 0;
        break;
      case 'End':
        event.preventDefault();
        selectedIndex.value = items.value.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (onSelect) {
          onSelect(selectedIndex.value);
        }
        break;
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });

  return {
    handleKeydown
  };
};
