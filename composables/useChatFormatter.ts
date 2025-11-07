import { computed } from 'vue';

/**
 * Format chat messages with rich text support
 * Supports: URLs, emojis, mentions, bold text
 */
export const useChatFormatter = () => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const mentionRegex = /@(\w+)/g;
  const boldRegex = /\*\*(.+?)\*\*/g;
  const italicRegex = /\*(.+?)\*/g;

  const formatMessage = (text: string): string => {
    if (!text) return '';

    let formatted = text;

    // Escape HTML to prevent XSS
    formatted = formatted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Format URLs (clickable links)
    formatted = formatted.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>`;
    });

    // Format mentions (@username)
    formatted = formatted.replace(mentionRegex, (match, username) => {
      return `<span class="chat-mention">@${username}</span>`;
    });

    // Format bold text (**text**)
    formatted = formatted.replace(boldRegex, (match, text) => {
      return `<strong class="chat-bold">${text}</strong>`;
    });

    // Format italic text (*text*)
    formatted = formatted.replace(italicRegex, (match, text) => {
      return `<em class="chat-italic">${text}</em>`;
    });

    return formatted;
  };

  const stripFormatting = (text: string): string => {
    return text
      .replace(boldRegex, '$1')
      .replace(italicRegex, '$1')
      .replace(mentionRegex, '@$1');
  };

  return {
    formatMessage,
    stripFormatting
  };
};

/**
 * Common emoji shortcuts for quick insertion
 */
export const emojiShortcuts: Record<string, string> = {
  ':)': '😊',
  ':(': '☹️',
  ':D': '😃',
  ';)': '😉',
  ':P': '😛',
  ':O': '😮',
  '<3': '❤️',
  ':heart:': '❤️',
  ':thumbsup:': '👍',
  ':thumbsdown:': '👎',
  ':fire:': '🔥',
  ':star:': '⭐',
  ':sword:': '⚔️',
  ':shield:': '🛡️',
  ':potion:': '🧪',
  ':gold:': '💰',
  ':gem:': '💎',
  ':skull:': '💀',
  ':dragon:': '🐉',
  ':trophy:': '🏆',
  ':100:': '💯'
};

// Pre-compile regex patterns for emoji shortcuts
const emojiRegexCache = new Map<string, RegExp>();
Object.entries(emojiShortcuts).forEach(([shortcut]) => {
  const escaped = shortcut.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  emojiRegexCache.set(shortcut, new RegExp(escaped, 'g'));
});

/**
 * Replace emoji shortcuts with actual emojis
 */
export const replaceEmojiShortcuts = (text: string): string => {
  let result = text;
  Object.entries(emojiShortcuts).forEach(([shortcut, emoji]) => {
    const regex = emojiRegexCache.get(shortcut);
    if (regex) {
      result = result.replace(regex, emoji);
    }
  });
  return result;
};

/**
 * Get color for user name based on hash
 */
export const getUserColor = (username: string): string => {
  if (!username) return '#00ff00';
  
  const colors = [
    '#00ff00', // green
    '#00ffff', // cyan
    '#ffb000', // amber
    '#ff69b4', // hot pink
    '#4da6ff', // light blue
    '#9966ff', // purple
    '#00ff7f', // spring green
    '#ffd700', // gold
    '#ff6b6b', // red
    '#51cf66'  // lime
  ];
  
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Check if message contains mention of current user
 */
export const containsMention = (text: string, username: string): boolean => {
  const regex = new RegExp(`@${username}\\b`, 'i');
  return regex.test(text);
};

/**
 * Highlight search text in message
 */
export const highlightSearchText = (text: string, searchText: string): string => {
  if (!searchText) return text;
  
  const regex = new RegExp(`(${searchText})`, 'gi');
  return text.replace(regex, '<span class="chat-highlight">$1</span>');
};

/**
 * Truncate long messages
 */
export const truncateMessage = (text: string, maxLength: number = 500): { text: string; truncated: boolean } => {
  if (text.length <= maxLength) {
    return { text, truncated: false };
  }
  
  return {
    text: text.substring(0, maxLength) + '...',
    truncated: true
  };
};
