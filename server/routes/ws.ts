import type { Peer } from 'crossws';
import { parseCommand } from '../utils/commandParser';
import { handleCommand } from '../utils/commandHandler';
import { gameState } from '../utils/gameState';

// Store peer to player mapping
const peerToPlayer = new Map<string, string>();

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
          // Player authentication
          const playerId = payload.playerId;
          peerToPlayer.set(peer.id, playerId);
          
          // TODO: Load player from database and add to game state
          gameState.addPlayer(playerId, payload.username, payload.roomId, peer);
          
          // Send initial room description
          peer.send(JSON.stringify({
            type: 'room',
            payload: {
              // TODO: Load room data
              name: 'Cổng Thành Cũ',
              description: 'Bạn đang đứng trước một cổng thành bằng đá đã sụp đổ một nửa.',
            }
          }));
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
          
          // Process command
          const responses = handleCommand(command, playerIdForCmd);
          
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
            } else if (response.includes('Lệnh không hợp lệ') || response.includes('không thể')) {
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
      gameState.removePlayer(playerId);
      peerToPlayer.delete(peer.id);
    }
  },

  async error(peer: Peer, error) {
    console.error('[WS] Error:', error);
  }
});
