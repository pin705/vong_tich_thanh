# Visual Feature Guide: Terminal Input CLI

## 1. Command History Demo

### Scenario: Fighting multiple enemies

```
Step 1: Type first attack
┌─────────────────────────────────────┐
│ > tấn công Chuột Biến Dị_          │
└─────────────────────────────────────┘

Step 2: Press Enter
┌─────────────────────────────────────┐
│ > tấn công Chuột Biến Dị           │
│ Bạn tấn công Chuột Biến Dị!        │
│ >_                                  │
└─────────────────────────────────────┘

Step 3: Press Up Arrow (↑)
┌─────────────────────────────────────┐
│ > tấn công Chuột Biến Dị           │
│ Bạn tấn công Chuột Biến Dị!        │
│ > tấn công Chuột Biến Dị_          │
└─────────────────────────────────────┘

Step 4: Press Enter to repeat attack
┌─────────────────────────────────────┐
│ > tấn công Chuột Biến Dị           │
│ Bạn tấn công Chuột Biến Dị!        │
│ > tấn công Chuột Biến Dị           │
│ Bạn tấn công Chuột Biến Dị lần nữa!│
│ >_                                  │
└─────────────────────────────────────┘
```

## 2. Tab Completion Demo

### Scenario: Multiple targets in room

```
Room contains:
- Chuột Biến Dị
- Chó Hoang
- Thương Gia

Step 1: Type partial command
┌─────────────────────────────────────┐
│ > tấn công ch_                     │
└─────────────────────────────────────┘

Step 2: Press Tab once
┌─────────────────────────────────────┐
│ > tấn công Chó Hoang_              │
└─────────────────────────────────────┘

Step 3: Press Tab again (cycle)
┌─────────────────────────────────────┐
│ > tấn công Chuột Biến Dị_          │
└─────────────────────────────────────┘

Step 4: Press Tab again (cycle back)
┌─────────────────────────────────────┐
│ > tấn công Chó Hoang_              │
└─────────────────────────────────────┘
```

## 3. Alias System Demo

### Scenario: Creating and using aliases

```
Step 1: Open Settings (Cài Đặt)
┌─────────────────────────────────────┐
│ CÀI ĐẶT                             │
│ ┌─────┬──────┬─────────┬─────────┐ │
│ │[1]  │ [2]  │  [3]    │  [4]    │ │
│ │Giao │ Âm   │ Lối     │ Gift    │ │
│ │Diện │ Thanh│ Chơi    │ Code    │ │
│ └─────┴──────┴─────────┴─────────┘ │
│                                     │
│ [Lối Chơi Tab Selected]             │
│                                     │
│ Lệnh Tắt (Alias):                   │
│ ┌─────────────────────────────────┐ │
│ │ aa → attack                  [✕]│ │
│ │ tc → talk                    [✕]│ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Thêm mới]                          │
│ ┌────────┐    ┌──────────────────┐ │
│ │di_     │ → │move              │ │
│ └────────┘    └──────────────────┘ │
│           [+]                       │
└─────────────────────────────────────┘

Step 2: Use alias in game
┌─────────────────────────────────────┐
│ > aa Chuột Biến Dị_                │
└─────────────────────────────────────┘

Step 3: Press Enter (alias expanded)
┌─────────────────────────────────────┐
│ > aa Chuột Biến Dị → attack Chuột  │
│   Biến Dị                           │
│ Bạn tấn công Chuột Biến Dị!        │
│ >_                                  │
└─────────────────────────────────────┘
```

## 4. Combined Features Demo

### Scenario: Efficient combat with all features

```
Preparation:
- Alias created: aa → attack
- Room has: Chuột Biến Dị

Combat Flow:
┌─────────────────────────────────────┐
│ > aa ch[TAB]                       │  (Type + Tab)
│ > aa Chuột Biến Dị_                │  (Completed)
│ [ENTER]                            │
│ > aa Chuột Biến Dị → attack Chuột  │  (Alias shown)
│   Biến Dị                           │
│ Bạn tấn công! -15 HP               │
│ >_                                  │
│ [↑]                                 │  (Press Up)
│ > aa Chuột Biến Dị_                │
│ [ENTER]                            │
│ Bạn tấn công! -15 HP               │
│ >_                                  │
│ [↑] [ENTER]                         │  (Up + Enter)
│ Bạn tấn công! -15 HP               │
│ >_                                  │
│ [↑] [ENTER]                         │  (Up + Enter)
│ Bạn tấn công! -15 HP               │
│ Chuột Biến Dị đã chết!             │
│ Bạn nhận được 50 exp!              │
│ >_                                  │
└─────────────────────────────────────┘

Summary: 
- First attack: Type "aa ch" + Tab + Enter (4 actions)
- Subsequent attacks: Up + Enter (2 actions each)
- 5x faster than typing full command each time!
```

## Keyboard Shortcuts Reference

```
┌─────────────────────────────────────────────────┐
│ KEYBOARD SHORTCUTS                              │
├─────────────────────────────────────────────────┤
│ ↑ (Up Arrow)    : Previous command in history   │
│ ↓ (Down Arrow)  : Next command in history       │
│ Tab             : Autocomplete target name      │
│ Tab (multiple)  : Cycle through matches         │
│ Enter           : Execute command               │
│ Ctrl/Cmd + H    : Open help                     │
│ F1              : Open help                     │
└─────────────────────────────────────────────────┘
```

## Tips for Maximum Efficiency

### 1. Common Aliases to Create
```
Movement:
n → north
s → south
e → east
w → west
u → up
d → down

Combat:
aa → attack
k → kill
f → flee

Interaction:
l → look
g → get
dr → drop
u → use
eq → equip

Social:
t → talk
s → say
w → whisper
p → party
```

### 2. Command History Best Practices
- Use history for repeated actions (combat, gathering)
- Press Up+Enter rapidly for continuous attacks
- Start typing new command to "break out" of history

### 3. Tab Completion Tricks
- Type minimum letters needed (usually 2-3)
- Tab through all options to see what's available
- Works with any target that starts with your prefix

### 4. Workflow Example
```
1. Create alias: aa → attack
2. Enter combat zone
3. Type: aa [first 2 letters of mob name]
4. Tab to complete name
5. Enter to attack
6. Up + Enter repeatedly to continue
7. Done!
```

## Benefits Summary

### Time Saved Per Action
- **Without features**: 
  - Type full command: ~5 seconds
  - Example: "attack Chuột Biến Dị" (20+ characters)

- **With alias**: 
  - ~3 seconds (saved 40%)
  - Example: "aa Chuột Biến Dị" (17 characters)

- **With alias + tab**: 
  - ~2 seconds (saved 60%)
  - Example: "aa ch[TAB]" (~5 keystrokes)

- **With history**: 
  - ~0.5 seconds (saved 90%)
  - Example: "[Up][Enter]" (2 keystrokes)

### Quality of Life Improvements
✓ Less typing = less fatigue
✓ No typos in target names
✓ Faster combat rotation
✓ Personalized command set
✓ Professional terminal feel
✓ Focus on strategy, not typing
