# In-Line Highlighting Examples

This document shows practical examples of how messages are transformed from plain text to structured spans.

## Example 1: Room Description with NPC

### Input:
```
"Một [Lính Gác] đang canh gác tại đây."
```

### Parsed Spans:
```json
[
  { "text": "Một ", "category": "default" },
  { "text": "[Lính Gác]", "category": "highlight" },
  { "text": " đang canh gác tại đây.", "category": "default" }
]
```

### Visual Rendering:
```
Một [Lính Gác] đang canh gác tại đây.
└─┘ └──────────┘ └─────────────────────┘
dim    amber           dim
(90%)  (10%)           (90%)
```

---

## Example 2: Combat Message

### Input:
```
"Bạn tấn công [Chuột Hoang] gây 45 sát thương!"
```

### Parsed Spans:
```json
[
  { "text": "Bạn tấn công ", "category": "default" },
  { "text": "[Chuột Hoang]", "category": "highlight" },
  { "text": " gây ", "category": "default" },
  { "text": "45 sát thương", "category": "damage" },
  { "text": "!", "category": "default" }
]
```

### Visual Rendering:
```
Bạn tấn công [Chuột Hoang] gây 45 sát thương!
└──────────┘ └───────────┘ └──┘ └────────────┘ └┘
   dim         amber       dim      red       dim
```

---

## Example 3: Multiple Highlights

### Input:
```
"[Thương Gia] bán [Thuốc Hồi Máu] với giá 100 vàng."
```

### Parsed Spans:
```json
[
  { "text": "[Thương Gia]", "category": "highlight" },
  { "text": " bán ", "category": "default" },
  { "text": "[Thuốc Hồi Máu]", "category": "highlight" },
  { "text": " với giá ", "category": "default" },
  { "text": "100 vàng", "category": "loot" },
  { "text": ".", "category": "default" }
]
```

### Visual Rendering:
```
[Thương Gia] bán [Thuốc Hồi Máu] với giá 100 vàng.
└──────────┘ └──┘ └──────────────┘ └───────┘ └───────┘ └┘
   amber      dim      amber         dim      gold    dim
```

---

## Example 4: Healing + XP + Loot

### Input:
```
"Bạn đánh bại [Boss Rồng]! Nhận 500 XP, 250 vàng và hồi 100 HP."
```

### Parsed Spans:
```json
[
  { "text": "Bạn đánh bại ", "category": "default" },
  { "text": "[Boss Rồng]", "category": "highlight" },
  { "text": "! Nhận ", "category": "default" },
  { "text": "500 XP", "category": "xp" },
  { "text": ", ", "category": "default" },
  { "text": "250 vàng", "category": "loot" },
  { "text": " và hồi ", "category": "default" },
  { "text": "100 HP", "category": "heal" },
  { "text": ".", "category": "default" }
]
```

### Visual Rendering:
```
Bạn đánh bại [Boss Rồng]! Nhận 500 XP, 250 vàng và hồi 100 HP.
└───────────┘ └─────────┘ └─────┘ └─────┘ └┘ └───────┘ └───────┘ └──────┘ └┘
    dim         amber      dim     xp     dim  gold     dim      heal   dim
                                   (theme)    (gold)           (green)
```

---

## Example 5: Plain Text (No Highlights)

### Input:
```
"Bạn đang ở trong một căn phòng tối."
```

### Parsed Spans:
```json
[
  { "text": "Bạn đang ở trong một căn phòng tối.", "category": "default" }
]
```

### Visual Rendering:
```
Bạn đang ở trong một căn phòng tối.
└──────────────────────────────────┘
              dim (100%)
```

---

## Color Legend

- **default**: `var(--text-dim)` - Comfortable dim green/gray
- **highlight**: `var(--text-accent)` - Amber (#FFB000) for keywords
- **damage**: `#ff6666` - Red for damage numbers
- **heal**: `#66ff66` - Green for healing
- **xp**: `var(--theme-text-xp)` - Themed color for experience
- **loot**: `var(--theme-text-loot)` - Themed color for gold/items

---

## Key Benefits Demonstrated

1. **90% Comfortable**: Most text uses dim, easy-on-eyes colors
2. **10% Highlighted**: Only truly important info stands out
3. **Context-Aware**: Different highlights for different types (damage vs heal vs loot)
4. **Natural Reading**: Highlighting doesn't break the flow of reading
5. **Information Hierarchy**: Eyes naturally drawn to important details

---

## Implementation Note

All these transformations happen automatically on the server using the `parseMessageIntoSpans()` function. The client simply renders the spans with appropriate CSS classes. This keeps the logic centralized and makes it easy to add new patterns in the future.
