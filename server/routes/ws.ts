import type { Peer } from 'crossws';
import { parseCommand } from '../utils/commandParser';
import { handleCommand } from '../utils/commandHandler';
import { handleCommandDb } from '../utils/commandHandlerDb';
import { gameState } from '../utils/gameState';
import { partyService } from '../utils/partyService';
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
      mp: 50, // TODO: Add MP system to Player schema
      maxMp: 50, // TODO: Add MP system to Player schema
      level: player.level,
      gold: player.gold,
      premiumCurrency: player.premiumCurrency,
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

// Helper function to send room occupants
async function sendRoomOccupants(peer: Peer, roomId: string, currentPlayerId: string) {
  const room = await RoomSchema.findById(roomId);
  if (!room) return;

  // Get players in room
  const playersInRoom = gameState.getPlayersInRoom(roomId);
  const players = playersInRoom
    .filter(p => p.id !== currentPlayerId)
    .map(p => ({ id: p.id, name: p.username }));

  // Get NPCs and mobs in room
  const agents = await AgentSchema.find({ _id: { $in: room.agents } });
  const npcs = agents
    .filter((a: any) => a.type === 'npc')
    .map((a: any) => ({ id: a._id.toString(), name: a.name }));
  const mobs = agents
    .filter((a: any) => a.type === 'mob')
    .map((a: any) => ({ id: a._id.toString(), name: a.name }));

  peer.send(JSON.stringify({
    type: 'room_occupants',
    payload: {
      players,
      npcs,
      mobs
    }
  }));
}

// Helper function to broadcast room occupants to all players in a room
async function broadcastRoomOccupants(roomId: string) {
  const room = await RoomSchema.findById(roomId);
  if (!room) return;

  const playersInRoom = gameState.getPlayersInRoom(roomId);
  
  // Send updated occupants to each player
  for (const player of playersInRoom) {
    if (player.ws) {
      await sendRoomOccupants(player.ws, roomId, player.id);
    }
  }
}

// Helper function to send party state
async function sendPartyState(peer: Peer, playerId: string) {
  const playerParty = partyService.getPlayerParty(playerId);
  
  if (!playerParty) {
    // No party
    peer.send(JSON.stringify({
      type: 'party_state',
      payload: {
        hasParty: false,
        members: [],
        lootRule: 'round-robin',
        isLeader: false
      }
    }));
    return;
  }
  
  const { party, partyId } = playerParty;
  
  // Get member details
  const memberIds = Array.from(party.memberIds);
  const members = await PlayerSchema.find({ _id: { $in: memberIds } });
  
  const memberData = members.map(member => ({
    id: member._id.toString(),
    name: member.username,
    class: member.class || 'mutant_warrior',
    level: member.level,
    hp: member.hp,
    maxHp: member.maxHp,
    resource: member.resource || 0,
    maxResource: member.maxResource || 100,
    isLeader: member._id.toString() === party.leaderId,
    statusEffects: [] // TODO: Add status effects when implemented
  }));
  
  peer.send(JSON.stringify({
    type: 'party_state',
    payload: {
      hasParty: true,
      members: memberData,
      lootRule: party.lootRule,
      isLeader: playerId === party.leaderId
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
          
          // Broadcast updated occupants to all players in the room
          await broadcastRoomOccupants(authRoom._id.toString());
          
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
          
          // Send player state, exits, room occupants, party state, and initial room info
          await sendPlayerState(peer, playerId);
          await sendExits(peer, authRoom._id.toString());
          await sendRoomOccupants(peer, authRoom._id.toString(), playerId);
          await sendPartyState(peer, playerId);
          
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
          
          // Send updated player state, exits, room occupants, and party state after command
          const playerAfterCmd = await PlayerSchema.findById(playerIdForCmd);
          if (playerAfterCmd) {
            await sendPlayerState(peer, playerIdForCmd);
            await sendExits(peer, playerAfterCmd.currentRoomId.toString());
            await sendRoomOccupants(peer, playerAfterCmd.currentRoomId.toString(), playerIdForCmd);
            await sendPartyState(peer, playerIdForCmd);
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
        const roomId = player.roomId;
        
        // Broadcast to room that player left
        gameState.broadcastToRoom(
          roomId,
          {
            type: 'system',
            message: `[${player.username}] đã ngắt kết nối.`
          },
          playerId
        );
        
        // Remove player first
        gameState.removePlayer(playerId);
        peerToPlayer.delete(peer.id);
        
        // Broadcast updated occupants to remaining players
        await broadcastRoomOccupants(roomId);
      } else {
        gameState.removePlayer(playerId);
        peerToPlayer.delete(peer.id);
      }
    }
  },

  async error(peer: Peer, error) {
    console.error('[WS] Error:', error);
  }
});
