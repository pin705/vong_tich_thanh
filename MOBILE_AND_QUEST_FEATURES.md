# Mobile UI Optimization & Quest System Implementation

This document describes the mobile UI optimizations and new game features implemented for the Vong Tích Thành MUD game.

## Overview

This update addresses the issues raised in the problem statement:
1. ✅ Mobile optimization for popups (Talent Tree, Skills)
2. ✅ World map system showing all locations, NPCs, bosses
3. ✅ Quest/mission system (main, daily, side quests)
4. ✅ Profession/job system with 6 professions
5. ✅ NPC popup interactions for better mobile gameplay

## Mobile UI Optimizations

### 1. Talent Tree Overlay (TalentTreeOverlay.vue)
**Problem:** Text was too small on mobile, layout didn't fit screen properly

**Solution:**
- Added comprehensive mobile responsive CSS (`@media (max-width: 768px)`)
- Changed 3-column grid to single column on mobile
- Reduced font sizes proportionally (h2: 1.5rem → 1.2rem)
- Adjusted padding and spacing for touch-friendly UI
- Talent detail panel repositioned to bottom half of screen on mobile
- Reduced button sizes for better touch targets

### 2. Skillbook Overlay (SkillbookOverlay.vue)
**Problem:** Tabs and skill list hard to read on mobile

**Solution:**
- Added mobile responsive CSS
- Changed 2-column layout to single column on mobile
- Flexible tab buttons that wrap and expand to fill space
- Reduced font sizes for better readability
- Skills list limited to 40vh height with scroll on mobile
- Skill detail panel adjusted to 40vh max height

### 3. Context Popup Mobile Optimization
**Already implemented** - ContextualPopup component has mobile CSS:
- 95% width on mobile (vs 90% on desktop)
- 85vh max height (more screen space)
- Reduced font sizes and padding

### 4. Fullscreen Overlay Mobile Optimization
**Already implemented** - FullscreenOverlay has mobile responsiveness:
- 95vw width and 90vh height on mobile
- Adaptive sizing for different overlay sizes

## New Features

### 1. World Map System

**Component:** `WorldMapOverlay.vue`

**Features:**
- **Search Bar:** Real-time filtering by room name, NPC, mob, or boss
- **Category Filters:** All, NPCs, Mobs, Boss, Shop
- **Room Cards:** Display room information with:
  - Number of NPCs and mobs
  - Boss indicator with name
  - Shop indicator
  - Available exits/connections
  - Visited status (highlighted)
  - Current location (highlighted in gold)
- **Room Detail Panel:** Shows full description, NPCs, mobs, boss, and navigation button
- **Navigation:** Click any room to auto-navigate (sends goto command)

**API Endpoint:** `/api/world/map.get`
- Returns all rooms with NPCs, mobs, bosses, shops
- Marks player's current room
- Provides room connections

**Mobile Optimizations:**
- Single column grid layout
- Room detail panel at bottom on mobile
- Reduced font sizes and padding
- Touch-friendly cards and buttons

### 2. Quest System

**Components:**
- `QuestTrackerOverlay.vue` - Main quest UI
- `Quest.ts` - Quest data model
- `PlayerQuest.ts` - Player quest progress model

**Quest Types:**
- **Main Quests (Chính):** Story-driven, gold badge
- **Daily Quests (Hàng ngày):** Repeatable, blue badge
- **Side Quests (Phụ):** Optional, gray badge

**Quest Features:**
- **Three Tabs:** Active, Available, Completed
- **Objective Types:**
  - Kill: Defeat specific enemies
  - Talk: Interact with NPCs
  - Collect: Gather items
  - Visit: Go to locations
  - Profession: Choose a profession
- **Progress Tracking:** Shows X/Y completed objectives
- **Rewards:** Experience, gold, items
- **Requirements:** Level, profession
- **Repeatable:** Daily quests can be repeated

**Quest Actions:**
- **Complete:** Turn in completed quests for rewards
- **Abandon:** Cancel active quest
- **Repeat:** Restart completed repeatable quests
- **Track:** Follow quest objectives (UI feature)

