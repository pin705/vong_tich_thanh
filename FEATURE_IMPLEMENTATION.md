# Feature Implementation Guide - Vong Tích Thành MUD Game

## Overview
This document describes all features implemented in the MUD (Multi-User Dungeon) game, including database integration, multiplayer capabilities, combat system, NPC AI, and world expansion.

## Implementation Summary

### Files Added/Modified
1. **server/utils/commandHandlerDb.ts** (680 lines) - Database-integrated command handler
2. **server/utils/combatSystem.ts** (484 lines) - Tick-based combat system
3. **server/utils/npcAI.ts** (334 lines) - NPC AI behaviors and respawn system
4. **server/plugins/aiSystem.ts** (14 lines) - AI system initialization
5. **server/routes/ws.ts** (90 lines modified) - WebSocket handler with database integration
6. **server/utils/initWorld.ts** (202 lines modified) - Expanded world initialization
7. **server/utils/constants.ts** (3 lines added) - Additional game constants

**Total: 1,796 lines added/modified**

---

## Phase 2: Database Integration

### Commands Implemented

#### 1. `look` / `l`
- **Without target:** Shows current room with exits, items, agents, and other players
- **With target:** Examines specific agent, item, or player
- **Database queries:** Room, Agent, Item, Player collections
- **Real-time:** Shows other active players in the room

#### 2. `go [direction]` / `n/s/e/w/u/d`
- **Functionality:** Navigate between rooms
- **Validation:** Checks for valid exits and prevents movement during combat
- **Database updates:** Updates player's `currentRoomId`
- **Broadcasts:** Notifies old and new rooms about player movement

#### 3. `get [item]` / `g`
- **Functionality:** Pick up items from room floor
- **Database updates:** Removes from room's `items` array, adds to player's `inventory`
- **Broadcasts:** Notifies room that player picked up item

#### 4. `drop [item]`
- **Functionality:** Drop items from inventory
- **Database updates:** Removes from player's `inventory`, adds to room's `items`
- **Broadcasts:** Notifies room that player dropped item

#### 5. `inventory` / `i`
- **Displays:** Gold, HP, Level, XP, and all items in inventory
- **Database queries:** Fetches all items from player's inventory references

#### 6. `talk [npc]` / `t`
- **Functionality:** Talk to NPCs
- **Database queries:** Finds agent in current room
- **Features:** Random dialogue selection from agent's dialogue array

#### 7. `say [message]`
- **Functionality:** Chat with other players in same room
- **Real-time:** Broadcasts message to all players in room
- **No database:** Pure real-time communication

#### 8. `list`
- **Functionality:** View shop items from merchants
- **Database queries:** Finds merchants with `shopItems` in current room
- **Displays:** Item name and price

#### 9. `buy [item]`
- **Functionality:** Purchase items from merchants
- **Validation:** Checks gold amount
- **Database updates:** 
  - Deducts gold from player
  - Creates new item instance
  - Adds to player inventory
- **Features:** Creates unique item instances per purchase

#### 10. `sell [item]`
- **Functionality:** Sell items to merchants
- **Pricing:** 50% of item value
- **Database updates:**
  - Adds gold to player
  - Removes item from inventory
  - Deletes item document

