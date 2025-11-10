import type { Command } from '~/types';

// Command aliases for quick typing
const COMMAND_ALIASES: Record<string, string> = {
  // Look
  'l': 'look',
  
  // Movement
  'n': 'north',
  's': 'south',
  'e': 'east',
  'w': 'west',
  'u': 'up',
  'd': 'down',
  
  // Actions
  'a': 'attack',
  'k': 'attack',
  'kill': 'attack',
  'g': 'get',
  'i': 'inventory',
  'inv': 'inventory',
  't': 'talk',
  
  // Combat
  'flee': 'flee',
  'run': 'flee',
  
  // Items
  'use': 'use',
  'drop': 'drop',
  
  // Shop
  'buy': 'buy',
  'sell': 'sell',
  'list': 'list',
  
  // Party
  'p': 'party',
  'moi': 'party',
  'roi': 'party',
};

// Built-in commands that cannot be overridden by custom aliases
export const BUILT_IN_COMMANDS = [
  'go', 'look', 'l', 'talk', 't', 'say', 'get', 'g', 'drop', 'use',
  'attack', 'a', 'kill', 'flee', 'run', 'auto', 'inventory', 'i',
  'list', 'buy', 'sell', 'equip', 'unequip', 'party', 'p', 'moi', 'roi', 'guild',
  'pvp', 'trade', 'quit', 'help', 'alias', 'skills', 'talents',
  'n', 's', 'e', 'w', 'u', 'd', 'north', 'south', 'east', 'west', 'up', 'down'
];

// Parse command input into structured command
export function parseCommand(input: string, customAliases?: Map<string, string>, depth: number = 0): Command {
  const trimmed = input.trim();
  if (!trimmed) {
    return { action: '' };
  }

  // Prevent infinite recursion by limiting depth
  const MAX_RECURSION_DEPTH = 5;
  if (depth >= MAX_RECURSION_DEPTH) {
    console.warn('[parseCommand] Max recursion depth reached, stopping alias expansion');
    // Parse without further alias expansion
    const parts = trimmed.toLowerCase().split(/\s+/);
    const action = parts[0];
    const target = parts[1];
    const args = parts.slice(2);
    return { action, target, args };
  }

  // Check custom aliases first (case-sensitive for custom aliases)
  if (customAliases && depth === 0) { // Only expand custom aliases at depth 0
    for (const [alias, fullCommand] of customAliases.entries()) {
      // Check if input starts with the alias
      if (trimmed === alias || trimmed.startsWith(alias + ' ')) {
        // Replace alias with full command
        const remainingInput = trimmed.slice(alias.length).trim();
        const expandedInput = remainingInput ? `${fullCommand} ${remainingInput}` : fullCommand;
        // Recursively parse the expanded command (without custom aliases to avoid infinite loop)
        return parseCommand(expandedInput, undefined, depth + 1);
      }
    }
  }

  const lowerInput = trimmed.toLowerCase();
  const parts = lowerInput.split(/\s+/);
  const rawAction = parts[0];
  
  // Resolve built-in alias
  const action = COMMAND_ALIASES[rawAction] || rawAction;
  
  // Handle movement shortcuts (n, s, e, w, u, d)
  if (['north', 'south', 'east', 'west', 'up', 'down'].includes(action)) {
    return {
      action: 'go',
      target: action,
      args: []
    };
  }

  // For other commands, parse target and args
  const target = parts[1];
  const args = parts.slice(2);

  return {
    action,
    target,
    args,
  };
}

// Normalize item/agent names for matching
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim();
}

// Match partial names (for "look chuot" matching "Chuột Biến Dị")
export function matchesName(fullName: string, query: string): boolean {
  const normalizedFull = normalizeString(fullName);
  const normalizedQuery = normalizeString(query);
  return normalizedFull.includes(normalizedQuery);
}