**API Endpoints:**
- `/api/player/quests.get` - List all quests (active, available, completed)
- `/api/player/quests/complete.post` - Complete quest and receive rewards
- `/api/player/quests/abandon.post` - Abandon active quest
- `/api/player/quests/repeat.post` - Restart repeatable quest

**Mobile Optimizations:**
- Single column layout for quest list and detail
- Flexible tab buttons
- Quest list: 40vh max height
- Quest detail: 50vh max height
- Touch-friendly action buttons

### 3. Profession System

**Component:** `ProfessionChoiceOverlay.vue`

**Six Professions:**

1. **Thợ Rèn (Blacksmith) ⚒️**
   - Craft weapons and armor, repair equipment
   - Bonuses: +5 Defense, +10% Repair efficiency
   - Starting Equipment: Silver Hammer, Leather Gloves, Iron Sword Recipe

2. **Nhà Giả Kim (Alchemist) 🧪**
   - Brew potions, poisons, and elixirs
   - Bonuses: +20 HP, +2 Small Health Potions
   - Starting Equipment: Alchemy Kit, Medium Potion, Large Potion Recipe

3. **Phù Phép Sư (Enchanter) ✨**
   - Enchant equipment, create scrolls
   - Bonuses: +10 MP, +5% Magic damage
   - Starting Equipment: Mage Staff, Mana Stone, Fire Scroll Recipe

4. **Thợ Săn (Hunter) 🏹**
   - Hunt monsters, collect materials
   - Bonuses: +8 Damage, +10% Drop rate
   - Starting Equipment: Hunting Knife, Trap, Large Leather Bag

5. **Thợ Mỏ (Miner) ⛏️**
   - Mine ores and gems
   - Bonuses: +15 HP, +5% Resource yield
   - Starting Equipment: Steel Pickaxe, Mining Helmet, Lantern

6. **Thảo Dược Gia (Herbalist) 🌿**
   - Gather and process herbs
   - Bonuses: +10 HP, +10 MP, +5% Herb yield
   - Starting Equipment: Harvest Sickle, Herb Bag, Herbalism Manual

**Features:**
- **One-time Choice:** Players can only choose profession once
- **Detailed Information:** Each profession shows skills, bonuses, rewards
- **Starting Equipment:** Players receive 2-3 items upon choosing profession
- **Visual Icons:** Each profession has distinctive emoji icon
- **Selection UI:** Click card to select, then confirm choice

**API Endpoint:** `/api/player/profession.post`
- Validates profession choice
- Checks if player already has profession
- Creates and adds starting items to inventory
- Updates player's profession field

**Player Model Updates:**
```typescript
profession: {
  type: String,
  enum: ['blacksmith', 'alchemist', 'enchanter', 'hunter', 'miner', 'herbalist', null],
  default: null
},
professionLevel: { type: Number, default: 0 },
professionExp: { type: Number, default: 0 }
```

**Mobile Optimizations:**
- Single column grid for profession cards
- Profession detail panel at bottom on mobile
- Reduced icon sizes (3rem → 2.5rem)
- Touch-friendly cards and buttons
- Flexible layout for different screen sizes

### 4. Footer Tab Bar Updates

**New Tabs Added:**
- **[Thế Giới]** - Opens World Map overlay
- **[Nhiệm Vụ]** - Opens Quest Tracker overlay

**Total Tabs:**
1. Bản Đồ (Mini Map)
2. **Thế Giới (World Map)** - NEW
3. Xung Quanh (Occupants)
4. Túi Đồ (Inventory)
5. **Nhiệm Vụ (Quests)** - NEW
6. Kỹ Năng (Skills)
7. Thiên Phú (Talents)
8. Cài Đặt (Settings)

**Mobile Optimization:**
- Footer tab bar already has mobile CSS
- Font size reduced: 16px → 14px on mobile
- Padding reduced: 0.75rem → 0.6rem on mobile

## Integration in Main Page (index.vue)