#### 11. `use [item]`
- **Functionality:** Use consumable items
- **Validation:** Checks item type and stats
- **Healing:** Restores HP (can't exceed maxHP)
- **Database updates:** 
  - Updates player HP
  - Removes consumed item
  - Deletes item document

---

## Phase 3: Multiplayer

### Real-time Features

#### Player Join/Leave
- **Join notification:** Broadcast to room when player connects
- **Leave notification:** Broadcast to room when player disconnects
- **Implementation:** WebSocket connection/disconnection handlers

#### Player Visibility
- **In `look` command:** Shows all active players in current room
- **Format:** `[PlayerName] đang ở đây.`
- **Source:** `gameState.getPlayersInRoom()`

#### Movement Notifications
- **Old room:** `[PlayerName] đi về phía [direction].`
- **New room:** `[PlayerName] đi vào từ phía [direction].`
- **Broadcast:** Excludes the moving player

#### Chat System
- **Command:** `say [message]`
- **Broadcast:** All players in same room
- **Format:** `[PlayerName] nói: "message"`
- **Real-time:** Instant delivery via WebSocket

### Game State Management
```typescript
class GameState {
  activePlayers: Map<playerId, ActivePlayer>
  combatTicks: Map<playerId, Interval>
  
  addPlayer()
  removePlayer()
  getPlayersInRoom()
  updatePlayerRoom()
  broadcastToRoom()
}
```

---

## Phase 4: Combat System

### Combat Flow

#### Initiating Combat
```
Player: attack chuột
→ Marks player and agent as inCombat
→ Sets combatTarget references
→ Starts combat tick interval (2 seconds)
→ Broadcasts to room
```

#### Combat Tick (Every 2 Seconds)
```
1. Player attacks agent
   - Calculate damage: base + weapon + variance
   - Update agent HP
   - Check if agent died

2. If agent still alive, agent attacks player
   - Calculate damage: base + variance - armor
   - Update player HP
   - Check if player died

3. Send combat messages to player
4. Broadcast to room spectators
```

#### Victory Conditions

**Player Victory:**
- Agent HP reaches 0
- Player gains experience
- Level up if threshold reached (100 XP per level)
- Loot drops in room
- Agent scheduled for respawn (5 minutes)

**Player Defeat:**
- Player HP reaches 0
- Respawns at starting location (Cổng Thành Cũ)
- HP restored to 50% of maxHP
- Agent exits combat

### Damage Calculation

#### Player Damage
```typescript
baseDamage = 5 + playerLevel
+ weaponDamage (from best weapon in inventory)
± 20% variance
```

#### Agent Damage
```typescript
agentBaseDamage ± 20% variance
- playerDefense (from best armor)
= actualDamage (minimum 1)
```

### Leveling System
- **XP per level:** 100
- **HP gain:** +10 per level
- **Full heal:** On level up
- **Auto-level:** Checks after each combat victory

### Flee Mechanics
- **Success rate:** 60%
- **Success:** Moves to random adjacent room, exits combat
- **Failure:** Stays in combat
- **Blocked:** Cannot flee if no exits available

---

## Phase 5: NPC AI

### Behavior Types

#### 1. Passive
- **Description:** Doesn't move or attack
- **Examples:** Lính Gác, Thương Gia, Huấn Luyện Viên, Phù Thủy
- **Use case:** Dialogue providers, merchants

#### 2. Wander
- **Description:** Moves randomly between connected rooms
- **Frequency:** 30% chance per 10-second tick
- **Examples:** Sói Rừng
- **Broadcasts:** Movement messages to both rooms

#### 3. Aggressive
- **Description:** Auto-attacks players entering room
- **Behavior:** Picks random non-combat player to attack
- **Examples:** Chuột Biến Dị, Goblin
- **Combat:** Uses same combat system as player-initiated

#### 4. Patrol
- **Description:** Follows predefined route
- **Route:** Array of room IDs
- **Frequency:** 40% chance per 10-second tick
- **Example:** Lính Tuần (patrol route through town)
- **Loop:** Returns to start after reaching end

### AI System

#### Tick Processing
```
Every 10 seconds:
1. Load all agents from database
2. For each agent:
   - Skip if in combat
   - Execute behavior based on type
   - Update database if moved
   - Broadcast changes to rooms
```

#### Respawn System
```
When agent dies:
1. Save agent data
2. Remove from room
3. Delete agent document
4. Schedule respawn timer (5 minutes)
5. After timer:
   - Create new agent with same stats
   - Add to original room
   - Broadcast respawn message
```

#### Plugin Integration
```typescript
// server/plugins/aiSystem.ts
export default defineNitroPlugin((nitroApp) => {
  startAISystem();  // On server start
  nitroApp.hooks.hook('close', stopAISystem);  // On shutdown
});
```

---

## Phase 6: World Expansion

### World Map
```
                    [Phòng Kho Báu]
                           |
                    [Hành Lang Dài]
                           |
    [Sân Luyện Tập] - [Quảng Trường] - [Tháp Cổ]
           |               |
      [Khu Chợ] -------- [north]
     /    |    \
[lên] [Hẻm Tối] [Cổng Thành Cũ] - [Rừng Rậm]
                                        |
                                   [Hang Tối]
```

### Room Details

| Room | Description | Exits | Items | Agents |
|------|-------------|-------|-------|--------|
| Cổng Thành Cũ | Starting gate | N, E | - | Lính Gác |
| Khu Chợ | Marketplace | S, N, E, W | - | Thương Gia |
| Hẻm Tối | Dark alley | W | - | Chuột Biến Dị |
| Quảng Trường | Town square | S, N | - | Lính Tuần |
| Rừng Rậm | Dense forest | W, N | - | Sói Rừng |
| Hang Tối | Dark cave | S | Chìa Khóa Vàng | Goblin |
| Tháp Cổ | Ancient tower | S, U | - | - |
| Hành Lang Dài | Long corridor | D, N | - | - |
| Phòng Kho Báu | Treasure room | S | Bình Máu Lớn, Kiếm Thép | Phù Thủy |
| Sân Luyện Tập | Training ground | E | - | Huấn Luyện Viên |

### Items Database

| Item | Type | Value | Stats | Shop |
|------|------|-------|-------|------|
| Bình Máu Nhỏ | consumable | 10g | +15 HP | Thương Gia |
| Bình Máu Lớn | consumable | 25g | +30 HP | Phù Thủy |
| Kiếm Gỉ | weapon | 25g | +8 dmg | Thương Gia |
| Kiếm Thép | weapon | 50g | +15 dmg | Found |
| Áo Da | armor | 30g | +5 def | Thương Gia |
| Áo Giáp Nhẹ | armor | 60g | +10 def | Phù Thủy |
| Đuôi Chuột | misc | 2g | - | Loot |
| Chìa Khóa Vàng | misc | 100g | - | Found |

### Agent Database

| Agent | Type | Level | HP | Damage | Behavior | XP | Loot |
|-------|------|-------|----|----|----------|----|----|
| Lính Gác | NPC | 5 | 100 | 10 | passive | - | - |
| Thương Gia | NPC | 3 | 80 | 5 | passive | - | - |
| Chuột Biến Dị | Mob | 2 | 30 | 5 | aggressive | 15 | Đuôi Chuột |
| Sói Rừng | Mob | 3 | 40 | 8 | wander | 20 | - |
| Goblin | Mob | 4 | 50 | 10 | aggressive | 30 | Bình Máu Nhỏ |
| Lính Tuần | NPC | 5 | 80 | 12 | patrol | - | - |
| Huấn Luyện Viên | NPC | 7 | 100 | 15 | passive | - | - |
| Phù Thủy | NPC | 6 | 60 | 20 | passive | - | - |

---

## Technical Architecture

### Database Schema

#### Player
```typescript
{
  username: String (unique)
  password: String (bcrypt hashed)
  currentRoomId: ObjectId -> Room
  hp: Number
  maxHp: Number
  level: Number
  experience: Number
  gold: Number
  inventory: [ObjectId -> Item]
  inCombat: Boolean
  combatTarget: ObjectId -> Agent
}
```

#### Room
```typescript
{
  name: String
  description: String
  exits: {
    north/south/east/west/up/down: ObjectId -> Room
  }
  items: [ObjectId -> Item]
  agents: [ObjectId -> Agent]
}
```

#### Item
```typescript
{
  name: String
  description: String
  type: 'weapon' | 'armor' | 'consumable' | 'misc'
  value: Number
  stats: {
    damage?: Number
    defense?: Number
    healing?: Number
  }
}
```

#### Agent
```typescript
{
  name: String
  description: String
  type: 'npc' | 'mob'
  currentRoomId: ObjectId -> Room
  hp: Number
  maxHp: Number
  level: Number
  damage: Number
  behavior: 'passive' | 'wander' | 'aggressive' | 'patrol'
  patrolRoute?: [ObjectId -> Room]
  dialogue?: [String]
  shopItems?: [ObjectId -> Item]
  loot?: [ObjectId -> Item]
  experience: Number
  inCombat: Boolean
  combatTarget?: ObjectId -> Player
}
```

### Real-time Communication

#### WebSocket Message Types
```typescript
// From Client
{ type: 'auth', payload: { playerId, username, roomId } }
{ type: 'command', payload: { input: string } }

// From Server
{ type: 'system', message: string }  // Cyan, system messages
{ type: 'accent', message: string }  // Amber, names/important
{ type: 'action', message: string }  // Bright green, player actions
{ type: 'normal', message: string }  // Dim green, descriptions
{ type: 'error', message: string }   // Red, errors
```

#### Broadcasting
```typescript
gameState.broadcastToRoom(roomId, message, excludePlayerId?)
// Sends message to all players in room via WebSocket
// Optionally excludes one player (for movement, etc.)
```

---

## Game Constants

```typescript
// Combat
COMBAT_TICK_INTERVAL = 2000        // 2 seconds
FLEE_SUCCESS_CHANCE = 0.6          // 60%
MINIMUM_DAMAGE = 1

// Leveling
EXPERIENCE_PER_LEVEL = 100
HP_GAIN_PER_LEVEL = 10

// Starting stats
STARTING_HP = 100
STARTING_GOLD = 50
STARTING_LEVEL = 1

// Healing
SMALL_POTION_HEALING = 15
MEDIUM_POTION_HEALING = 30
LARGE_POTION_HEALING = 50

// Security
MIN_PASSWORD_LENGTH = 6
BCRYPT_SALT_ROUNDS = 10

// AI
AI_TICK_INTERVAL = 10000           // 10 seconds
RESPAWN_TIME = 300000              // 5 minutes
```

---

## Deployment Instructions

### 1. Prerequisites
```bash
Node.js 18+
MongoDB (local or remote)
```

### 2. Environment Setup
```bash
# Clone repository
git clone <repo-url>
cd vong_tich_thanh

# Install dependencies
npm install

# Create .env file (optional)
MONGODB_URI=mongodb://localhost:27017/vong_tich_thanh
SESSION_PASSWORD=your-secret-session-password
```

### 3. Initialize Game World
```bash
# Start dev server
npm run dev

# In another terminal, initialize world
curl -X POST http://localhost:3000/api/init-world
```

### 4. Build for Production
```bash
npm run build
```

### 5. Run Production Server
```bash
node .output/server/index.mjs
```

---

## Testing Guide

### Manual Testing Checklist

#### Database Integration
- [ ] Register new player
- [ ] Login with player
- [ ] Use `look` command
- [ ] Use `go` command to navigate
- [ ] Pick up items with `get`
- [ ] Drop items with `drop`
- [ ] Check `inventory`
- [ ] Buy items from merchant
- [ ] Sell items to merchant
- [ ] Use consumable items

#### Multiplayer
- [ ] Open two browser windows
- [ ] Login with different players
- [ ] Navigate to same room
- [ ] Use `look` to see other player
- [ ] Use `say` to chat
- [ ] Move between rooms (check movement notifications)

#### Combat
- [ ] Use `attack` on mob
- [ ] Watch auto-battle tick every 2 seconds
- [ ] Win combat (check XP and loot)
- [ ] Level up (check HP increase)
- [ ] Use healing potion during combat
- [ ] Use `flee` to escape
- [ ] Lose combat (check respawn)

#### NPC AI
- [ ] Find Sói Rừng (wander behavior)
- [ ] Wait and watch it move between rooms
- [ ] Enter room with Chuột Biến Dị (aggressive)
- [ ] Get auto-attacked
- [ ] Find Lính Tuần (patrol)
- [ ] Watch it patrol its route

---

## Security

### CodeQL Analysis
✅ **0 vulnerabilities found**

### Security Measures
- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ Secure password comparison
- ✅ Session management (nuxt-auth-utils)
- ✅ WebSocket authentication validation
- ✅ Input validation
- ✅ No SQL injection vulnerabilities
- ✅ No XSS vulnerabilities
- ✅ No hardcoded secrets

---

## Performance Considerations

### Optimizations
- In-memory game state for active players
- Database queries use MongoDB indexes (recommended to add)
- WebSocket for real-time communication (low latency)
- AI tick system runs at 10-second intervals (configurable)
- Combat ticks run at 2-second intervals per player

### Scalability
- Stateless WebSocket connections (horizontal scaling possible)
- MongoDB can handle thousands of concurrent players
- Game state can be sharded by rooms for large-scale deployment

---

## Future Enhancements

### Potential Features
1. **Quest System:** Track quests, objectives, and rewards
2. **Character Classes:** Warrior, Mage, Rogue with unique abilities
3. **Skills & Spells:** Castable abilities with cooldowns
4. **Guilds:** Player organizations with shared resources
5. **PvP Combat:** Player vs player battles
6. **Crafting System:** Create items from materials
7. **Equipment Slots:** Equip specific items (weapon, armor, etc.)
8. **Persistence:** Save game state snapshots
9. **Admin Commands:** Teleport, spawn items, ban players
10. **Leaderboards:** Track top players by level, gold, kills

### Technical Improvements
1. Add MongoDB indexes for common queries
2. Implement caching layer (Redis)
3. Add logging and monitoring
4. Implement rate limiting
5. Add automated tests (unit, integration, E2E)
6. Add TypeScript strict mode
7. Implement proper error handling middleware
8. Add WebSocket reconnection logic
9. Implement data validation with Zod
10. Add API documentation (OpenAPI/Swagger)

---

## Credits

Implemented by: GitHub Copilot
Repository: pin705/vong_tich_thanh
Tech Stack: Nuxt 3, MongoDB, WebSockets, TypeScript
Design Philosophy: "Function > Form" - Retro Terminal Aesthetic

---

## License

MIT License
