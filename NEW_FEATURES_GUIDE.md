# New Features Guide - Three Activity Systems

This document describes the three new activity systems implemented in the game.

## 1. 👹 World Boss Hunt (Săn Boss Thế Giới)

### Overview
A large-scale PvE event where a powerful world boss spawns at scheduled times. All players can participate, and rewards are distributed based on contribution.

### How to Participate
1. **Schedule**: World bosses spawn daily at 8:00 PM (20:00) at designated locations
2. **Location**: Currently spawns at "Quảng Trường Đổ Nát" (Ruined Plaza)
3. **Combat**: Simply attack the boss when it spawns. Your damage contribution is tracked automatically.
4. **Rewards**: When the boss is defeated, all contributors receive rewards based on their damage dealt.

### Boss Types
- **Cỗ Máy Chiến Tranh Khổng Lồ** (Colossal War Mech)
  - HP: 100,000
  - Level: 50
  - Damage: 200
  - Special Mechanics: Enrage at 50% HP, Area Stomp attack every 30s

### Rewards
- **All Contributors**:
  - Gold (scales with contribution)
  - Bravery Medals (Huy Chương Dũng Cảm) - new currency
  
- **Top 3 Contributors**:
  - Bonus rewards multiplier (2x, 1.5x, 1.2x)
  - Special recognition broadcast
  
- **Top Contributor**:
  - [Lõi Robot Cổ Đại] - Legendary crafting material

### New Currency: Bravery Medals
- Earned from world boss participation
- Used to purchase special items from event NPCs (future implementation)

### New Items
- **[Lõi Robot Cổ Đại]** (Ancient Robot Core)
  - Type: Legendary crafting material
  - Description: Energy core from an ancient war machine
  - Use: Can be used for legendary item crafting

- **[Huy Hiệu Diệt Khổng Lồ]** (Giant Slayer Badge)
  - Type: Title Badge
  - Price: 100 Bravery Medals
  - Use: Grants permanent title "Diệt Khổng Lồ" (Giant Slayer)
  - Usage: `use huy hiệu diệt khổng lồ`

## 2. ⚔️ Ranked Arena (Đấu Trường PvP)

### Overview
An organized PvP system where players can queue for ranked matches and earn Glory Points to purchase exclusive arena gear.

### How to Participate
1. **Location**: Navigate to "Phòng Chờ Đấu Trường" (Arena Lobby)
   - From marketplace: `down` or `go down`
2. **Talk to NPC**: Find "Quản Lý Đấu Trường" (Arena Manager)
3. **Join Queue**: Use `talk quản lý đấu trường` and select "queue 1v1" option
4. **Matchmaking**: System automatically matches you with another player
5. **Fight**: Battle takes place in dedicated arena rooms
6. **Rewards**: Winner receives Glory Points

### Glory Points System
- Earned by winning arena matches
- Base reward: 10 points per victory
- Bonus points: 2 per level difference (fighting higher level opponents)
- Used to purchase arena-exclusive items

### Arena Rooms
- **Phòng Chờ Đấu Trường** (Arena Lobby) - Safe zone, queue here
- **Đấu Trường 1v1 - Phòng A/B** (Arena Battle Rooms) - PvP enabled

### Arena Shop
Talk to Arena Manager and select "list" to see available items:

- **[Giáp Đấu Sĩ]** (Gladiator Armor)
  - Type: Chest armor
  - Quality: Epic
  - Level Requirement: 20
  - Stats: +25 Defense, +100 HP
  - Special: Reduces 5% damage from players
  - Price: 500 Glory Points

- **[Huy Hiệu Vô Địch]** (Champion Badge)
  - Type: Title Badge
  - Use: Grants permanent title "Vô Địch Đấu Trường" (Arena Champion)
  - Price: 1000 Glory Points

### Notes
- Arena is a safe competitive environment separate from world PvP
- Match results are broadcast to all players
- Current queue size can be checked at Arena Manager

## 3. 🧩 Party Dungeon (Thám Hiểm Di Tích)

### Overview
An instanced dungeon designed for small parties (3-5 players) featuring puzzles, exploration, and mini-bosses.

### How to Participate
1. **Form a Party**: Create or join a party with 3-5 members
2. **Location**: Navigate to "Lối Vào Di Tích Cổ" (Ancient Ruins Entrance)
   - From forest: `east` or `go east`
3. **Talk to NPC**: Find "Nhà Khảo Cổ" (Archaeologist)
4. **Start Instance**: Party leader talks to Archaeologist and selects "explore"
5. **Solve Puzzles**: Work together to solve puzzles and defeat bosses
6. **Collect Rewards**: Complete the dungeon for party-wide rewards