### New State Variables
```typescript
// Overlay states
const worldMapOpen = ref(false);
const questsOpen = ref(false);
const professionChoiceOpen = ref(false);

// Data states
const currentRoomName = ref('Không rõ');
const worldRooms = ref<any[]>([]);
const playerQuests = ref<any[]>([]);
```

### New Handler Functions
- `loadWorldMap()` - Fetch world map data
- `handleWorldMapNavigation(roomId)` - Navigate to room from map
- `loadQuests()` - Fetch player's quests
- `handleCompleteQuest(questId)` - Complete quest
- `handleAbandonQuest(questId)` - Abandon quest
- `handleRepeatQuest(questId)` - Repeat daily quest
- `handleTrackQuest(questId)` - Track quest (UI only)
- `handleChooseProfession(professionId)` - Choose profession

### Tab Click Handler Updates
```typescript
case 'worldmap':
  await loadWorldMap();
  worldMapOpen.value = true;
  break;
case 'quests':
  await loadQuests();
  questsOpen.value = true;
  break;
```

## API Implementation

### World Map API (`/api/world/map.get`)
**Input:** User session (authentication)

**Process:**
1. Fetch all rooms from database
2. Fetch all agents (NPCs and mobs)
3. Map rooms to world map format with:
   - Room info (id, name, description)
   - NPCs in room
   - Mobs in room
   - Boss (mob with HP > 80)
   - Shop availability
   - Exit connections
4. Mark player's current room

**Output:**
```typescript
{
  success: boolean,
  rooms: Array<{
    id: string,
    name: string,
    description: string,
    npcs: string[],
    mobs: string[],
    boss?: string,
    shop: boolean,
    connections: string[],
    visited: boolean,
    isCurrent: boolean
  }>,
  currentRoomName: string
}
```

### Quests API (`/api/player/quests.get`)
**Input:** User session

**Process:**
1. Fetch player's active and completed quests
2. Fetch all available quests
3. Check requirements (level, profession)
4. Merge and format quest data

**Output:**
```typescript
{
  success: boolean,
  quests: Array<{
    id: string,
    name: string,
    description: string,
    type: 'main' | 'daily' | 'side',
    questGiver: string,
    objectives: Array<{
      type: string,
      target: string,
      count: number,
      progress: number
    }>,
    rewards: {
      exp?: number,
      gold?: number,
      items?: string[]
    },
    status: 'active' | 'completed' | 'available',
    levelRequirement?: number,
    professionRequirement?: string,
    isRepeatable?: boolean
  }>
}
```

### Quest Complete API (`/api/player/quests/complete.post`)
**Input:** `{ questId: string }`

**Process:**
1. Verify quest is active and all objectives completed
2. Fetch quest rewards
3. Add experience and gold to player
4. Create and add reward items to inventory
5. Mark quest as completed

**Output:**
```typescript
{
  success: boolean,
  message: string,
  rewards?: {
    exp?: number,
    gold?: number,
    items?: ObjectId[]
  }
}
```

### Profession Choice API (`/api/player/profession.post`)
**Input:** `{ profession: string }`

**Process:**
1. Validate profession is valid
2. Check if player already has profession
3. Set player's profession, level, exp
4. Create and add starting items to inventory

**Output:**
```typescript
{
  success: boolean,
  message: string,
  profession?: string,
  professionLevel?: number
}
```

## Database Schema Updates

### Quest Model (Quest.ts)
```typescript
{
  name: String,
  description: String,
  type: 'main' | 'daily' | 'side',
  questGiver: String,
  questGiverRoomId: ObjectId,
  objectives: [{
    type: 'kill' | 'talk' | 'collect' | 'visit' | 'profession',
    target: String,
    count: Number,
    progress: Number
  }],
  rewards: {
    exp: Number,
    gold: Number,
    items: [ObjectId]
  },
  levelRequirement: Number,
  professionRequirement: String,
  prerequisiteQuests: [ObjectId],
  isRepeatable: Boolean,
  active: Boolean,
  timestamps: true
}
```

