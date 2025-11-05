# Phase 16: Party System Implementation

## Overview
A complete party system (Hệ Thống Tổ Đội) has been implemented for the Vong Tích Thành MUD game. This system allows players to form groups, share experience points, coordinate loot distribution, and communicate via a dedicated party chat channel.

## Features Implemented

### 1. Server-Side Party Management (Task 16.1)

**File**: `server/utils/partyService.ts`

- **PartyService**: In-memory party management system
  - `PartyState` interface with:
    - `leaderId`: ID of the party leader
    - `memberIds`: Set of member player IDs
    - `lootRule`: 'leader-only' or 'round-robin'
    - `lootTurn`: Current loot turn for round-robin
    - `invitations`: Pending party invitations
  
- **Key Methods**:
  - `createParty(leaderId)`: Create new party
  - `invitePlayer(inviterId, inviteeId)`: Send invitation
  - `acceptInvitation(inviteeId, inviterId)`: Accept invite
  - `declineInvitation(inviteeId, inviterId)`: Decline invite
  - `leaveParty(playerId)`: Leave party
  - `kickPlayer(leaderId, targetId)`: Kick member (leader only)
  - `promotePlayer(leaderId, targetId)`: Promote to leader (leader only)
  - `setLootRule(leaderId, rule)`: Set loot distribution rule (leader only)
  - `canLoot(playerId)`: Check if player can loot
  - `advanceLootTurn(partyId)`: Move to next looter
  - `cleanupOldInvitations()`: Auto-cleanup invitations older than 5 minutes

### 2. Party Commands (Task 16.2)

**File**: `server/utils/commandHandlerDb.ts`

All party commands with Vietnamese aliases:

| Command | Aliases | Description | Requires Leader |
|---------|---------|-------------|----------------|
| `party invite [name]` | `moi [name]` | Invite player to party | No |
| `party accept` | - | Accept invitation | No |
| `party decline` | - | Decline invitation | No |
| `party leave` | `roi` | Leave party | No |
| `party kick [name]` | - | Kick member | Yes |
| `party promote [name]` | - | Promote to leader | Yes |
| `party loot [rule]` | - | Set loot rule | Yes |
| `p [message]` | - | Party chat | No |
| `party` | - | Show party status | No |

**Loot Rules**:
- `leader-only`: Only party leader can loot
- `round-robin`: Members take turns looting

### 3. UI Components (Task 16.3-16.5)

#### FooterTabBar Update
**File**: `components/FooterTabBar.vue`
- Added **[Nhóm]** button to footer menu

#### Party Management Popup
**File**: `components/PartyPopup.vue`

Features:
- Display all party members with:
  - Leader indicator (L) or Team member (T)
  - HP and Resource bars (color-coded)
  - Class names in Vietnamese
  - Status effects (buffs/debuffs)
- Loot rule selector (clickable, leader only)
- Leave party button
- Click members to open contextual menu

Member display format:
```
(L) [PlayerName] (Sử Gia)
    HP: [||||||----] 60/100
    Mana: [||||||||--] 80/100
    [Độc](Debuff)
```

#### Party Invitation Popup
**File**: `components/PartyInvitationPopup.vue`

Features:
- Shows inviter name and class
- Accept/Decline buttons
- Auto-triggered via WebSocket

### 4. EXP & Loot Distribution (Task 16.6)

**File**: `server/utils/combatSystem.ts`

#### EXP Sharing
- `distributeExperience()` function:
  - Solo: 100% EXP to killer
  - Party: EXP split evenly among nearby members (same room)
  - Notification shows party EXP share

Example:
```
Bạn nhận được 15 điểm kinh nghiệm (Nhóm - 3 thành viên).
```

#### Loot Distribution
**File**: `server/utils/commandHandlerDb.ts` (get command)

- **Leader-only**: Only leader can use `get` command
  - Others see: "Chỉ nhóm trưởng mới có thể nhặt đồ."

- **Round-robin**: 
  - System tracks current turn
  - Notifies next looter after each pickup
  - Others see: "Đến lượt người khác nhặt đồ."

When mob dies:
```
[Mob] làm rơi ra một [Sword].
Loot Turn: Đến lượt [Player_A] nhặt đồ.
```

### 5. Party Chat (Task 16.7)

