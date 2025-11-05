# UI/UX Improvements Documentation

This document describes all the UI/UX improvements implemented for the Vong Tích Thành MUD game.

## Overview

The improvements focus on creating a more intuitive, visual interface while maintaining the retro terminal aesthetic. The goal is to transform command-based interactions into visual, clickable elements.

## Phase 1: Core UI Improvements ✅

### 1. Reduced Border Usage
**Problem:** Excessive borders made the UI look cluttered and amateurish.

**Solution:**
- Changed all component borders from `border: 1px solid var(--text-dim)` to `border: 1px solid rgba(0, 136, 0, 0.3)`
- Reduced background opacity from `rgba(0, 136, 0, 0.05)` to `rgba(0, 136, 0, 0.03)`
- Made input area border thinner and more subtle
- Overall effect: Cleaner, more professional appearance

**Files Modified:**
- `pages/index.vue` - Main output pane, input area
- `components/StatusPane.vue`
- `components/MapPane.vue`
- `components/RoomOccupantsPane.vue`
- `components/ActionsPane.vue`
- `components/ChatPane.vue`

### 2. Clickable Map Directions
**Problem:** Players had to type commands to move, which was slow and unintuitive.

**Solution:**
- Made all direction labels on the map clickable
- Added hover effects showing directions are interactive
- When clicked, automatically executes the movement command
- Visual feedback with color change on hover (changes to accent color)

**Files Modified:**
- `components/MapPane.vue` - Added `@click` handlers and CSS hover states

**Usage:**
- Click on `[Bắc]`, `[Nam]`, `[Đông]`, or `[Tây]` to move in that direction
- No typing required!

### 3. Visual Inventory System
**Problem:** Players had to type `inventory` command and then type commands to use items.

**Solution:**
- Created tabbed interface with `[Thông Tin]` and `[Túi Đồ]` tabs
- **Info Tab** shows:
  - Player name, level, experience, gold
  - All player stats (damage, defense, crit chance, crit damage, lifesteal, dodge)
- **Inventory Tab** shows:
  - 4x5 grid of inventory slots (20 items)
  - Items display with icon and name
  - Equipped items highlighted in gold
  - Click any item to see detailed popover with stats and actions

**Files Created:**
- `components/InventoryPane.vue` - Complete inventory UI with tabs

**Features:**
- Visual grid layout making it easy to see all items at once
- Item icons for quick identification
- Color coding (equipped items in gold border)
- Detailed stats display in popover
- One-click actions: Use, Equip/Unequip, Drop

### 4. Reusable Popover Component
**Problem:** No consistent way to show detailed information or modal dialogs.

**Solution:**
- Created a reusable popover component that can be used system-wide
- Features:
  - Dark backdrop with blur effect
  - Centered content with customizable width
  - Header with title and close button
  - Scrollable body content
  - Optional footer for actions
  - ESC key to close
  - Click backdrop to close

**Files Created:**
- `components/Popover.vue` - Reusable popover component

**Usage:**
```vue
<Popover :isOpen="popoverOpen" title="Item Name" @close="closePopover">
  <template #default>
    <!-- Content here -->
  </template>
  <template #footer>
    <!-- Actions here -->
  </template>
</Popover>
```

## Phase 2: Advanced Overlays ✅

### 5. Fullscreen Overlay Component
**Problem:** Needed a consistent way to show large, complex UIs like help, guild, trade, etc.

**Solution:**
- Created a fullscreen overlay component with multiple size options
- Features:
  - Dark backdrop with blur
  - Configurable sizes: small, medium, large, fullscreen
  - Professional header with title and close button
  - Scrollable body content
  - Optional footer
  - Keyboard shortcuts (ESC to close)
  - Prevents body scroll when open

**Files Created:**
- `components/FullscreenOverlay.vue` - Reusable fullscreen overlay

**Sizes:**
- `small`: 400px width (for quick dialogs)
- `medium`: 600px width (for forms)
- `large`: 80vw width (for content-rich UIs)
- `fullscreen`: 95vw x 95vh (for immersive experiences)

### 6. Interactive Help System
**Problem:** Help command only showed basic text list. Players couldn't easily find information.