### PlayerQuest Model (PlayerQuest.ts)
```typescript
{
  playerId: ObjectId,
  questId: ObjectId,
  status: 'active' | 'completed' | 'failed',
  objectives: [{
    type: String,
    target: String,
    count: Number,
    progress: Number
  }],
  startedAt: Date,
  completedAt: Date,
  lastDailyReset: Date,
  timestamps: true
}
```

### Player Model Updates (Player.ts)
```typescript
// Added fields:
profession: {
  type: String,
  enum: ['blacksmith', 'alchemist', 'enchanter', 'hunter', 'miner', 'herbalist', null],
  default: null
},
professionLevel: { type: Number, default: 0 },
professionExp: { type: Number, default: 0 }
```

## Usage Examples

### Opening World Map
1. Click **[Thế Giới]** button in footer
2. View all rooms with NPCs, mobs, bosses
3. Use search to find specific location
4. Click room card to see details
5. Click **[→] DI CHUYỂN ĐẾN ĐÂY** to navigate

### Managing Quests
1. Click **[Nhiệm Vụ]** button in footer
2. Switch between tabs: Active, Available, Completed
3. Click quest to view details
4. Complete objectives by playing the game
5. Click **[✓] HOÀN THÀNH NHIỆM VỤ** when ready
6. Receive rewards (exp, gold, items)

### Choosing Profession
1. Receive "Choose Profession" quest (first quest)
2. Open profession choice overlay
3. Review all 6 professions
4. Click profession card to select
5. Review details in side panel
6. Click **[✓] XÁC NHẬN CHỌN NGHỀ** to confirm
7. Receive starting equipment

## Mobile Testing

### Recommended Testing
1. **Chrome DevTools:**
   - F12 → Device toolbar
   - Test at 375px (iPhone SE), 768px (iPad)

2. **Key Mobile Scenarios:**
   - Open Talent Tree → check single column layout
   - Open Skills → check tabs wrap correctly
   - Open World Map → test search and navigation
   - Open Quests → test quest selection
   - Choose Profession → test profession selection

3. **Touch Targets:**
   - All buttons should be at least 44x44px
   - Cards should have clear hover/active states
   - Text should be readable at arm's length

## Future Improvements

### Quest System
- [ ] Quest objective tracking in game state
- [ ] Visual quest indicators on NPCs
- [ ] Quest chains and prerequisites
- [ ] Quest rewards preview
- [ ] Daily quest reset mechanism
- [ ] Quest notifications

### Profession System
- [ ] Profession-specific commands
- [ ] Crafting recipes
- [ ] Profession leveling system
- [ ] Profession-specific skills
- [ ] Profession trainer NPCs

### World Map
- [ ] Interactive map with drag/zoom
- [ ] Player position marker
- [ ] Pathfinding suggestions
- [ ] Room visit tracking
- [ ] Fog of war for unexplored areas

### Mobile UI
- [ ] Landscape mode optimization
- [ ] Gesture controls (swipe to navigate)
- [ ] Persistent quest tracker widget
- [ ] Quick action shortcuts
- [ ] Voice commands

## Testing Checklist

- [x] Build completes without errors
- [x] TypeScript type checks pass
- [x] All components render correctly
- [ ] World map loads and displays rooms
- [ ] Quest system shows quests correctly
- [ ] Profession choice works end-to-end
- [ ] Mobile layouts tested on small screens
- [ ] All buttons and interactions work on touch
- [ ] API endpoints return correct data
- [ ] Database models save and retrieve correctly

## Credits

- Implementation: GitHub Copilot
- Repository: pin705/vong_tich_thanh
- Tech Stack: Nuxt 3, Vue 3, TypeScript, MongoDB, Tailwind CSS
- Design Philosophy: "Function > Form with Modern UX"

## Version History

- **v2.0** (2025-01-05): Mobile UI optimization and quest system
  - Mobile responsive overlays
  - World map system
  - Quest/mission system
  - Profession system
  - Footer tab updates
  - API endpoints
  - Database schema updates
