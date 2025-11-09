# Elemental System and Game Expansion

## Overview

This document describes the new elemental system, expanded pet templates, and enhanced skill system added to Vong Tích Thành.

## Elemental System

### Element Types

The game now supports 6 elemental types:
- **FIRE** (Lửa): Aggressive and powerful attacks
- **WATER** (Nước): Defensive and control-based abilities
- **EARTH** (Đất): Tanky and defensive
- **WIND** (Gió): Fast and agile attacks
- **LIGHTNING** (Sấm): High burst damage
- **NEUTRAL** (Trung lập): Balanced, no specific counter

### Elemental Counter System

Elements counter each other in a circular pattern:

```
FIRE → WIND → EARTH → WATER → FIRE
      ↓       ↓       ↓       ↓
    Strong  Strong  Strong  Strong
```

**Lightning** is neutral and doesn't participate in the counter system.

### Damage Effectiveness

- **Strong Advantage** (Elemental Counter): 1.5x damage
  - Fire vs Wind
  - Wind vs Earth
  - Earth vs Water
  - Water vs Fire
- **Weak Disadvantage** (Being Countered): 0.75x damage
  - Fire vs Water
  - Water vs Earth
  - Earth vs Wind
  - Wind vs Fire
- **Normal** (No advantage): 1.0x damage
  - Same elements
  - Lightning vs any
  - Any vs Lightning
  - Neutral combinations

### Combat Messages

When dealing elemental damage, players will see additional feedback:
- **(Hiệu quả!)** - Effective attack (1.5x damage)
- **(Kém hiệu quả)** - Ineffective attack (0.75x damage)
- No message - Normal damage (1.0x)

## Pet System Expansion

### New Pet Templates

10 pet templates are now available, each with unique stats and elemental affinities:

#### Basic Pets (Purchasable with Gold)

1. **Sói (Wolf)** - NEUTRAL
   - HP: 80, Attack: 12, Defense: 5
   - Growth: 15 HP, 2 ATK, 1 DEF per level
   - Cost: 500 gold

2. **Rùa Thần (Turtle)** - WATER
   - HP: 150, Attack: 10, Defense: 15
   - Growth: 25 HP, 1.5 ATK, 2.5 DEF per level
   - Cost: 800 gold

3. **Gấu Núi (Bear)** - EARTH
   - HP: 110, Attack: 15, Defense: 12
   - Growth: 20 HP, 2.5 ATK, 2 DEF per level
   - Cost: 700 gold

4. **Đại Bàng (Eagle)** - WIND
   - HP: 70, Attack: 14, Defense: 6
   - Growth: 14 HP, 2.5 ATK, 1 DEF per level
   - Cost: 600 gold

#### Premium Pets (Tamer Badge Required)

5. **Phượng Hoàng (Phoenix)** - FIRE
   - HP: 100, Attack: 18, Defense: 8
   - Growth: 20 HP, 3 ATK, 1.5 DEF per level
   - Cost: 20 Tamer Badges

6. **Rồng Lửa (Dragon)** - FIRE
   - HP: 120, Attack: 20, Defense: 10
   - Growth: 22 HP, 3.5 ATK, 2 DEF per level
   - Cost: 25 Tamer Badges

7. **Hải Xà (Serpent)** - WATER
   - HP: 90, Attack: 16, Defense: 7
   - Growth: 18 HP, 2.8 ATK, 1.2 DEF per level
   - Cost: 10 Tamer Badges

8. **Golem Đá (Golem)** - EARTH
   - HP: 140, Attack: 14, Defense: 18
   - Growth: 24 HP, 2 ATK, 3 DEF per level
   - Cost: 15 Tamer Badges

9. **Kỳ Lân Có Cánh (Griffin)** - WIND
   - HP: 95, Attack: 17, Defense: 9
   - Growth: 18 HP, 3 ATK, 1.5 DEF per level
   - Cost: 12 Tamer Badges

10. **Chim Sấm (Thunderbird)** - LIGHTNING
    - HP: 85, Attack: 19, Defense: 7
    - Growth: 16 HP, 3.2 ATK, 1.2 DEF per level
    - Cost: 18 Tamer Badges

### Pet Combat

Pets now use their elemental type in combat:
- Pet attacks apply elemental damage modifiers
- Pet element vs enemy element determines damage effectiveness
- Elemental advantage is shown in combat messages

## Enhanced Skill System

### New Skills by Class

#### Mutant Warrior (Chiến Binh Đột Biến)

| Level | Skill | Element | Damage | Cooldown | Description |
|-------|-------|---------|--------|----------|-------------|
| 1 | Chém Lửa | Fire | 50 | 5s | Basic fire slash |
| 5 | Khiên Đất | Earth | - | 15s | +30% defense for 10s |
| 10 | Chém Sấm | Lightning | 100 | 10s | Thunder slash with stun |
| 20 | Chém Địa Ngục | Fire | 200 | 20s | AoE fire damage |
| 25 | Sức Mạnh Titan | Neutral | - | 30s | +50% damage for 15s |
| 30 | Thịnh Nộ Núi Lửa | Fire | 250 | 35s | AoE fire damage with burn |

#### Rune Historian (Sử Gia Rune)

