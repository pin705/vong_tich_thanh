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
};

// Parse command input into structured command
export function parseCommand(input: string): Command {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return { action: '' };
  }

  const parts = trimmed.split(/\s+/);
  const rawAction = parts[0];
  
  // Resolve alias
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
