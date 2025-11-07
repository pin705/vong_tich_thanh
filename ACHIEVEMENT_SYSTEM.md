# Achievement & Title System

## Overview

The Achievement & Title System is a comprehensive feature that rewards players for completing various in-game activities. Players can unlock achievements by:
- Killing enemies (KILL_AGENT)
- Exploring new rooms (VISIT_ROOM)
- Completing quests (COMPLETE_QUEST)
- Collecting items (GET_ITEM)

Completing achievements grants rewards such as experience, gold, and special titles that provide stat bonuses.

## Architecture

### Database Models

1. **Achievement.ts** - Achievement templates/definitions
   - `achievementKey`: Unique identifier
   - `name`: Display name
   - `description`: What the achievement requires
   - `category`: COMBAT, EXPLORATION, SOCIAL, or COLLECTION
   - `criteria`: Conditions to complete (type, key, amount)
   - `rewards`: EXP, gold, and optional title

2. **PlayerAchievement.ts** - Player progress tracking
   - `playerId`: Reference to player
   - `achievementKey`: Which achievement
   - `progress`: Current progress (e.g., 45/100)
   - `target`: Goal amount
   - `completed`: Whether it's done

3. **Player.ts** (updated)
   - `unlockedTitles`: Array of titles the player has earned
   - `activeTitleKey`: Currently equipped title (for stat bonuses)

### Core Service

**achievementService.ts** - Central event processing
- `postEvent(playerId, eventType, data)`: Records player actions
- Supports wildcard matching (key: '*') for generic achievements
- Automatically increments progress and completes achievements
- Grants rewards and sends notifications via WebSocket

### Integration Points

The system hooks into existing game systems:
- **combatSystem.ts**: KILL_AGENT events when enemies die
- **movement.ts**: VISIT_ROOM events when entering new rooms
- **complete.post.ts**: COMPLETE_QUEST events when quests finish
- **item.ts**: GET_ITEM events when picking up items

### Stats Integration

**playerStats.ts** (updated)
- Applies title stat bonuses when calculating player stats
- `recalculateStats()` called after equipping/unequipping titles
- Title bonuses stack with equipment and other bonuses

## API Endpoints

### Player Endpoints

- **GET /api/player/achievements**
  - Returns all achievements with player progress
  - Groups by category (COMBAT, EXPLORATION, SOCIAL, COLLECTION)
  
- **POST /api/player/equip-title**
  - Body: `{ titleKey: 'string' }` or `{ titleKey: null }` to unequip
  - Equips a title and recalculates player stats
  - Returns success/error message

### Admin Endpoints

- **POST /api/admin/achievements/init**
  - Initializes the database with sample achievements
  - Safe to call multiple times (uses upsert)
  - Returns count of created/updated achievements

## UI Components

### AchievementOverlay.vue
- Tabbed interface showing achievements by category
- Progress bars for each achievement
- Visual indication of completed achievements (✓)
- Shows rewards (EXP, gold, titles)

### TitleOverlay.vue
- Lists all unlocked titles
- Shows stat bonuses for each title
- Click to equip/unequip
- Visual indication of active title

## Usage

### Initializing Achievements

```bash
# Call the init endpoint to populate sample achievements
POST /api/admin/achievements/init
```

### Opening UI from Code

```javascript
// In Vue component
import { useGamePopups } from '~/composables/useGamePopups';

const { openAchievements, openTitles } = useGamePopups();

// Open achievement overlay
openAchievements();

// Open title overlay
openTitles();
```

### Creating New Achievements

Add to `server/data/sampleAchievements.ts`:

```javascript
{
  achievementKey: 'my_achievement',
  name: 'My Achievement',
  description: 'Do something 10 times',
  category: 'COMBAT', // or EXPLORATION, SOCIAL, COLLECTION
  criteria: {
    type: 'KILL_AGENT', // or VISIT_ROOM, COMPLETE_QUEST, GET_ITEM
    key: 'enemy_key', // or '*' for any
    amount: 10,
  },
  rewards: {
    exp: 100,
    gold: 50,
    title: {
      key: 'my_title',
      name: '[My Title]',
      stats: {
        attack: 5,
        hp: 20,
        defense: 10,
      },
    },
  },
}
```

Then call `/api/admin/achievements/init` to update the database.

## Sample Achievements

The system includes 10 sample achievements:
- **Tân Binh**: Kill 10 enemies
- **Chiến Binh**: Kill 50 enemies (grants [Chiến Binh] title)
- **Kẻ Diệt Goblin**: Kill 100 goblins (grants [Kẻ Diệt Goblin] title)
- **Nhà Thám Hiểm Mới**: Visit 10 rooms
- **Nhà Thám Hiểm Kỳ Cựu**: Visit 50 rooms (grants [Nhà Thám Hiểm] title)
- **Phát Hiện Bí Mật**: Visit the secret cave
- **Người Hoàn Thành Nhiệm Vụ**: Complete 5 quests
- **Anh Hùng Của Vùng Đất**: Complete 20 quests (grants [Anh Hùng] title)
- **Nhà Sưu Tập Nghiệp Dư**: Collect 10 items
- **Nhà Sưu Tập Chuyên Nghiệp**: Collect 50 items (grants [Nhà Sưu Tập] title)

## Title Stats

Titles provide various stat bonuses:
- **attack**: Bonus damage
- **hp**: Bonus health
- **defense**: Bonus armor
- **critChance**: Bonus critical hit chance (%)
- **critDamage**: Bonus critical hit damage (%)
- **dodge**: Bonus dodge chance (%)
- **lifesteal**: Bonus lifesteal (%)

## Event Flow

1. Player performs an action (kills enemy, visits room, etc.)
2. Game code calls `achievementService.postEvent(playerId, eventType, { key })`
3. Service finds all matching achievements (exact match or wildcard)
4. Updates player progress in database
5. If achievement completed:
   - Marks as completed with timestamp
   - Grants rewards (EXP, gold)
   - Unlocks title if specified
   - Sends WebSocket notification to player
6. Player can view progress in Achievement UI
7. Player can equip titles in Title UI to gain stat bonuses

## Testing

To test the system:
1. Initialize achievements: `POST /api/admin/achievements/init`
2. Play the game and perform actions
3. Open achievement overlay to see progress
4. Complete achievements to unlock titles
5. Equip titles to gain stat bonuses
6. Check player stats to verify bonuses are applied

## Future Enhancements

Possible improvements:
- Achievement categories (Daily, Weekly, One-time)
- Achievement chains (unlock one to enable another)
- Leaderboards for achievement completion
- Rare/hidden achievements with special rewards
- Achievement points system
- Title customization (colors, effects)
- More title stat types
- Achievement notifications in UI (toast/banner)
