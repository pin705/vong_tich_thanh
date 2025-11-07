# In-Line Highlighting System Implementation

## Overview

This document describes the implementation of the "structured message system" (In-line Highlighting) that replaces full-line highlighting with selective keyword highlighting.

## Problem Statement

The original UI highlighted entire lines of text with bright colors, which:
- Caused eye strain during extended gameplay
- Violated the "Function > Form" philosophy
- Made it difficult to focus on important information

## Solution

Implement a span-based message rendering system where:
- **90% of text** uses a dim, comfortable color (default category)
- **Only keywords** get prominent highlighting (amber for highlights, specific colors for damage/heal/xp/loot)

## Architecture

### 1. Message Structure

```typescript
// New MessageSpan type
interface MessageSpan {
  text: string;
  category: 'default' | 'highlight' | 'accent' | 'error' | 'system' | 'damage' | 'heal' | 'loot' | 'xp';
}

// Updated Message interface
interface Message {
  // ... existing fields
  spans?: MessageSpan[];  // New field for structured messages
}
```

### 2. Server-Side: Message Parser

**File:** `server/utils/messageParser.ts`

The parser identifies patterns and creates spans:

```typescript
// Example input:
"Một [Lính Gác] đang đứng đây."

// Output:
[
  { text: "Một ", category: "default" },
  { text: "[Lính Gác]", category: "highlight" },
  { text: " đang đứng đây.", category: "default" }
]
```

**Identified Patterns:**
- `[Text in brackets]` → highlight category (NPCs, items, players)
- `25 sát thương` → damage category
- `15 HP` or `15 heal` → heal category
- `100 XP` → xp category
- `50 vàng` → loot category

### 3. Server-Side: WebSocket Integration

**File:** `server/routes/ws.ts`

Updated to use the message parser:

```typescript
import { createStructuredMessage } from '../utils/messageParser';

// When sending responses:
for (const response of responses) {
  const structuredMsg = createStructuredMessage(response, messageType);
  peer.send(JSON.stringify(structuredMsg));
}
```

### 4. Client-Side: Message Handling

**File:** `composables/useGameMessages.ts`

Updated to accept spans parameter:

```typescript
function addMessage(
  text: string,
  type: string,
  user?: string,
  channel: 'main' | 'chat' = 'main',
  category?: string,
  spans?: MessageSpan[]  // New parameter
)
```

### 5. Client-Side: Rendering

**File:** `components/MainLogPane.vue`

Renders messages with spans:

```vue
<template v-if="message.spans && message.spans.length > 0">
  <span v-if="shouldShowIcon(message)" class="message-icon">{{ getMessageIcon(message) }}</span>
  <span class="message-text">
    <span 
      v-for="(span, idx) in message.spans" 
      :key="idx" 
      :class="getSpanClass(span)"
      v-html="parseClickableInSpan(span.text)"
    ></span>
  </span>
</template>
```

### 6. CSS Styling

**File:** `components/MainLogPane.vue` (style section)

```css
/* Default spans - dim color for readability */
.message-text :deep(.span-default) {
  color: var(--text-dim);
  background-color: transparent;
}

/* Highlight spans - amber for keywords */
.message-text :deep(.span-highlight) {
  color: var(--text-accent);
  font-weight: 500;
  background-color: transparent;
}

/* Damage - red */
.message-text :deep(.span-damage) {
  color: #ff6666;
  font-weight: 500;
}

/* Heal - green */
.message-text :deep(.span-heal) {
  color: #66ff66;
  font-weight: 500;
}

/* XP - themed color */
.message-text :deep(.span-xp) {
  color: var(--theme-text-xp);
  font-weight: 500;
}

/* Loot - themed color */
.message-text :deep(.span-loot) {
  color: var(--theme-text-loot);
  font-weight: 500;
}
```

## Test Results

All unit tests passed:

```
✅ Test 1: NPC mention
Input: "Một [Lính Gác] đang đứng đây."
Output: 3 spans with [Lính Gác] as highlight

✅ Test 2: Damage message
Input: "Bạn gây 25 sát thương lên [Chuột Hoang]."
Output: 5 spans with "25 sát thương" as damage, "[Chuột Hoang]" as highlight

✅ Test 3: Healing message
Input: "Bạn hồi 15 HP."
Output: 3 spans with "15 HP" as heal

✅ Test 4: XP gain
Input: "Bạn nhận được 100 XP."
Output: 3 spans with "100 XP" as xp

✅ Test 5: Gold loot
Input: "Bạn nhặt được 50 vàng."
Output: 3 spans with "50 vàng" as loot

✅ Test 6: Structured message format
Correct type and structure

✅ Test 7: Plain text
Input: "Bạn đang ở trong một căn phòng."
Output: Single span with default category
```

## Backward Compatibility

The system maintains backward compatibility:
- Messages without `spans` field are rendered using legacy method
- Existing message types still work
- Gradual migration path available

## Benefits

1. **Reduced Eye Strain**: 90% of text uses comfortable dim colors
2. **Better Focus**: Only important information is highlighted
3. **Improved Readability**: Clear visual hierarchy
4. **Maintainable**: Server-side parser centralizes highlighting logic
5. **Flexible**: Easy to add new categories or patterns

## Future Enhancements

- Add more pattern recognition (item rarities, quest objectives, etc.)
- Allow user customization of highlight colors
- Add animation effects for important categories
- Support for nested spans for complex formatting

## Migration Guide

To convert existing code to use structured messages:

1. Import the message parser:
   ```typescript
   import { createStructuredMessage } from '../utils/messageParser';
   ```

2. Replace direct message sending:
   ```typescript
   // Old:
   peer.send(JSON.stringify({
     type: 'normal',
     message: 'Some text with [NPC Name]'
   }));
   
   // New:
   const structuredMsg = createStructuredMessage('Some text with [NPC Name]', 'normal');
   peer.send(JSON.stringify(structuredMsg));
   ```

3. The parser automatically handles the rest!

## Implementation Status

✅ Core infrastructure complete
✅ Message parser implemented and tested
✅ Client-side rendering updated
✅ WebSocket integration complete
✅ CSS styling applied
✅ Build successful
✅ Security scan passed
⏳ Visual verification pending (requires running server)

## Conclusion

This implementation successfully achieves the goal of "In-line Highlighting" by parsing messages into structured spans and applying selective highlighting only to important keywords, resulting in a much more comfortable reading experience that aligns with the "Function > Form" philosophy.
