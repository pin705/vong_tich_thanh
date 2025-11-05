# Vong Tích Thành - MUD Game

A classic text-based MUD (Multi-User Dungeon) game with a retro terminal aesthetic. Built with Nuxt 3, MongoDB, and WebSockets for real-time multiplayer gameplay.

## Features

### ✅ Implemented

#### Core Gameplay
- **Retro Terminal UI**: Pure black background with green monospace text
- **Command System**: Full command parser with aliases (look/l, go/n/s/e/w, attack/a, etc.)
- **Real-time WebSocket**: Instant command processing
- **Database Models**: Player, Room, Item, Agent/NPC schemas
- **Game State Manager**: Handles active players and combat ticks
- **Complete Room Navigation**: Database-integrated movement system
- **Multiplayer**: See other players, chat in real-time
- **NPC AI Behaviors**: Wander, aggressive, patrol, and passive behaviors
- **Combat System**: Tick-based auto-battle with flee mechanics
- **Shop/Trading System**: Buy and sell items from merchants

#### Enhanced UI/UX (NEW!)
- **Visual Inventory System**: Tabbed interface with character info and item grid
  - Info tab: player stats (damage, defense, crit, lifesteal, dodge)
  - Inventory tab: 20-slot grid with clickable items
  - Item popovers with full details and one-click actions
- **Clickable Map**: Click directions to move (no typing required!)
- **Interactive Help System**: Wiki-style help with search and categories (press F1 or Ctrl+H)
- **Status Effects Display**: Visual buffs/debuffs with timers
- **Boss Cast Bar**: Warning system for boss abilities
- **Subtle Borders**: Professional UI with reduced visual clutter
- **Reusable Components**: Popover and FullscreenOverlay for consistent UX

### 🚧 In Progress
- Guild management system
- Party/group system
- Trade UI between players
- Auction house
- Housing system
- Pet/companion system
- Enhanced equipment system with requirements

## Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript, Tailwind CSS
- **Backend**: Nitro server with WebSocket support
- **Database**: MongoDB with Mongoose
- **Authentication**: nuxt-auth-utils

## Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or remote)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables (optional)
# Create .env file with:
# MONGODB_URI=mongodb://localhost:27017/vong_tich_thanh

# Run development server
npm run dev
```

The game will be available at `http://localhost:3000`

### Initialize Game World

After starting the server, initialize the game world with rooms, NPCs, and items:

```bash
curl -X POST http://localhost:3000/api/init-world
```

## Gameplay

### Commands

All commands are typed in the input field at the bottom of the screen.

#### Movement
- `go [direction]` or shortcuts: `n`, `s`, `e`, `w`, `u`, `d`
- Example: `go bắc` or `n`

#### Observation
- `look [target]` (alias: `l`) - Examine room or object
- `inventory` (alias: `i`) - View your inventory

#### Interaction
- `talk [npc]` (alias: `t`) - Talk to NPCs
- `say [message]` - Say something to other players
- `get [item]` (alias: `g`) - Pick up item
- `drop [item]` - Drop item
- `use [item]` - Use item

#### Combat
- `attack [target]` (alias: `a` or `kill`) - Attack enemy
- `flee` (alias: `run`) - Flee from combat

#### Shopping
- `list` - View shop inventory
- `buy [item]` - Buy item
- `sell [item]` - Sell item

#### Other
- `help` - Show command list
- `quit` - Exit game

### Color Coding

- **Dim Green** (#008800): Normal descriptions
- **Bright Green** (#00ff00): Your actions
- **Amber** (#ffb000): Important names (NPCs, items)
- **Cyan** (#00ffff): System messages and buffs
- **Red** (#ff0000): Errors, danger, and debuffs

### Keyboard Shortcuts (NEW!)

- **F1** or **Ctrl+H** (Cmd+H on Mac): Open help system
- **ESC**: Close any overlay/popup
- **↑/↓**: Navigate command history
- **Enter**: Execute command
- **Click Map Directions**: Move without typing

## Project Structure

```
├── assets/css/          # Stylesheets
├── models/              # MongoDB schemas
├── pages/               # Vue pages
├── server/
│   ├── api/            # API endpoints
│   ├── routes/         # WebSocket handler
│   └── utils/          # Game logic utilities
├── types/              # TypeScript types
└── nuxt.config.ts      # Nuxt configuration
```

## Development

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Design Philosophy

**"Function > Form with Modern UX"** - This game balances retro aesthetics with usability:

- ✅ Pure monospace fonts (VT323, Source Code Pro)
- ✅ Terminal color palette (greens, amber, cyan, red)
- ✅ Always-focused input field for typing
- ✅ Auto-scrolling output
- ✅ Retro terminal aesthetic
- ✅ **NEW**: Visual, clickable UI elements for common actions
- ✅ **NEW**: Subtle borders and backgrounds (not jarring)
- ✅ **NEW**: Keyboard shortcuts for power users
- ✅ **NEW**: Popovers and overlays for detailed information

The improvements maintain the terminal feel while making the game more accessible to new players.

## License

MIT

## Credits

Created for the Vong Tích Thành project.
