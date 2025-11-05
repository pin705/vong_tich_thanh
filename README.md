# Vong Tích Thành - MUD Game

A classic text-based MUD (Multi-User Dungeon) game with a retro terminal aesthetic. Built with Nuxt 3, MongoDB, and WebSockets for real-time multiplayer gameplay.

## Features

### ✅ Implemented
- **Retro Terminal UI**: Pure black background with green monospace text
- **Command System**: Full command parser with aliases (look/l, go/n/s/e/w, attack/a, etc.)
- **Real-time WebSocket**: Instant command processing
- **Basic Commands**: help, look, go, talk, list, inventory, and more
- **Database Models**: Player, Room, Item, Agent/NPC schemas
- **Game State Manager**: Handles active players and combat ticks

### 🚧 In Progress
- Complete room navigation with database
- Multiplayer interactions (see other players, chat)
- NPC AI behaviors (wander, aggressive, patrol)
- Combat system (tick-based auto-battle)
- Inventory management
- Shop/trading system

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
- **Cyan** (#00ffff): System messages
- **Red** (#ff0000): Errors and danger

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

**"Function > Form"** - This game intentionally avoids modern web design:

- ❌ No buttons, cards, or rounded corners
- ❌ No colors beyond terminal palette
- ✅ Pure monospace fonts (VT323, Source Code Pro)
- ✅ Always-focused input field
- ✅ Auto-scrolling output
- ✅ Retro terminal aesthetic

## License

MIT

## Credits

Created for the Vong Tích Thành project.
