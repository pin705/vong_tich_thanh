# Architecture: API vs WebSocket Boundaries

## Decision: Clear Separation of Concerns

### WebSocket (`server/routes/ws.ts`)
**Use for:** All **in-game** actions and real-time features

**Examples:**
- Movement commands (go, n, s, e, w)
- Combat actions (attack, flee)
- Item management (get, drop, use)
- Social interactions (say, tell, party)
- All commands that require immediate feedback and real-time updates

**Why WebSocket?**
- Real-time bidirectional communication
- Server can push updates to players (other players' actions, mob movements, etc.)
- Lower latency for frequent actions
- Single connection for all game commands

### REST API (`server/api/`)
**Use for:** All **out-of-game** actions and administrative tasks

**Examples:**
- Authentication (login, register, session management)
- Admin panel operations (creating items, rooms, agents)
- Data retrieval for UI (getting player stats, quest lists)
- One-time actions that don't require real-time feedback

**Why REST API?**
- Standard HTTP semantics
- Easy to cache
- Stateless design
- Better for form submissions and page loads

## Current Issue: Overlapping Functionality

### Problem
Some endpoints exist in both REST API and WebSocket:
- `server/api/player/equip.post.ts` (REST) vs `equip` command (WebSocket - if implemented)
- This creates confusion and potential inconsistency

### Solution
**Keep equipment management through WebSocket only** (or through REST only if it's menu-based)

For the current implementation:
- If `equip` is meant to be a UI menu action → Keep REST API
- If `equip` is meant to be a command → Remove REST API and use WebSocket command

### Recommendation
Given this is a MUD-style game with command-line interface:
1. **Remove** `server/api/player/equip.post.ts` REST endpoint
2. Implement equipment management through WebSocket commands only
3. UI overlays should send WebSocket commands, not make REST API calls for in-game actions

## Implementation Guidelines

### When adding new features, ask:
- **Is this an in-game action?** → WebSocket
- **Is this a meta-game/administrative action?** → REST API
- **Does it need real-time updates?** → WebSocket
- **Is it a one-time form submission?** → REST API

### Examples by category:

**In-game (WebSocket):**
- `attack [target]`
- `use [item]`
- `equip [item]`
- `cast [spell]`
- `say [message]`

**Out-of-game (REST API):**
- `/api/auth/login` (POST)
- `/api/admin/items` (GET/POST)
- `/api/player/stats` (GET) - for character sheet display
- `/api/auction/list` (GET) - for auction house browse

This separation ensures:
1. **Single Source of Truth**: Logic for each action exists in only one place
2. **Clearer Code**: Easier to find and maintain game logic
3. **Better Performance**: Real-time actions use WebSocket, static data uses REST
4. **Easier Testing**: Clear boundaries make testing simpler