**File**: `server/utils/commandHandlerDb.ts`

Command: `p [message]`

Features:
- Broadcasts to all party members regardless of location
- Distinct light blue color (#4da6ff)
- Format: `[Nhóm][PlayerName]: message`

WebSocket message structure:
```json
{
  "type": "chat",
  "category": "party",
  "user": "PlayerName",
  "message": "Cẩn thận, boss sắp ra chiêu!"
}
```

### 6. WebSocket Integration (Task 16.4-16.5)

**File**: `server/routes/ws.ts`

New WebSocket message types:

#### `party_state`
Sent on connect and after party commands
```json
{
  "type": "party_state",
  "payload": {
    "hasParty": true,
    "members": [
      {
        "id": "...",
        "name": "Player",
        "class": "mutant_warrior",
        "level": 5,
        "hp": 100,
        "maxHp": 100,
        "resource": 50,
        "maxResource": 100,
        "isLeader": true,
        "statusEffects": []
      }
    ],
    "lootRule": "round-robin",
    "isLeader": true
  }
}
```

#### `party_invitation`
Sent when player receives invite
```json
{
  "type": "party_invitation",
  "payload": {
    "inviterId": "...",
    "inviterName": "PlayerA",
    "inviterClass": "mutant_warrior",
    "partyId": "party-..."
  }
}
```

### 7. Client State Management

**File**: `pages/index.vue`

Party state tracking:
```typescript
const partyState = ref({
  hasParty: boolean,
  members: PartyMember[],
  lootRule: 'leader-only' | 'round-robin',
  isLeader: boolean
});

const partyInvitationData = ref({
  inviterId: string,
  inviterName: string,
  inviterClass: string,
  partyId: string
});
```

## User Workflows

### Creating and Joining a Party

1. **Player A invites Player B**:
   ```
   > moi PlayerB
   Đã gửi lời mời.
   ```

2. **Player B receives popup**: "PlayerA (Sử Gia) đã mời bạn vào nhóm."
   - Click [CHẤP NHẬN] or [TỪ CHỐI]

3. **Player B accepts**:
   ```
   > party accept
   Đã tham gia nhóm.
   ```

4. **All party members see**: "[PlayerB] đã tham gia nhóm."

### Managing the Party

1. **View party status**:
   ```
   > party
   ═══════════════════════════════════
              TỔ ĐỘI                  
   ═══════════════════════════════════
   (L) [PlayerA] - Level 5
        HP: 100/100
       [PlayerB] - Level 3
        HP: 80/80
   
   Quy tắc nhặt đồ: Theo Lượt
   ```

2. **Change loot rule** (leader only):
   ```
   > party loot leader-only
   Đã đặt quy tắc nhặt đồ: Chỉ Trưởng Nhóm.
   ```

3. **Promote member** (leader only):
   ```
   > party promote PlayerB
   Đã trao quyền nhóm trưởng.
   ```

4. **Kick member** (leader only):
   ```
   > party kick PlayerC
   Đã đuổi người chơi khỏi nhóm.
   ```

5. **Leave party**:
   ```
   > roi
   Đã rời nhóm.
   ```

### Party Combat & Looting

1. **Combat with party**:
   ```
   > attack rat
   Bạn tấn công [Chuột Biến Dị], gây 15 sát thương.
   Bạn đã hạ gục [Chuột Biến Dị]!
   Bạn nhận được 15 điểm kinh nghiệm (Nhóm - 3 thành viên).
   [Chuột Biến Dị] làm rơi ra một [Sword].
   Loot Turn: Đến lượt [PlayerB] nhặt đồ.
   ```

2. **Next player's turn**:
   ```
   > get sword
   Bạn nhặt [Sword].
   ```

3. **Not your turn**:
   ```
   > get sword
   Đến lượt người khác nhặt đồ.
   ```

### Party Chat

```
> p Chuẩn bị đánh boss!
[Nhóm][PlayerA]: Chuẩn bị đánh boss!

> p Tôi có healing potion
[Nhóm][PlayerB]: Tôi có healing potion
```

## Technical Details

### In-Memory Storage
- Parties are stored in RAM (not database)
- Automatic cleanup of old invitations (5 minutes)
- Parties are temporary and dissolve when empty

### Permission System
- Leader-only commands are validated server-side
- Non-leaders get error messages
- Party state is synchronized to all members

### Real-Time Updates
- WebSocket broadcasts for:
  - Party state changes
  - Member join/leave
  - Leader changes
  - Loot rule changes
  - Party chat messages
  - Invitations

### Resource Bars
Different classes have different resource types:
- **Chiến Binh** (Warrior): Nộ (Rage)
- **Sử Gia** (Historian): Mana
- **Kẻ Lùng Sục** (Stalker): Năng Lượng (Energy)
- **Kỹ Sư** (Engineer): Linh Kiện (Components)

## Code Quality

### Security
- ✅ No SQL injection (using Mongoose)
- ✅ No XSS (using player IDs internally)
- ✅ Permission validation for leader actions
- ✅ Auto-cleanup of old invitations
- ✅ CodeQL scan: 0 vulnerabilities

### Best Practices
- ✅ TypeScript interfaces for type safety
- ✅ Consistent error messaging
- ✅ Proper WebSocket event handling
- ✅ Memory-efficient Set usage for members
- ✅ Modular component design

## Testing Recommendations

### Manual Testing Checklist

1. **Party Creation**:
   - [ ] Invite player not in party
   - [ ] Invite player already in another party
   - [ ] Invite yourself (should fail)

2. **Invitations**:
   - [ ] Accept invitation
   - [ ] Decline invitation
   - [ ] Multiple invitations (only most recent accepted)
   - [ ] Expired invitations (5+ minutes old)

3. **Party Commands**:
   - [ ] Leave party as member
   - [ ] Leave party as leader (auto-promote)
   - [ ] Kick member (leader only)
   - [ ] Promote member (leader only)
   - [ ] Change loot rule (leader only)

4. **EXP Sharing**:
   - [ ] Solo kill (100% EXP)
   - [ ] Party kill, all in room (split EXP)
   - [ ] Party kill, members in different rooms (only nearby get EXP)

5. **Loot Distribution**:
   - [ ] Leader-only rule: only leader can loot
   - [ ] Round-robin: turn-based looting
   - [ ] Round-robin: turn advances after pickup
   - [ ] Non-party member can still loot freely

6. **Party Chat**:
   - [ ] Send message to party
   - [ ] All members receive message
   - [ ] Correct color coding (light blue)
   - [ ] Works across different rooms

7. **UI Components**:
   - [ ] Party button opens popup
   - [ ] No party: shows empty state
   - [ ] Has party: shows member list
   - [ ] Click member: opens contextual menu
   - [ ] Invitation popup: Accept/Decline buttons work
   - [ ] HP/Resource bars display correctly

8. **Edge Cases**:
   - [ ] Last member leaves (party dissolves)
   - [ ] Leader disconnects (auto-promote)
   - [ ] Member disconnects during combat
   - [ ] Invite same player twice
   - [ ] Leave and immediately rejoin

## Future Enhancements

### Suggested Improvements
1. **Persistent Parties**: Save to database
2. **Party Invites UI**: List of pending invites
3. **Party Finder**: Search for parties
4. **Party Buffs**: Leader abilities
5. **Max Party Size**: Configurable limit (currently unlimited)
6. **Formation System**: Tank/Healer/DPS roles
7. **Party Quests**: Shared quest progress
8. **Party Achievements**: Collective rewards

### Performance Optimizations
1. Cache party member data
2. Debounce party state broadcasts
3. Lazy load member stats
4. Optimize WebSocket message size

## Vietnamese Terminology

| English | Vietnamese |
|---------|-----------|
| Party | Tổ Đội / Nhóm |
| Leader | Nhóm Trưởng / Trưởng Nhóm |
| Member | Thành Viên |
| Invite | Mời |
| Accept | Chấp Nhận |
| Decline | Từ Chối |
| Leave | Rời |
| Kick | Đuổi |
| Promote | Thăng |
| Loot Rule | Quy Tắc Nhặt Đồ |
| Turn | Lượt |
| Experience | Kinh Nghiệm |

## Conclusion

The Party System is fully functional and ready for testing. All tasks from Phase 16 have been completed successfully. The implementation follows the existing code patterns, maintains security best practices, and provides a smooth user experience through real-time WebSocket communication.

The system is designed to be extendable and can easily accommodate future features like party raids, shared quest progression, and role-based mechanics.
