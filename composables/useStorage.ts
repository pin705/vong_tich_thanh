import { ref, watch } from 'vue';
import type { Ref } from 'vue';

/**
 * Enhanced localStorage wrapper with error handling and type safety
 */
export interface StorageOptions<T> {
  key: string;
  defaultValue: T;
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  onError?: (error: Error) => void;
}

export const useLocalStorage = <T>(options: StorageOptions<T>): Ref<T> => {
  const {
    key,
    defaultValue,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    onError
  } = options;

  const data = ref<T>(defaultValue) as Ref<T>;
  let isInitialized = false;

  // Read from localStorage
  const read = (): T => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return deserializer(item);
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      if (onError) {
        onError(error as Error);
      }
      return defaultValue;
    }
  };

  // Write to localStorage
  const write = (value: T): void => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, serializer(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
      if (onError) {
        onError(error as Error);
      }
    }
  };

  // Remove from localStorage
  const remove = (): void => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(key);
      data.value = defaultValue;
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
      if (onError) {
        onError(error as Error);
      }
    }
  };

  // Initialize
  data.value = read();
  isInitialized = true;

  // Watch for changes and sync to localStorage
  watch(
    data,
    (newValue) => {
      if (isInitialized) {
        write(newValue);
      }
    },
    { deep: true }
  );

  // Listen for storage events from other tabs
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === key && event.newValue !== null) {
        try {
          data.value = deserializer(event.newValue);
        } catch (error) {
          console.error(`Error syncing storage event for key "${key}":`, error);
        }
      }
    });
  }

  return data;
};

/**
 * Typed localStorage helpers for common data types
 */
export const useStringStorage = (key: string, defaultValue: string = '') => {
  return useLocalStorage({
    key,
    defaultValue,
    serializer: (v) => v,
    deserializer: (v) => v
  });
};

export const useNumberStorage = (key: string, defaultValue: number = 0) => {
  return useLocalStorage({
    key,
    defaultValue,
    serializer: (v) => String(v),
    deserializer: (v) => Number(v)
  });
};

export const useBooleanStorage = (key: string, defaultValue: boolean = false) => {
  return useLocalStorage({
    key,
    defaultValue,
    serializer: (v) => String(v),
    deserializer: (v) => v === 'true'
  });
};

export const useArrayStorage = <T>(key: string, defaultValue: T[] = []) => {
  return useLocalStorage({
    key,
    defaultValue
  });
};

export const useObjectStorage = <T extends Record<string, any>>(
  key: string,
  defaultValue: T
) => {
  return useLocalStorage({
    key,
    defaultValue
  });
};

/**
 * Storage quota management
 */
export const useStorageQuota = () => {
  const getUsage = async (): Promise<{ used: number; total: number; percentage: number }> => {
    if (typeof navigator === 'undefined' || !navigator.storage) {
      return { used: 0, total: 0, percentage: 0 };
    }

    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const total = estimate.quota || 0;
      const percentage = total > 0 ? (used / total) * 100 : 0;

      return { used, total, percentage };
    } catch (error) {
      console.error('Error getting storage quota:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return {
    getUsage,
    formatBytes
  };
};

/**
 * Clear all localStorage data with prefix
 */
export const clearStorageByPrefix = (prefix: string) => {
  if (typeof window === 'undefined') return;

  const keys = Object.keys(window.localStorage);
  keys.forEach((key) => {
    if (key.startsWith(prefix)) {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error removing localStorage key "${key}":`, error);
      }
    }
  });
};

/**
 * Get all localStorage keys with prefix
 */
export const getStorageKeysByPrefix = (prefix: string): string[] => {
  if (typeof window === 'undefined') return [];

  const keys = Object.keys(window.localStorage);
  return keys.filter((key) => key.startsWith(prefix));
};

/**
 * Check if localStorage is available
 */
export const isStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Migrate localStorage data between versions
 */
export const migrateStorage = (migrations: Array<{
  version: number;
  migrate: () => void;
}>) => {
  const versionKey = 'app-storage-version';
  const currentVersion = parseInt(window.localStorage.getItem(versionKey) || '0', 10);

  migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version)
    .forEach((migration) => {
      try {
        migration.migrate();
        window.localStorage.setItem(versionKey, String(migration.version));
        console.log(`Migrated storage to version ${migration.version}`);
      } catch (error) {
        console.error(`Error migrating storage to version ${migration.version}:`, error);
      }
    });
};
