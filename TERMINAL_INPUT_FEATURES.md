# Terminal Input CLI Features - Implementation Summary

## Overview
This document describes the three main CLI (Command-Line Interface) features that have been implemented to transform the input field into a more powerful terminal experience.

## 1. Command History (Lịch sử Lệnh) ✅

### Features Implemented:
- **Arrow Up**: Navigate backward through command history (newest to oldest)
- **Arrow Down**: Navigate forward through command history (oldest to newest)
- **Smart State Management**: 
  - When you start typing and press Up, your current input is saved
  - When you navigate past the newest command (press Down at end), your original input is restored
  - History resets when you execute a command
- **Persistence**: Command history is saved to localStorage and restored on page load
- **Limit**: Maximum of 100 commands are stored to prevent memory issues
- **No Duplicates**: Consecutive duplicate commands are not added to history

### Technical Implementation:
- Storage key: `vong-tich-thanh-command-history`
- State variables:
  - `commandHistory`: Array of past commands
  - `historyIndex`: Current position in history (-1 = no history selected)
  - `tempInput`: Stores current input when navigating history
- Functions:
  - `navigateHistory(direction)`: Handle up/down arrow navigation
  - `loadCommandHistoryFromStorage()`: Load history on mount
  - `saveCommandHistoryToStorage()`: Save history after each command

### Usage Example:
```
> tấn công Chuột Biến Dị
[Press Up] → Shows: tấn công Chuột Biến Dị
[Press Down] → Clears input
[Type: "nói"] → Shows: nói
[Press Up] → Saves "nói", Shows: tấn công Chuột Biến Dị
[Press Down] → Restores: nói
```

## 2. Tab Autocompletion (Tự động Hoàn thành) ✅

### Features Implemented:
- **Tab Completion**: Press TAB to autocomplete target names
- **Multiple Matches**: Press TAB multiple times to cycle through all matches
- **Context-Aware**: Searches different sources based on command:
  - For `use`, `drop`, `equip` commands: Searches inventory items
  - For other commands: Searches players, NPCs, and mobs in current room
- **Case-Insensitive**: Matching is done in lowercase for convenience
- **Prefix Matching**: Matches targets that start with your typed prefix

### Technical Implementation:
- State variables:
  - `tabCompletionMatches`: Array of matching targets
  - `tabCompletionIndex`: Current index in matches array
  - `tabCompletionPrefix`: The prefix being completed
- Functions:
  - `handleTabCompletion()`: Main tab completion handler
  - `resetTabCompletion()`: Reset state when user types

### Usage Examples:

#### Example 1: Single match
```
> tấn công ch[TAB]
→ tấn công Chuột Biến Dị
```

#### Example 2: Multiple matches (cycling)
```
> talk th[TAB]
→ talk Thương Gia
[TAB again]
→ talk Thợ Săn
[TAB again]
→ talk Thương Gia  (cycles back)
```

#### Example 3: Inventory items
```
> use cỏ[TAB]
→ use Cỏ Chữa Lành
```

### Supported Target Types:
1. **Players**: Other players in the same room
2. **NPCs**: Non-player characters (merchants, quest givers, etc.)
3. **Mobs**: Hostile creatures that can be attacked
4. **Items**: Items in player's inventory (for specific commands)

## 3. Command Aliases (Lệnh Tắt) ✅

### Features Implemented:
- **Custom Aliases**: Players can define their own command shortcuts
- **UI Management**: Add/remove aliases through Settings overlay
- **Server Persistence**: Aliases are saved to the server database
- **Automatic Expansion**: Aliases are expanded before command execution
- **Visual Feedback**: Shows alias expansion in command echo
- **Parameter Support**: Can include parameters after alias

### Technical Implementation:
- State variable: `playerCustomAliases` (Record<string, string>)
- Integration in `sendCommand()` function:
  - Extracts first word of command
  - Checks if it matches an alias
  - Replaces alias with full command
  - Preserves any parameters after the alias
- UI in `SettingsOverlay.vue`:
  - List view of current aliases
  - Add new alias form
  - Remove alias button

### Usage Examples:

#### Creating Aliases:
In Settings > Lối Chơi (Gameplay):
- Short: `aa` → Full: `attack`
- Short: `tc` → Full: `talk`
- Short: `di` → Full: `move`

#### Using Aliases:
```
> aa Chuột Biến Dị
→ attack Chuột Biến Dị
(Command echo shows: > aa Chuột Biến Dị → attack Chuột Biến Dị)

> tc Thương Gia
→ talk Thương Gia
(Command echo shows: > tc Thương Gia → talk Thương Gia)
```

### Common Alias Suggestions:
- `aa` → `attack` (tấn công)
- `l` → `look` (xem)
- `i` → `inventory` (túi đồ)
- `n` → `north` (bắc)
- `s` → `south` (nam)
- `e` → `east` (đông)
- `w` → `west` (tây)
- `gt` → `goto` (đi tới)
- `tc` → `talk` (nói chuyện)

## Combined Usage Example

Here's how all three features work together in a real gameplay scenario:

```
# Create an alias
[Open Settings] → [Lối Chơi] → Add: aa → attack

# Use alias with tab completion
> aa ch[TAB]
→ aa Chuột Biến Dị
[Press Enter]
→ attack Chuột Biến Dị (alias expanded and executed)

# Navigate history
[Press Up]
→ aa Chuột Biến Dị (shows previous command)
[Press Enter]
→ Repeats the attack command

# Continue fighting with just Up+Enter
[Press Up] [Press Enter]
[Press Up] [Press Enter]
[Press Up] [Press Enter]
```

## Philosophy: "Không Nhựa" (No Plastic)

These features follow the game's design philosophy of pure functionality without unnecessary decorations:

1. **Command History**: Reduces repetitive typing - type once, repeat with arrows
2. **Tab Completion**: Reduces typing and spelling errors - type less, play more
3. **Aliases**: Maximizes functionality - interface adapts to the player's style

All features are implemented client-side for instant response and minimal server load.

## Technical Notes

### Browser Compatibility:
- localStorage is used for persistence (supported in all modern browsers)
- KeyboardEvent handlers are standard and widely supported
- No external dependencies required

### Performance:
- Command history limited to 100 entries
- Tab completion searches are done on small datasets (current room only)
- All operations are O(n) or better
- No significant performance impact

### Future Enhancements (Optional):
- Command history search (Ctrl+R style)
- Fuzzy matching for tab completion
- Multi-word tab completion
- Alias chaining (alias can call another alias)
- Import/Export aliases feature
