import { ref, watch, onMounted } from 'vue';
import { useLocalStorage, useObjectStorage } from './useStorage';

export interface GamePreferences {
  // Display settings
  theme: string;
  fontSize: string;
  showTimestamps: boolean;
  compactMode: boolean;
  
  // Gameplay settings
  autoCombat: boolean;
  autoLoot: boolean;
  autoRest: boolean;
  combatNotifications: boolean;
  
  // Audio settings
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  
  // Chat settings
  chatFilter: boolean;
  showJoinLeave: boolean;
  chatTimestamps: boolean;
  emojiEnabled: boolean;
  
  // Accessibility settings
  reducedMotion: boolean;
  highContrast: boolean;
  screenReaderMode: boolean;
  
  // Custom aliases
  customAliases: Record<string, string>;
  
  // Favorite locations for quick travel
  favoriteLocations: Array<{ id: string; name: string }>;
  
  // Tutorial state
  tutorialCompleted: boolean;
  completedTutorials: string[];
  
  // UI state
  lastOpenedTab: string;
  sidebarCollapsed: boolean;
}

const defaultPreferences: GamePreferences = {
  theme: 'vong-tich',
  fontSize: 'medium',
  showTimestamps: true,
  compactMode: false,
  
  autoCombat: false,
  autoLoot: false,
  autoRest: false,
  combatNotifications: true,
  
  soundEnabled: true,
  musicEnabled: true,
  soundVolume: 50,
  musicVolume: 30,
  
  chatFilter: false,
  showJoinLeave: true,
  chatTimestamps: true,
  emojiEnabled: true,
  
  reducedMotion: false,
  highContrast: false,
  screenReaderMode: false,
  
  customAliases: {},
  favoriteLocations: [],
  
  tutorialCompleted: false,
  completedTutorials: [],
  
  lastOpenedTab: 'main',
  sidebarCollapsed: false
};

export const useGamePreferences = () => {
  const preferences = useObjectStorage('game-preferences', defaultPreferences);

  // Apply theme
  const applyTheme = (themeId: string) => {
    if (typeof document === 'undefined') return;
    
    const themes = ['vong-tich', 'ho-phach', 'co-ngu'];
    themes.forEach(id => document.body.classList.remove(`theme-${id}`));
    document.body.classList.add(`theme-${themeId}`);
  };

  // Apply font size
  const applyFontSize = (sizeId: string) => {
    if (typeof document === 'undefined') return;
    
    const sizes = ['small', 'medium', 'large'];
    sizes.forEach(id => document.body.classList.remove(`font-size-${id}`));
    document.body.classList.add(`font-size-${sizeId}`);
  };

  // Apply reduced motion
  const applyReducedMotion = (enabled: boolean) => {
    if (typeof document === 'undefined') return;
    
    if (enabled) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
  };

  // Apply high contrast
  const applyHighContrast = (enabled: boolean) => {
    if (typeof document === 'undefined') return;
    
    if (enabled) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };

  // Update theme
  const setTheme = (themeId: string) => {
    preferences.value.theme = themeId;
    applyTheme(themeId);
  };

  // Update font size
  const setFontSize = (sizeId: string) => {
    preferences.value.fontSize = sizeId;
    applyFontSize(sizeId);
  };

  // Update auto combat
  const setAutoCombat = (enabled: boolean) => {
    preferences.value.autoCombat = enabled;
  };

  // Update custom alias
  const addAlias = (short: string, full: string) => {
    preferences.value.customAliases[short] = full;
  };

  const removeAlias = (short: string) => {
    delete preferences.value.customAliases[short];
  };

  // Update favorite location
  const addFavoriteLocation = (id: string, name: string) => {
    const exists = preferences.value.favoriteLocations.find(loc => loc.id === id);
    if (!exists) {
      preferences.value.favoriteLocations.push({ id, name });
    }
  };

  const removeFavoriteLocation = (id: string) => {
    preferences.value.favoriteLocations = preferences.value.favoriteLocations.filter(
      loc => loc.id !== id
    );
  };

  // Mark tutorial as completed
  const completeTutorial = (tutorialId: string) => {
    if (!preferences.value.completedTutorials.includes(tutorialId)) {
      preferences.value.completedTutorials.push(tutorialId);
    }
  };

  const isTutorialCompleted = (tutorialId: string): boolean => {
    return preferences.value.completedTutorials.includes(tutorialId);
  };

  // Reset to defaults
  const resetToDefaults = () => {
    Object.assign(preferences.value, defaultPreferences);
    applyTheme(defaultPreferences.theme);
    applyFontSize(defaultPreferences.fontSize);
    applyReducedMotion(defaultPreferences.reducedMotion);
    applyHighContrast(defaultPreferences.highContrast);
  };

  // Export settings
  const exportSettings = (): string => {
    return JSON.stringify(preferences.value, null, 2);
  };

  // Import settings
  const importSettings = (json: string): boolean => {
    try {
      const imported = JSON.parse(json);
      Object.assign(preferences.value, imported);
      applyTheme(preferences.value.theme);
      applyFontSize(preferences.value.fontSize);
      applyReducedMotion(preferences.value.reducedMotion);
      applyHighContrast(preferences.value.highContrast);
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  };

  // Initialize on mount
  onMounted(() => {
    applyTheme(preferences.value.theme);
    applyFontSize(preferences.value.fontSize);
    applyReducedMotion(preferences.value.reducedMotion);
    applyHighContrast(preferences.value.highContrast);
  });

  return {
    preferences,
    setTheme,
    setFontSize,
    setAutoCombat,
    addAlias,
    removeAlias,
    addFavoriteLocation,
    removeFavoriteLocation,
    completeTutorial,
    isTutorialCompleted,
    resetToDefaults,
    exportSettings,
    importSettings,
    applyTheme,
    applyFontSize,
    applyReducedMotion,
    applyHighContrast
  };
};
