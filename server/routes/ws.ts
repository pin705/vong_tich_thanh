import type { Peer } from 'crossws';
import { parseCommand } from '../utils/commandParser';
import { handleCommand } from '../utils/commandHandler';
import { handleCommandDb } from '../utils/commandHandlerDb';
import { gameState } from '../utils/gameState';
import { PlayerSchema } from '../../models/Player';
import { RoomSchema } from '../../models/Room';
import { AgentSchema } from '../../models/Agent';

// Store peer to player mapping
const peerToPlayer = new Map<string, string>();

// Helper function to send player state
async function sendPlayerState(peer: Peer, playerId: string) {
  const player = await PlayerSchema.findById(playerId);
  if (!player) return;

  peer.send(JSON.stringify({
    type: 'player_state',
    payload: {
      name: player.username,
      hp: player.hp,
      maxHp: player.maxHp,
      mp: 50, // Placeholder for now
      maxMp: 50, // Placeholder for now
      level: player.level,
      gold: player.gold,
      inCombat: player.inCombat
    }
  }));

  // Send target state if in combat
  if (player.inCombat && player.combatTarget) {
    const target = await AgentSchema.findById(player.combatTarget);
    if (target) {
      peer.send(JSON.stringify({
        type: 'target_state',
        payload: {
          name: target.name,
          hp: target.hp,
          maxHp: target.maxHp
        }
      }));
    }
  } else {
    // Clear target
    peer.send(JSON.stringify({
      type: 'target_state',
      payload: null
    }));
  }
}

// Helper function to send exits
async function sendExits(peer: Peer, roomId: string) {
  const room = await RoomSchema.findById(roomId);
  if (!room) return;

  peer.send(JSON.stringify({
    type: 'exits',
    payload: {
      north: !!room.exits.north,
      south: !!room.exits.south,
      east: !!room.exits.east,
      west: !!room.exits.west,
      up: !!room.exits.up,
      down: !!room.exits.down
    }
  }));
}

export default defineWebSocketHandler({
  async open(peer: Peer) {
    console.log('[WS] Client connected:', peer.id);
    
    // Send welcome message
    peer.send(JSON.stringify({
      type: 'system',
      message: 'Chào mừng đến với Vong Tích Thành!'
    }));
  },

  async message(peer: Peer, message) {
    try {
      const data = JSON.parse(message.text());
      const { type, payload } = data;

      switch (type) {
        case 'auth':
          // Player authentication - validate session first
          const playerId = payload.playerId;
          
          if (!playerId) {
            peer.send(JSON.stringify({
              type: 'error',
              message: 'Invalid authentication: missing player ID.'
            }));
            return;
          }
          
          // TODO: In a full implementation, verify the session token here
          // For now, we trust the client (acceptable for MVP/demo)
          
          // Load player from database
          const authPlayer = await PlayerSchema.findById(playerId);
          if (!authPlayer) {
            peer.send(JSON.stringify({
              type: 'error',
              message: 'Player not found in database.'
            }));
            return;
          }

          const authRoom = await RoomSchema.findById(authPlayer.currentRoomId);
          if (!authRoom) {
            peer.send(JSON.stringify({
              type: 'error',
              message: 'Starting room not found. Please contact administrator.'
            }));
            return;
          }
          
          peerToPlayer.set(peer.id, playerId);
          gameState.addPlayer(playerId, authPlayer.username, authRoom._id.toString(), peer);
          
          // Broadcast to room that player joined
          gameState.broadcastToRoom(
            authRoom._id.toString(),
            {
              type: 'system',
              message: `[${authPlayer.username}] đã kết nối.`
            },
            playerId
          );
          
          // Send initial room description using the look command
          const lookCommand = parseCommand('look');
          const initialResponses = await handleCommandDb(lookCommand, playerId);
          
          // Send welcome message first
          peer.send(JSON.stringify({
            type: 'system',
            message: `Chào mừng trở lại, [${authPlayer.username}]!`
          }));
          peer.send(JSON.stringify({
            type: 'normal',
            message: ''
          }));
          
          // Send player state, exits, and initial room info
          await sendPlayerState(peer, playerId);
          await sendExits(peer, authRoom._id.toString());
          
          // Send room description
          for (const response of initialResponses) {
            if (response === '') {
              peer.send(JSON.stringify({
                type: 'normal',
                message: ''
              }));
            } else if (response.includes('[') && response.includes(']')) {
              peer.send(JSON.stringify({
                type: 'accent',
                message: response
              }));
            } else {
              peer.send(JSON.stringify({
                type: 'normal',
                message: response
              }));
            }
          }
          break;

        case 'command':
          const playerIdForCmd = peerToPlayer.get(peer.id);
          if (!playerIdForCmd) {
            peer.send(JSON.stringify({
              type: 'error',
              message: 'Bạn chưa đăng nhập.'
            }));
            return;
          }

          const command = parseCommand(payload.input);
          console.log('[WS] Command:', command, 'from player:', playerIdForCmd);
          
          // Process command with database integration
          const responses = await handleCommandDb(command, playerIdForCmd);
          
          // Send responses
          for (const response of responses) {
            if (response === '') {
              peer.send(JSON.stringify({
                type: 'normal',
                message: ''
              }));
            } else if (response.includes('[') && response.includes(']')) {
              // Messages with brackets are accents (names, rooms, etc)
              peer.send(JSON.stringify({
                type: 'accent',
                message: response
              }));
            } else if (response.startsWith('Bạn')) {
              // Actions by the player
              peer.send(JSON.stringify({
                type: 'action',
                message: response
              }));
            } else if (response.includes('Lệnh không hợp lệ') || response.includes('không thể') || response.includes('Lỗi')) {
              // Errors
              peer.send(JSON.stringify({
                type: 'error',
                message: response
              }));
            } else if (response.includes('═')) {
              // System messages (boxes, separators)
              peer.send(JSON.stringify({
                type: 'system',
                message: response
              }));
            } else {
              // Normal text
              peer.send(JSON.stringify({
                type: 'normal',
                message: response
              }));
            }
          }
          
          // Send updated player state and exits after command
          const playerAfterCmd = await PlayerSchema.findById(playerIdForCmd);
          if (playerAfterCmd) {
            await sendPlayerState(peer, playerIdForCmd);
            await sendExits(peer, playerAfterCmd.currentRoomId.toString());
          }
          break;

        default:
          console.log('[WS] Unknown message type:', type);
      }
    } catch (error) {
      console.error('[WS] Error processing message:', error);
      peer.send(JSON.stringify({
        type: 'error',
        message: 'Lỗi xử lý lệnh.'
      }));
    }
  },

  async close(peer: Peer) {
    console.log('[WS] Client disconnected:', peer.id);
    
    const playerId = peerToPlayer.get(peer.id);
    if (playerId) {
      const player = gameState.getPlayer(playerId);
      if (player) {
        // Broadcast to room that player left
        gameState.broadcastToRoom(
          player.roomId,
          {
            type: 'system',
            message: `[${player.username}] đã ngắt kết nối.`
          },
          playerId
        );
      }
      
      gameState.removePlayer(playerId);
      peerToPlayer.delete(peer.id);
    }
  },

  async error(peer: Peer, error) {
    console.error('[WS] Error:', error);
  }
});