| Level | Skill | Element | Damage | Cooldown | Description |
|-------|-------|---------|--------|----------|-------------|
| 1 | Tên Nước | Water | 40 | 3s | Basic water bolt |
| 5 | Rào Cản Gió | Wind | - | 12s | +20% dodge for 8s |
| 10 | Bão Sét | Lightning | 120 | 15s | AoE lightning storm |
| 15 | Băng Nổ | Water | 90 | 18s | AoE frost with slow |
| 20 | Tinh Thông Phép Thuật | Neutral | - | 40s | -30% cooldowns for 20s |
| 30 | Thiên Thạch Rơi | Fire | 300 | 40s | Meteor strike with stun |
| 35 | Tinh Thông Nguyên Tố | Neutral | - | 60s | +100% elemental damage for 25s |

#### Stalker (Kẻ Rình Rập)

| Level | Skill | Element | Damage | Cooldown | Description |
|-------|-------|---------|--------|----------|-------------|
| 1 | Đòn Gió | Wind | 45 | 4s | Quick wind strike |
| 5 | Bước Bóng | Neutral | - | 10s | +40% dodge for 5s |
| 10 | Lưỡi Độc | Earth | 60 | 8s | Poison attack with DoT |
| 15 | Ám Sát | Neutral | 180 | 25s | Guaranteed critical hit |
| 25 | Cuồng Nộ Kiếm | Wind | - | 30s | +80% attack speed for 12s |
| 30 | Vũ Điệu Bóng Tối | Neutral | 80 | 38s | 5 rapid attacks |

#### Scrap Engineer (Kỹ Sư Phế Liệu)

| Level | Skill | Element | Damage | Cooldown | Description |
|-------|-------|---------|--------|----------|-------------|
| 1 | Súng Lửa | Fire | 30 | 20s | Deploy fire turret |
| 5 | Mìn Điện | Lightning | 80 | 12s | Electric mine with stun |
| 10 | Robot Sửa Chữa | Neutral | 50 heal | 25s | Deploy healing bot |
| 15 | Nổ Điện Từ | Lightning | 110 | 30s | EMP blast with silence |
| 20 | Giáp Máy | Earth | - | 45s | +60% HP and defense for 20s |
| 30 | Pháo Quỹ Đạo | Lightning | 280 | 50s | Orbital laser cannon |

### Skill Learning

Skills have level requirements that must be met before learning:
- Players must reach the required level
- Players must have enough skill points
- Class must match (or profession for profession skills)
- Prerequisite skills must be learned first (if any)

Skill points are earned by leveling up.

## Player Elemental Affinity

Players can have an elemental affinity that affects their damage:
- Default affinity is NEUTRAL
- Affinity determines base attack element
- Can potentially be changed through items or quests (future feature)

### Elemental Resistances

Players have resistance values for each element (default 0):
- Resistance reduces incoming damage of that element
- Can be increased through equipment and buffs
- Elemental resistances stored in player model

## How to Use

### For Players

1. **Check your elemental affinity**: View in character stats (future UI update)
2. **Learn elemental skills**: Visit skill trainers and learn skills for your class
3. **Get elemental pets**: Buy pet eggs from Huấn Luyện Sư Kito
4. **Use elemental advantages**: Attack enemies with counter elements for bonus damage

### For Developers

#### Adding New Elements

Edit `types/index.ts`:
```typescript
export type ElementType = 'FIRE' | 'WATER' | 'EARTH' | 'WIND' | 'LIGHTNING' | 'NEUTRAL' | 'NEW_ELEMENT';

export const ELEMENT_COUNTERS: Record<ElementType, ElementType | null> = {
  // ... existing counters
  NEW_ELEMENT: 'TARGET_ELEMENT',
};
```

#### Creating Elemental Skills

In `server/utils/initWorld.ts`:
```typescript
await SkillSchema.findOneAndUpdate(
  { skillKey: 'my_skill' },
  {
    skillKey: 'my_skill',
    name: 'My Skill',
    description: 'Description',
    class: 'mutant_warrior',
    element: 'FIRE', // Add elemental type
    damage: 100,
    levelRequirement: 10,
    // ... other properties
  },
  { upsert: true, new: true }
);
```

#### Creating Elemental Pets

In `server/utils/initWorld.ts`:
```typescript
await PetTemplateSchema.findOneAndUpdate(
  { petKey: 'my_pet' },
  {
    petKey: 'my_pet',
    name: 'My Pet',
    description: 'Description',
    element: 'WATER', // Add elemental type
    baseStats: { hp: 100, attack: 15, defense: 8 },
    statGrowth: { hpPerLevel: 20, attackPerLevel: 2, defensePerLevel: 1 }
  },
  { upsert: true, new: true }
);
```

## Future Enhancements

Potential additions to the elemental system:

1. **Elemental Weapons**: Weapons with elemental damage types
2. **Elemental Armor**: Armor with elemental resistances
3. **Elemental Zones**: Rooms with elemental effects
4. **Weather System**: Dynamic elemental bonuses based on weather
5. **Elemental Gems**: Socket gems that add elemental damage
6. **Dual Elements**: Skills or pets with two elements
7. **Elemental Combos**: Bonus effects when combining elements
8. **Player Affinity Quests**: Quests to change elemental affinity

## Balance Considerations

- Higher level skills should scale appropriately with level requirements
- Elemental counter system should feel rewarding but not mandatory
- Pet variety should encourage trying different elements
- Skills should have meaningful tradeoffs (damage vs utility, cooldown vs power)

## Testing Checklist

- [ ] Test all elemental damage calculations
- [ ] Verify pet elemental damage in combat
- [ ] Test skill learning with level requirements
- [ ] Verify pet shop has all new eggs
- [ ] Test elemental counter messages appear correctly
- [ ] Verify high-level skills require correct levels
- [ ] Test that neutral elements don't get bonuses/penalties
