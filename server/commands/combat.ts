import type { Command } from '~/types';
import { PlayerSchema } from '../../models/Player';
import { AgentSchema } from '../../models/Agent';
import { RoomSchema } from '../../models/Room';
import { startCombat, fleeCombat } from '../utils/combatSystem';

/**
 * Handle combat-related commands (attack, kill, flee, run)
 */
export async function handleCombatCommand(command: Command, playerId: string): Promise<string[]> {
  const { action, target } = command;
  const responses: string[] = [];

  try {
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      responses.push('Lỗi: Không tìm thấy thông tin người chơi.');
      return responses;
    }

    // Handle attack/kill commands
    if (action === 'attack' || action === 'a' || action === 'kill') {
      if (player.inCombat) {
        responses.push('Bạn đang trong chiến đấu!');
        return responses;
      }

      // Phase 29: Auto-targeting when no target specified
      if (!target) {
        // Find a valid target automatically
        const room = await RoomSchema.findById(player.currentRoomId);
        if (!room) {
          responses.push('Lỗi: Không tìm thấy phòng hiện tại.');
          return responses;
        }

        const agents = await AgentSchema.find({ _id: { $in: room.agents } });
        const hostileAgents = agents.filter((a: any) => a.type === 'mob');

        if (hostileAgents.length === 0) {
          responses.push('Không có mục tiêu để tấn công. Cú pháp: attack [tên]');
          return responses;
        }

        // Priority: agents attacking player > aggressive agents > nearest agent
        let targetAgent = hostileAgents.find((a: any) => 
          a.combatTarget && a.combatTarget.toString() === playerId
        );

        if (!targetAgent) {
          targetAgent = hostileAgents.find((a: any) => a.behavior === 'aggressive');
        }

        if (!targetAgent) {
          targetAgent = hostileAgents[0];
        }

        responses.push(`[Auto-Target] Mục tiêu: [${targetAgent.name}]`);
        const combatMessages = await startCombat(playerId, targetAgent._id.toString());
        responses.push(...combatMessages);
        return responses;
      }

      // Find agent in current room
      const room = await RoomSchema.findById(player.currentRoomId);
      if (!room) {
        responses.push('Lỗi: Không tìm thấy phòng hiện tại.');
        return responses;
      }

      const agents = await AgentSchema.find({ _id: { $in: room.agents } });
      const agent = agents.find((a: any) => 
        a.name.toLowerCase().includes(target.toLowerCase())
      );

      if (!agent) {
        responses.push(`Không tìm thấy [${target}] ở đây.`);
        return responses;
      }

      if (agent.type === 'npc') {
        responses.push(`[${agent.name}] không phải là kẻ thù. Bạn không thể tấn công NPC thân thiện.`);
        return responses;
      }

      // Start combat
      const combatMessages = await startCombat(playerId, agent._id.toString());
      responses.push(...combatMessages);
    }

    // Handle flee/run commands
    if (action === 'flee' || action === 'run') {
      if (!player.inCombat) {
        responses.push('Bạn không đang trong chiến đấu.');
        return responses;
      }

      const fleeMessages = await fleeCombat(playerId);
      responses.push(...fleeMessages);
    }

  } catch (error) {
    console.error('Error in combat command:', error);
    responses.push('Lỗi khi xử lý lệnh chiến đấu.');
  }

  return responses;
}