**Solution:**
- Created a comprehensive wiki-style help system
- Features:
  - **Search Bar**: Real-time filtering of commands
  - **Category Sidebar**: Browse by category (Basic, Movement, Combat, etc.)
  - **Command List**: Shows all matching commands with descriptions
  - **Detail Panel**: Shows full documentation for selected command including:
    - Command name and aliases
    - Full description
    - Usage examples
    - Multiple example commands

**Files Created:**
- `components/HelpOverlay.vue` - Interactive help system

**How to Access:**
- Type `help` command
- Press `F1` key
- Press `Ctrl+H` (Windows/Linux) or `Cmd+H` (Mac)

**Categories:**
- Tất cả (All)
- Lệnh cơ bản (Basic Commands)
- Di chuyển (Movement)
- Chiến đấu (Combat)
- Tương tác (Interaction)
- Túi đồ (Inventory)
- Xã hội (Social)
- Bang hội (Guild)

**Documented Commands:**
- help, look, go, attack, flee, inventory, get, drop, use, equip, say, talk, list, buy, sell, quit
- Each with full description, aliases, usage, and examples

## Phase 3: Status & Combat UI ✅

### 7. Status Effects Display
**Problem:** Players couldn't see active buffs/debuffs.

**Solution:**
- Created visual status effects component
- Features:
  - Shows all active buffs and debuffs
  - Color coded (buffs in cyan, debuffs in red)
  - Icons for effect types
  - Duration timers (shows remaining time)
  - Clickable for more info or to use remedy items
  - Tooltip with effect description on hover

**Files Created:**
- `components/StatusEffects.vue` - Status effects display

**Effect Types Supported:**
- Buffs (cyan): Shields, speed boosts, strength boosts, regeneration
- Debuffs (red): Poison, slow, weakness, etc.

### 8. Boss Cast Bar
**Problem:** No warning when bosses are casting powerful abilities.

**Solution:**
- Added cast bar to target display during combat
- Features:
  - Shows skill name being cast
  - Animated progress bar (gradient from red to gold)
  - Displays remaining time in seconds
  - Only visible when target is casting
  - Gives players time to react (flee, interrupt, etc.)

**Files Modified:**
- `components/StatusPane.vue` - Added cast bar section

**Visual Design:**
- Skill name in accent color (gold)
- Progress bar with gradient animation
- Time display in bright green
- Smooth transitions for professional feel

## Technical Implementation Details

### Component Architecture

```
pages/index.vue (Main game page)
├── InventoryPane.vue (Player info & inventory)
│   └── Popover.vue (Item details)
├── StatusPane.vue (HP/MP/Target info)
│   └── StatusEffects.vue (Buffs/Debuffs)
├── MapPane.vue (Clickable mini-map)
├── RoomOccupantsPane.vue (Players/NPCs/Mobs)
├── ActionsPane.vue (Quick actions)
├── ChatPane.vue (Chat messages)
└── HelpOverlay.vue (Help system)
    └── FullscreenOverlay.vue (Container)
```

### State Management

**Player State Extended:**
```typescript
interface PlayerState {
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  exp: number;
  nextLevelExp: number;
  gold: number;
  inCombat: boolean;
  stats: {
    damage: number;
    defense: number;
    critChance: number;
    critDamage: number;
    lifesteal: number;
    dodge: number;
  };
  inventoryItems: (InventoryItem | null)[];
}
```

**New Item Interface:**
```typescript
interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable' | 'misc';
  value: number;
  stats?: {
    damage?: number;
    defense?: number;
    healing?: number;
    critChance?: number;
    critDamage?: number;
    lifesteal?: number;
    dodge?: number;
  };
  levelRequirement?: number;
  equipped?: boolean;
}
```

### Color Scheme

Maintained terminal aesthetic:
- Background: `#0a0a0a` (pure black)
- Text Dim: `#008800` (dark green)
- Text Bright: `#00ff00` (bright green)
- Text Accent: `#ffb000` (gold/amber)
- Text Cyan: `#00ffff` (cyan)
- Text Danger: `#ff0000` (red)

### Keyboard Shortcuts

- `F1` - Open help
- `Ctrl+H` / `Cmd+H` - Open help
- `ESC` - Close any overlay
- `↑` / `↓` - Navigate command history
- `Enter` - Execute command

