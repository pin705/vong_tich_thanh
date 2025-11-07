/**
 * Message Parser Utility
 * Parses plain text messages into structured spans for in-line highlighting
 * 
 * Philosophy: 90% of text should be dim (default category), 
 * only keywords get highlight (amber) or special colors
 */

export interface MessageSpan {
  text: string;
  category: 'default' | 'highlight' | 'accent' | 'error' | 'system' | 'damage' | 'heal' | 'loot' | 'xp';
}

/**
 * Parse a message into structured spans
 * Identifies patterns in brackets [] and numbers for highlighting
 */
export function parseMessageIntoSpans(text: string, messageType?: string): MessageSpan[] {
  if (!text || text.trim() === '') {
    return [{ text: '', category: 'default' }];
  }

  const spans: MessageSpan[] = [];
  let currentPos = 0;

  // Regex to match patterns that should be highlighted:
  // [Text in brackets] - for NPCs, items, players, locations
  // Numbers followed by specific keywords (damage, healing, XP)
  const highlightPattern = /(\[[^\]]+\])|(\d+\s*(?:sát thương|damage|HP|heal|chữa|XP|exp|vàng|gold|điểm kinh nghiệm))/gi;

  let match: RegExpExecArray | null;
  
  while ((match = highlightPattern.exec(text)) !== null) {
    const matchStart = match.index;
    const matchText = match[0];
    
    // Add text before the match as default
    if (matchStart > currentPos) {
      const beforeText = text.substring(currentPos, matchStart);
      if (beforeText) {
        spans.push({ text: beforeText, category: 'default' });
      }
    }
    
    // Determine category for the matched text
    let category: MessageSpan['category'] = 'highlight';
    
    // Check for specific patterns
    if (matchText.match(/\d+\s*(?:sát thương|damage)/i)) {
      category = 'damage';
    } else if (matchText.match(/\d+\s*(?:HP|heal|chữa)/i)) {
      category = 'heal';
    } else if (matchText.match(/\d+\s*(?:XP|exp|điểm kinh nghiệm)/i)) {
      category = 'xp';
    } else if (matchText.match(/\d+\s*(?:vàng|gold)/i)) {
      category = 'loot';
    }
    
    spans.push({ text: matchText, category });
    currentPos = matchStart + matchText.length;
  }
  
  // Add remaining text as default
  if (currentPos < text.length) {
    const remainingText = text.substring(currentPos);
    if (remainingText) {
      spans.push({ text: remainingText, category: 'default' });
    }
  }
  
  // If no spans were created (no matches), return entire text as default
  if (spans.length === 0) {
    spans.push({ text, category: 'default' });
  }
  
  return spans;
}

/**
 * Create a structured message object for WebSocket transmission
 */
export function createStructuredMessage(
  text: string,
  type: string = 'normal',
  category?: string,
  channel?: string
): any {
  const spans = parseMessageIntoSpans(text, type);
  
  return {
    type: 'structured-message',
    messageType: type,  // Original type (normal, action, etc.)
    category,
    channel,
    spans,
    // Keep text for backward compatibility
    message: text
  };
}