### Dungeon: Ancient Tomb (Khu Hầm Mộ Cũ)

#### Layout
1. **Entrance** (Lối Vào)
2. **Hall 1** (Hành Lang) - Locked door requiring key
3. **Secret Room** (Phòng Bí Mật) - Password-protected door
4. **Treasure Room** (Phòng Kho Báu)
5. **Boss Room** (Phòng Boss)

#### Puzzle Mechanics

**Key Puzzle**
- Find [Chìa Khóa Rỉ Sét] (Rusty Key) in Secret Room
- Use key to unlock door in Hall 1
- Command: `use chìa khóa rỉ sét`

**Password Puzzle**
- Examine walls with `look bức tường`
- Find clue: "Có khắc chữ 'BÍ MẬT'"
- Say password to unlock: `say BÍ MẬT`

**Boss Fight**
- Defeat mini-boss at the end
- Requires good party coordination

### Rewards (Per Party Member)
- 200 Gold
- 300 EXP
- 50% chance: [Sách Kỹ Năng Cổ] (Ancient Skill Book)

### New Items

**[Sách Kỹ Năng Cổ]** (Ancient Skill Book)
- Type: Skill Upgrade Book
- Description: Contains knowledge to upgrade skills
- Use: Upgrade skill levels (future implementation)
- Rarity: Rare

**[Thức Ăn Pet Cao Cấp]** (Premium Pet Food)
- Type: Pet Food
- Description: High-quality pet food granting large EXP bonus
- EXP Bonus: 500 EXP for active pet
- Usage: `use thức ăn pet cao cấp` (requires active pet)

**[Đá Bảo Vệ]** (Protection Stone)
- Type: Enhancement Protection
- Description: Prevents equipment from downgrading on failed enhancement
- Rarity: Rare
- Usage: Future enhancement system integration

### Features
- **Instanced**: Each party gets their own dungeon copy
- **Party-Only**: Designed for group play
- **Puzzle-Focused**: Requires brain work, not just combat
- **Daily/Weekly**: Can be completed for rewards on a schedule

## Player Model Changes

New fields added to Player model:

```typescript
braveryMedals: Number  // Currency from world bosses
gloryPoints: Number    // Currency from arena PvP
title: String         // Display title (e.g., "Giant Slayer")
```

Check your currencies with appropriate commands once they're displayed in player stats.

## Item Model Changes

New item types:
- `TITLE_BADGE` - Items that grant permanent titles
- `SKILL_UPGRADE_BOOK` - Items to upgrade skill levels
- `ENHANCEMENT_PROTECTION` - Items to protect against enhancement failure

New item fields:
- `grantTitle` - Title granted when using badge
- `gloryPointsPrice` - Price in Glory Points
- `braveryMedalPrice` - Price in Bravery Medals
- `upgradesSkill` - Skill key this book upgrades

## Technical Notes

### Service Files
- **worldBossService.ts**: Manages world boss spawning, contribution tracking, and rewards
- **arenaService.ts**: Handles queue system, matchmaking, and match management
- **partyDungeonService.ts**: Manages dungeon instances, puzzles, and completion

### Integration Points
- World boss contribution is tracked automatically in combatSystem.ts
- World boss spawns are scheduled in scheduler.ts (daily at 8 PM)
- All items and NPCs are initialized in initWorld.ts

### Known Limitations
1. **PvP Combat**: Arena matches require additional combat system work to handle player-vs-player combat properly
2. **Instance Persistence**: Dungeon instances are stored in memory and lost on server restart
3. **Puzzle Commands**: Some puzzle interactions may need custom command handlers

## Future Enhancements
- Additional world boss types and spawn locations
- 2v2 and 3v3 arena modes
- More dungeon types with varied puzzles
- Skill upgrade system integration
- Enhancement system integration with protection stones
- Leaderboards for arena rankings
- Weekly/monthly arena seasons
- Dungeon difficulty tiers
- More puzzle types (lever, pressure plates, timed challenges)

## Testing Checklist
- [ ] World boss spawns at correct time
- [ ] Contribution tracking works correctly
- [ ] Top contributor receives legendary item
- [ ] Arena queue accepts players
- [ ] Matchmaking pairs players correctly
- [ ] Glory points awarded on victory
- [ ] Shop accepts glory points currency
- [ ] Party dungeon instance creation
- [ ] Puzzle mechanics function
- [ ] Rewards distributed to all party members
- [ ] Title badges grant titles when used
- [ ] Pet food grants EXP to active pet