### Accessibility Features

1. **Keyboard Navigation**: All overlays can be closed with ESC
2. **Click Outside**: Click backdrop to close overlays
3. **Visual Feedback**: Hover effects on all interactive elements
4. **Clear Labels**: All buttons and actions clearly labeled
5. **Consistent Colors**: Color coding for different element types
6. **Tooltips**: Hover descriptions where helpful

## Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Uses standard CSS and Vue 3 features, no experimental APIs.

## Performance Considerations

1. **Lazy Loading**: Overlays only rendered when open
2. **Scoped Styles**: All component styles are scoped to prevent conflicts
3. **Efficient Rendering**: Using `v-if` instead of `v-show` for overlays
4. **Minimal Animations**: Only essential transitions for smooth UX
5. **Grid Layout**: Efficient CSS Grid for inventory display

## Future Enhancements Ready

The architecture supports easy addition of:
- Guild management overlay (using FullscreenOverlay)
- Trade UI (using Popover or FullscreenOverlay)
- Area map overlay (using FullscreenOverlay)
- Auction house (using FullscreenOverlay)
- Reputation system (using FullscreenOverlay)
- Pet management UI
- Party management UI

All these can reuse the existing `FullscreenOverlay.vue` and `Popover.vue` components.

## Development Guidelines

### Adding New Overlays

1. Create component extending `FullscreenOverlay.vue`
2. Add state management in `pages/index.vue`
3. Add keyboard shortcut if appropriate
4. Add command handler if needed
5. Document in help system

### Adding New Popovers

1. Use `Popover.vue` component
2. Pass `isOpen`, `title`, and `@close` handler
3. Add content in default slot
4. Add actions in footer slot if needed

### Styling Guidelines

- Use CSS variables for colors
- Maintain terminal aesthetic
- Keep borders subtle (0.3 opacity)
- Use transitions for smooth interactions
- Test hover states on all interactive elements

## Backend Integration Required

The UI is ready, but these features need backend support:

1. **Inventory System**: 
   - API to fetch/update player inventory
   - Item equip/unequip logic
   - Item stat calculations

2. **Status Effects**:
   - WebSocket messages for buff/debuff updates
   - Duration tracking
   - Effect application logic

3. **Boss Mechanics**:
   - Cast bar data (skill name, duration, progress)
   - WebSocket updates during cast
   - Interrupt mechanics

4. **Enhanced Stats**:
   - Critical hit calculation
   - Lifesteal implementation
   - Dodge mechanics

All UI components are ready and will automatically display data when backend sends the appropriate WebSocket messages.

## WebSocket Message Extensions

Expected message formats for new features:

```typescript
// Inventory update
{
  type: 'player_state',
  payload: {
    inventoryItems: [
      { id: '1', name: 'Kiếm Thép', type: 'weapon', equipped: true, ... },
      ...
    ]
  }
}

// Status effects update
{
  type: 'status_effects',
  payload: {
    effects: [
      { id: '1', name: 'Độc', type: 'debuff', duration: 30, ... },
      ...
    ]
  }
}

// Boss casting
{
  type: 'target_casting',
  payload: {
    skillName: 'Dậm Đất',
    progress: 50, // 0-100
    remaining: 2500 // milliseconds
  }
}
```

## Testing Checklist

- [x] Build completes without errors
- [x] All components render correctly
- [x] Borders are subtle and consistent
- [x] Map directions are clickable
- [x] Inventory tabs switch properly
- [x] Popovers open and close correctly
- [x] Help overlay is searchable
- [x] Keyboard shortcuts work
- [x] Hover effects are smooth
- [x] Mobile responsive (basic support)

## Credits

- UI/UX Design: Following MUD game conventions with modern touches
- Implementation: TypeScript + Vue 3 + Nuxt 3
- Testing: Chrome DevTools, Firefox DevTools
- Icons: Unicode characters for terminal compatibility

## Version History

- **v1.0** (2024-11-05): Initial UI improvements
  - Reduced borders
  - Clickable map
  - Visual inventory
  - Reusable components
  - Help system
  - Status effects
  - Boss cast bar
