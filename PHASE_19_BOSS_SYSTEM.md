# Phase 19: Boss System Documentation

## Overview
The Boss System adds elite and boss enemies with scripted mechanics to the game. This document explains how to create and configure boss agents.

## Database Schema Changes

### Agent Model
- `agentType`: String enum ('mob', 'elite', 'boss') - Defines agent difficulty tier
- `mechanics`: Array - Scripted boss mechanics definitions

### Item Model
- `rarity`: String enum ('common', 'uncommon', 'rare', 'epic', 'legendary') - Item rarity for boss loot

### Room Model
- `isBossLair`: Boolean - Marks room as boss lair
- `respawnTimeSeconds`: Number - Custom respawn time (e.g., 3600 for 1 hour boss respawns)

## Creating a Boss Agent

### Example: Ancient Guardian Boss

```javascript
const bossAgent = await AgentSchema.create({
  name: 'Cổ Máy Hủy Diệt',
  description: 'Một cổ vật khổng lồ được kích hoạt bởi ma lực cổ đại.',
  type: 'mob',
  agentType: 'boss', // Mark as boss
  currentRoomId: bossRoomId,
  hp: 5000,
  maxHp: 5000,
  level: 20,
  damage: 80,
  behavior: 'aggressive',
  loot: [epicWeaponId, legendaryArmorId], // Boss-tier loot
  experience: 100, // Base EXP (will be multiplied by 50x)
  
  // Boss Mechanics Configuration
  mechanics: [
    {
      trigger: 'health_below_50',
      action: 'enrage',
      cooldown: 0 // One-time trigger
    },
    {
      trigger: 'timer_30s',
      action: 'summon_minions',
      cooldown: 30 // Every 30 seconds
    },
    {
      trigger: 'timer_45s',
      action: 'cast_stomp',
      cooldown: 45 // Every 45 seconds
    }
  ]
});
```

### Example: Elite Agent

```javascript
const eliteAgent = await AgentSchema.create({
  name: 'Chiến Binh Tinh Anh',
  description: 'Một chiến binh được huấn luyện bài bản.',
  type: 'mob',
  agentType: 'elite', // Mark as elite (3x EXP)
  currentRoomId: roomId,
  hp: 500,
  maxHp: 500,
  level: 10,
  damage: 25,
  behavior: 'aggressive',
  loot: [rareWeaponId],
  experience: 30,
  mechanics: [] // Elites can have simple mechanics or none
});
```

### Boss Room Configuration

```javascript
const bossRoom = await RoomSchema.create({
  name: 'Điện Thần Cổ Đại',
  description: 'Một điện thờ cổ xưa, nơi Cổ Máy Hủy Diệt đang canh giữ.',
  exits: {
    south: previousRoomId
  },
  isBossLair: true,
  respawnTimeSeconds: 3600, // Boss respawns after 1 hour
  agents: [bossAgentId]
});
```

## Available Boss Mechanics

### Triggers

1. **health_below_50**: Triggers when boss HP drops below 50%
2. **health_below_25**: Triggers when boss HP drops below 25%
3. **timer_30s**: Triggers every 30 seconds
4. **timer_45s**: Triggers every 45 seconds
5. **timer_60s**: Triggers every 60 seconds

### Actions

1. **enrage**: Increases boss damage by 50% (usually one-time at 50% HP)
   ```
   Message: "[Boss Name] gầm lên giận dữ, sát thương của nó tăng vọt!"
   ```

2. **summon_minions**: Spawns 2 minion agents (30% boss HP, 40% boss damage)
   ```
   Message: "[Boss Name] triệu hồi thêm lính canh!"
   ```

3. **cast_stomp**: Casts AoE spell with 3-second warning, deals (150 + level * 10) damage to all players
   ```
   Warning: "[Boss Name] bắt đầu niệm chú [Dậm Đất Hủy Diệt]!"
   Execute: "[Boss Name] DẬM XUỐNG! Tất cả mọi người mất X sát thương!"
   ```

4. **heal_self**: Heals boss for 20% of max HP
   ```
   Message: "[Boss Name] hồi phục X HP!"
   ```

## Boss Rewards

### Experience Points
- **Boss**: 50x base EXP (e.g., 100 base = 5000 EXP total)
- **Elite**: 3x base EXP (e.g., 30 base = 90 EXP total)
- **Regular Mob**: 1x base EXP

### Currency (Boss Only)
- **Gold**: Level * 100 (e.g., Level 20 boss = 2000 gold)
- **Premium Currency (Cổ Thạch)**: Level * 10 (e.g., Level 20 boss = 200 Cổ Thạch)

### Loot
- Boss loot items should have `rarity: 'epic'` or `rarity: 'legendary'`
- Loot drops are highlighted: `✨ [Boss Name] làm rơi ra [Item Name] (epic)!`

## Party Integration

Boss rewards are automatically distributed to party members:
- EXP is shared equally among party members in the same room
- Individual EXP buffs are applied per member
- Gold and premium currency go to the killer
- Loot follows party loot rules (round-robin or leader-only)

## Boss Cast Warning UI

The UI automatically displays a cast bar when boss starts casting:
```
[ Mục tiêu: Cổ Máy Hủy Diệt ]
HP:   [||||||||||||||||----] 80%
Cast: [Dậm Đất] [||||||--] (2.5s)
```

Players receive WebSocket message:
```json
{
  "type": "boss_cast_start",
  "targetId": "boss_id",
  "targetName": "Cổ Máy Hủy Diệt",
  "spellName": "Dậm Đất Hủy Diệt",
  "castTime": 3000
}
```

## Technical Notes

### AI Processing
- Boss mechanics are processed every 2 seconds (faster than regular NPC AI)
- Regular NPC AI runs every 10 seconds
- Both systems run independently

### State Management
- Boss states are tracked in-memory during combat
- States are cleared when boss dies
- Cooldowns prevent mechanic spam

### Respawn System
- Uses `respawnTimeSeconds` from Room model
- Default: 300 seconds (5 minutes) for regular mobs
- Recommended: 3600 seconds (1 hour) for bosses
- Boss mechanics and state are preserved on respawn

## Example Boss Encounter Flow

1. Player enters boss room
2. Boss aggros (behavior: 'aggressive')
3. Combat starts
4. At 70% HP: Boss casts Stomp (timer_45s triggered)
   - Players see cast warning for 3 seconds
   - After 3 seconds, all players take damage
5. At 50% HP: Boss enrages (health_below_50 triggered)
   - Damage permanently increased by 50%
6. At 30s: Boss summons minions (timer_30s triggered)
   - 2 minions spawn and join combat
7. Boss defeated
   - Party receives 50x EXP (shared)
   - Killer receives gold and premium currency
   - Epic/legendary items drop to room
   - Boss respawns after 1 hour

## Constants Reference

From `server/utils/bossMechanics.ts`:
- `STOMP_BASE_DAMAGE`: 150 (base AoE damage, scales with level)
- `HEAL_PERCENTAGE`: 0.2 (20% of max HP)
- `STARTING_ROOM_NAME`: 'Cổng Thành Cũ' (respawn location for defeated players)

## Testing

To test the boss system:
1. Create a boss agent with mechanics
2. Set up a boss lair room with long respawn time
3. Enter combat with the boss
4. Verify mechanics trigger at correct thresholds
5. Verify cast warnings appear in UI
6. Verify boss rewards are distributed correctly
7. Verify boss respawns after specified time
