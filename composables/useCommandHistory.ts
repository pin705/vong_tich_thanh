import { ref, watch } from 'vue';
import { useArrayStorage } from './useStorage';

const MAX_COMMAND_HISTORY = 100;
const COMMAND_HISTORY_STORAGE_KEY = 'vong-tich-thanh-command-history';

export function useCommandHistory() {
  // Command input and history
  const currentInput = ref('');
  const commandHistory = useArrayStorage<string>(COMMAND_HISTORY_STORAGE_KEY, []);
  const historyIndex = ref(-1);
  const tempInput = ref('');

  // Tab completion state
  const tabCompletionMatches = ref<string[]>([]);
  const tabCompletionIndex = ref(-1);
  const tabCompletionPrefix = ref('');

  // Navigate command history
  const navigateHistory = (direction: number) => {
    if (commandHistory.value.length === 0) return;
    
    // Save current input when first navigating up from typing
    if (historyIndex.value === -1 && direction === -1) {
      tempInput.value = currentInput.value;
    }
    
    historyIndex.value += direction;
    
    // Going down past the end - restore temp input and reset index
    if (historyIndex.value < -1) {
      historyIndex.value = -1;
      currentInput.value = tempInput.value;
      return;
    }
    
    // Going up past the beginning - stay at first command
    if (historyIndex.value >= commandHistory.value.length) {
      historyIndex.value = commandHistory.value.length - 1;
      return;
    }
    
    // At position -1 (no history selected) - show temp input
    if (historyIndex.value === -1) {
      currentInput.value = tempInput.value;
      return;
    }
    
    // Show command from history (newest = 0, oldest = length-1)
    currentInput.value = commandHistory.value[commandHistory.value.length - 1 - historyIndex.value];
  };

  // Add command to history
  const addToHistory = (command: string) => {
    if (commandHistory.value[commandHistory.value.length - 1] !== command) {
      commandHistory.value.push(command);
      // Limit history size
      if (commandHistory.value.length > MAX_COMMAND_HISTORY) {
        commandHistory.value = commandHistory.value.slice(-MAX_COMMAND_HISTORY);
      }
    }
    historyIndex.value = -1;
    tempInput.value = '';
  };

  // Reset tab completion
  const resetTabCompletion = () => {
    tabCompletionMatches.value = [];
    tabCompletionIndex.value = -1;
    tabCompletionPrefix.value = '';
  };

  // Handle tab completion
  const handleTabCompletion = (
    roomOccupants: any,
    inventoryItems: any[]
  ) => {
    const input = currentInput.value.trim();
    if (!input) return;
    
    const parts = input.split(' ');
    if (parts.length < 2) return;
    
    const command = parts[0];
    const targetPrefix = parts[parts.length - 1].toLowerCase();
    
    // If this is a new tab press
    if (tabCompletionPrefix.value !== targetPrefix) {
      const targets: string[] = [];
      
      // Add players
      roomOccupants.players.forEach((player: any) => {
        if (player.name.toLowerCase().startsWith(targetPrefix)) {
          targets.push(player.name);
        }
      });
      
      // Add NPCs
      roomOccupants.npcs.forEach((npc: any) => {
        if (npc.name.toLowerCase().startsWith(targetPrefix)) {
          targets.push(npc.name);
        }
      });
      
      // Add mobs
      roomOccupants.mobs.forEach((mob: any) => {
        if (mob.name.toLowerCase().startsWith(targetPrefix)) {
          targets.push(mob.name);
        }
      });
      
      // Add items from inventory if relevant command
      if (['use', 'sử', 'dụng', 'drop', 'vứt', 'equip', 'trang'].includes(command.toLowerCase())) {
        inventoryItems.forEach((item: any) => {
          if (item?.name?.toLowerCase().startsWith(targetPrefix)) {
            targets.push(item.name);
          }
        });
      }
      
      tabCompletionMatches.value = [...new Set(targets)].sort();
      tabCompletionIndex.value = 0;
      tabCompletionPrefix.value = targetPrefix;
    } else if (tabCompletionMatches.value.length > 0) {
      tabCompletionIndex.value = (tabCompletionIndex.value + 1) % tabCompletionMatches.value.length;
    }
    
    // Apply completion if we have matches
    if (tabCompletionMatches.value.length > 0) {
      const completedTarget = tabCompletionMatches.value[tabCompletionIndex.value];
      const commandParts = parts.slice(0, -1);
      commandParts.push(completedTarget);
      currentInput.value = commandParts.join(' ');
    }
  };

  return {
    currentInput,
    commandHistory,
    historyIndex,
    tabCompletionMatches,
    tabCompletionIndex,
    tabCompletionPrefix,
    navigateHistory,
    addToHistory,
    resetTabCompletion,
    handleTabCompletion
  };
}
