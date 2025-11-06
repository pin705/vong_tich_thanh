# Terminal Input CLI Features - Quick Reference

## 🎮 Three Powerful Features

```
┌─────────────────────────────────────────────────────────────────┐
│                   TERMINAL INPUT CLI FEATURES                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1️⃣  COMMAND HISTORY (Lịch sử Lệnh)                             │
│     ↑ Up Arrow     : Previous command                           │
│     ↓ Down Arrow   : Next command                               │
│     💾 Persistent  : Saved to localStorage                      │
│                                                                  │
│  2️⃣  TAB COMPLETION (Tự động Hoàn thành)                        │
│     ⭾ Tab         : Complete target name                       │
│     ⭾ Tab (×2)    : Cycle through matches                       │
│     🎯 Smart      : Knows players, NPCs, mobs, items            │
│                                                                  │
│  3️⃣  ALIASES (Lệnh Tắt)                                          │
│     ⚙️  Settings   : Create custom shortcuts                    │
│     ⚡ Automatic  : Expands before execution                    │
│     👁️  Visible    : Shows expansion in echo                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Efficiency Comparison

```
WITHOUT FEATURES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: "attack Chuột Biến Dị" → [Enter]
      ├─ 20+ characters
      ├─ ~5 seconds
      └─ High error rate (typos)

Repeat 5x = 100+ characters, 25+ seconds
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WITH FEATURES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Setup alias: aa → attack (once)
First: "aa ch" → [Tab] → [Enter]
       ├─ 5 keystrokes
       ├─ ~2 seconds
       └─ Zero errors
Next 4: [↑] → [Enter]
        ├─ 2 keystrokes each
        ├─ ~0.5 seconds each
        └─ Zero errors

Total = 13 keystrokes, 4 seconds
SAVINGS: 87% fewer keystrokes, 84% faster
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🎯 Common Use Cases

### Combat Rotation
```
1. Create alias: aa → attack
2. Type: aa [first letters][Tab]
3. Press: ↑ + Enter to repeat
Result: Fast, efficient combat!
```

### Trading
```
1. Type: talk th[Tab]
2. Cycles: Thương Gia, Thợ Săn, Thợ Rèn
3. Select with Tab, execute with Enter
Result: Quick NPC interaction!
```

### Item Management
```
1. Type: use cỏ[Tab]
2. Completes: use Cỏ Chữa Lành
3. Press: ↑ + Enter to heal again
Result: Instant item use!
```

## ⚙️ Setup Guide

### Step 1: Create Your Aliases
```
Open Settings → Lối Chơi → Lệnh Tắt

Recommended aliases:
┌──────┬────────────┬──────────────────┐
│ aa   │ →  attack  │ Fast combat      │
│ l    │ →  look    │ Quick look       │
│ i    │ →  inv     │ Check inventory  │
│ n/s  │ →  n/s     │ Fast movement    │
│ e/w  │ →  e/w     │ Fast movement    │
│ tc   │ →  talk    │ Quick chat       │
│ gt   │ →  goto    │ Fast travel      │
└──────┴────────────┴──────────────────┘
```

### Step 2: Learn the Keys
```
Keyboard Layout:
┌─────────────────────────────────┐
│  ↑   : Go back in history       │
│  ↓   : Go forward in history    │
│  Tab : Complete target name     │
│  ⏎   : Execute command          │
└─────────────────────────────────┘
```

### Step 3: Practice!
```
Simple drill:
1. aa ch[Tab] [Enter]     ← First attack
2. [↑] [Enter]            ← Repeat
3. [↑] [Enter]            ← Repeat
4. [↑] [Enter]            ← Repeat

You're now a CLI master! 🎓
```

## 💡 Pro Tips

### Tip 1: Alias Strategy
```
Single-letter aliases for most frequent commands:
a  → attack
l  → look
i  → inventory
g  → get

Two-letter for specific actions:
aa → attack
gt → goto
tc → talk
dr → drop
```

### Tip 2: Tab Mastery
```
Don't type full names!
❌ "attack Chuột Biến Dị"
✅ "aa ch[Tab]"

Works with Vietnamese:
✅ "tc th[Tab]" → "tc Thương Gia"
```

### Tip 3: History Hacks
```
Scenario: Multiple targets in room

Type once:
> aa Chuột 1[Enter]

Then just:
> [↑][Backspace]2[Enter]  ← Kill #2
> [↑][Backspace]3[Enter]  ← Kill #3
> [↑][Backspace]4[Enter]  ← Kill #4
```

## 🚀 Workflow Examples

### Example 1: Dungeon Grinding
```
┌─────────────────────────────────┐
│ 1. Enter room                   │
│ 2. l [Enter]        (look)      │
│ 3. aa [first letters][Tab]      │
│ 4. [↑][Enter] × N   (repeat)    │
│ 5. g all[Enter]     (get loot)  │
│ 6. n [Enter]        (next room) │
│ 7. Repeat from #2               │
└─────────────────────────────────┘

Time per room: ~10 seconds
Keystrokes: ~15
```

### Example 2: Quest Dialogue
```
┌─────────────────────────────────┐
│ 1. tc [NPC][Tab]                │
│ 2. Read dialogue                 │
│ 3. [↑][Enter]   (ask again)     │
│ 4. Read more                     │
│ 5. Done!                         │
└─────────────────────────────────┘

No retyping NPC names!
```

### Example 3: Item Management
```
┌─────────────────────────────────┐
│ 1. i [Enter]     (check items)  │
│ 2. use [item][Tab][Enter]       │
│ 3. [↑][Enter]    (use again)    │
│ 4. [↑][Enter]    (use again)    │
└─────────────────────────────────┘

Perfect for healing!
```

## 📈 Skill Progression

```
BEGINNER (Day 1):
├─ Learn ↑/↓ for history
├─ Try Tab once or twice
└─ Create 1-2 aliases

INTERMEDIATE (Week 1):
├─ Use history fluently
├─ Tab complete everything
└─ Have 5-10 aliases

ADVANCED (Month 1):
├─ Never type full commands
├─ Muscle memory for all shortcuts
└─ 3-5x faster than beginners

MASTER (Always):
├─ Customize for every situation
├─ Chain features seamlessly
└─ Play at maximum efficiency
```

## 🎯 Success Metrics

You know you've mastered the CLI when:
- ✅ You press ↑ without thinking
- ✅ Your fingers hit Tab automatically
- ✅ You never type full target names
- ✅ Combat feels fluid and fast
- ✅ You've customized 10+ aliases
- ✅ Other players ask "how are you so fast?"

## 🏆 Achievement Unlocked

```
╔═══════════════════════════════════════╗
║  🎮 TERMINAL MASTER ACHIEVEMENT 🎮   ║
║                                       ║
║  You have unlocked the full power    ║
║  of the Terminal Input CLI!          ║
║                                       ║
║  Benefits:                            ║
║  • 90% less typing                   ║
║  • Zero typos                        ║
║  • Maximum efficiency                ║
║  • Professional gamer status         ║
║                                       ║
║  Không Nhựa approved! ✓              ║
╚═══════════════════════════════════════╝
```

---

**Remember**: These features are here to serve you. Use them your way, at your pace. The goal is to make the game more enjoyable, not more complex!

**Philosophy**: "The interface adapts to the player, not the other way around."

---

For detailed technical information, see:
- `TERMINAL_INPUT_FEATURES.md` - Technical documentation
- `VISUAL_TERMINAL_GUIDE.md` - Detailed visual guide
- `IMPLEMENTATION_COMPLETE_TERMINAL_CLI.md` - Implementation summary
