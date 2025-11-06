import { PlayerSchema } from '../../models/Player';
import { RoomSchema } from '../../models/Room';
import { gameState } from '../utils/gameState';
import { partyService } from '../utils/partyService';

export async function handlePartyCommand(
  playerId: string,
  player: any,
  action: string,
  target: string | undefined,
  args: string[] | undefined
): Promise<string[]> {
  const responses: string[] = [];
  const subCommand = target?.toLowerCase();
  const subTarget = args?.[0];
  
  // Check if this is party chat (p [message] instead of p [subcommand])
  const partySubcommands = ['invite', 'accept', 'decline', 'leave', 'kick', 'promote', 'loot'];
  if (action === 'p' && target && !partySubcommands.includes(subCommand)) {
    return handlePartyChat(playerId, player, target, args);
  }
  
  // Handle "moi" alias for "party invite"
  if (action === 'moi') {
    return handlePartyInviteAlias(playerId, player, target);
  }
  
  // Handle "roi" alias for "party leave"
  if (action === 'roi') {
    return handlePartyLeaveAlias(playerId, player);
  }
  
  // No subcommand - show party status
  if (!subCommand) {
    return showPartyStatus(playerId);
  }
  
  // Handle subcommands
  switch (subCommand) {
    case 'invite':
      return handlePartyInvite(playerId, player, subTarget);
    case 'accept':
      return handlePartyAccept(playerId, player);
    case 'decline':
      return handlePartyDecline(playerId);
    case 'leave':
      return handlePartyLeave(playerId, player);
    case 'kick':
      return handlePartyKick(playerId, player, subTarget);
    case 'promote':
      return handlePartyPromote(playerId, player, subTarget);
    case 'loot':
      return handlePartyLoot(playerId, subTarget);
    default:
      responses.push('Lệnh nhóm không hợp lệ.');
      responses.push('Các lệnh: party [invite/accept/decline/leave/kick/promote/loot]');
      return responses;
  }
}

async function handlePartyChat(
  playerId: string,
  player: any,
  target: string,
  args: string[] | undefined
): Promise<string[]> {
  const responses: string[] = [];
  const chatMessage = [target, ...(args || [])].filter(Boolean).join(' ');
  
  if (!chatMessage) {
    responses.push('Bạn muốn nói gì với nhóm?');
    return responses;
  }
  
  const playerParty = partyService.getPlayerParty(playerId);
  if (!playerParty) {
    responses.push('Bạn không ở trong nhóm nào.');
    return responses;
  }
  
  // Broadcast to all party members
  const memberIds = partyService.getPartyMemberIds(playerParty.partyId);
  const members = gameState.getPlayersByIds(memberIds);
  
  members.forEach(member => {
    if (member.ws) {
      member.ws.send(JSON.stringify({
        type: 'chat',
        channel: 'chat',
        category: 'party',
        user: player.username,
        message: chatMessage
      }));
    }
  });
  
  // Don't add to responses - it will be shown via chat system
  return responses;
}

async function handlePartyInviteAlias(
  playerId: string,
  player: any,
  target: string | undefined
): Promise<string[]> {
  const responses: string[] = [];
  
  if (!target) {
    responses.push('Mời ai vào nhóm? Cú pháp: moi [tên người chơi]');
    return responses;
  }
  
  return handlePartyInvite(playerId, player, target);
}

async function handlePartyLeaveAlias(
  playerId: string,
  player: any
): Promise<string[]> {
  return handlePartyLeave(playerId, player);
}

async function showPartyStatus(playerId: string): Promise<string[]> {
  const responses: string[] = [];
  const playerParty = partyService.getPlayerParty(playerId);
  
  if (!playerParty) {
    responses.push('Bạn không ở trong nhóm nào.');
    responses.push('Sử dụng: party invite [tên] để mời người khác.');
    return responses;
  }
  
  const { party } = playerParty;
  responses.push('═══════════════════════════════════');
  responses.push('           TỔ ĐỘI                  ');
  responses.push('═══════════════════════════════════');
  
  const memberIds = Array.from(party.memberIds);
  const members = await PlayerSchema.find({ _id: { $in: memberIds } });
  
  for (const member of members) {
    const isLeader = member._id.toString() === party.leaderId;
    const prefix = isLeader ? '(L)' : '   ';
    responses.push(`${prefix} [${member.username}] - Level ${member.level}`);
    responses.push(`     HP: ${member.hp}/${member.maxHp}`);
  }
  
  responses.push('');
  responses.push(`Quy tắc nhặt đồ: ${party.lootRule === 'leader-only' ? 'Chỉ Trưởng Nhóm' : 'Theo Lượt'}`);
  
  return responses;
}

async function handlePartyInvite(
  playerId: string,
  player: any,
  targetName: string | undefined
): Promise<string[]> {
  const responses: string[] = [];
  
  if (!targetName) {
    responses.push('Mời ai vào nhóm? Cú pháp: party invite [tên]');
    return responses;
  }
  
  // Find target player by name
  const currentRoom = await RoomSchema.findById(player.currentRoomId);
  if (!currentRoom) return responses;
  
  const playersInRoom = gameState.getPlayersInRoom(currentRoom._id.toString());
  const targetPlayerInfo = playersInRoom.find(p => 
    p.username.toLowerCase().includes(targetName.toLowerCase()) && p.id !== playerId
  );
  
  if (!targetPlayerInfo) {
    responses.push(`Không tìm thấy người chơi "${targetName}" ở đây.`);
    return responses;
  }
  
  const inviteResult = partyService.invitePlayer(playerId, targetPlayerInfo.id);
  responses.push(inviteResult.message);
  
  if (inviteResult.success) {
    // Send invitation to target player
    const targetPlayer = gameState.getPlayer(targetPlayerInfo.id);
    if (targetPlayer?.ws) {
      targetPlayer.ws.send(JSON.stringify({
        type: 'party_invitation',
        payload: {
          inviterId: playerId,
          inviterName: player.username,
          partyId: inviteResult.partyId
        }
      }));
    }
    
    // Update party ID in game state
    gameState.updatePlayerParty(playerId, inviteResult.partyId!);
  }
  
  return responses;
}

async function handlePartyAccept(
  playerId: string,
  player: any
): Promise<string[]> {
  const responses: string[] = [];
  
  // Get pending invitations
  const invitations = partyService.getPendingInvitations(playerId);
  if (invitations.length === 0) {
    responses.push('Không có lời mời nào.');
    return responses;
  }
  
  // Accept the most recent invitation
  const invitation = invitations[0];
  const inviter = await PlayerSchema.findById(invitation.inviterId);
  if (!inviter) {
    responses.push('Không tìm thấy người mời.');
    return responses;
  }
  
  const acceptResult = partyService.acceptInvitation(playerId, invitation.inviterId);
  responses.push(acceptResult.message);
  
  if (acceptResult.success) {
    gameState.updatePlayerParty(playerId, acceptResult.partyId!);
    
    // Notify party members
    const memberIds = partyService.getPartyMemberIds(acceptResult.partyId!);
    const members = gameState.getPlayersByIds(memberIds);
    members.forEach(member => {
      if (member.ws && member.id !== playerId) {
        member.ws.send(JSON.stringify({
          type: 'system',
          category: 'party',
          message: `[${player.username}] đã tham gia nhóm.`
        }));
      }
    });
  }
  
  return responses;
}

async function handlePartyDecline(playerId: string): Promise<string[]> {
  const responses: string[] = [];
  
  // Get pending invitations
  const invitations = partyService.getPendingInvitations(playerId);
  if (invitations.length === 0) {
    responses.push('Không có lời mời nào.');
    return responses;
  }
  
  // Decline the most recent invitation
  const invitation = invitations[0];
  const declineResult = partyService.declineInvitation(playerId, invitation.inviterId);
  responses.push(declineResult.message);
  
  return responses;
}

async function handlePartyLeave(
  playerId: string,
  player: any
): Promise<string[]> {
  const responses: string[] = [];
  
  // Get party info BEFORE leaving
  const playerPartyBeforeLeave = partyService.getPlayerParty(playerId);
  const partyIdBeforeLeave = playerPartyBeforeLeave?.partyId;
  
  const leaveResult = partyService.leaveParty(playerId);
  responses.push(leaveResult.message);
  
  if (leaveResult.success) {
    gameState.updatePlayerParty(playerId, null);
    
    // Notify remaining party members (if party still exists)
    if (partyIdBeforeLeave) {
      const memberIds = partyService.getPartyMemberIds(partyIdBeforeLeave);
      const members = gameState.getPlayersByIds(memberIds);
      members.forEach(member => {
        if (member.ws) {
          member.ws.send(JSON.stringify({
            type: 'system',
            category: 'party',
            message: `[${player.username}] đã rời nhóm.`
          }));
          
          if (leaveResult.newLeaderId === member.id) {
            member.ws.send(JSON.stringify({
              type: 'system',
              category: 'party',
              message: `Bạn đã trở thành nhóm trưởng.`
            }));
          }
        }
      });
    }
  }
  
  return responses;
}

async function handlePartyKick(
  playerId: string,
  player: any,
  targetName: string | undefined
): Promise<string[]> {
  const responses: string[] = [];
  
  if (!targetName) {
    responses.push('Đuổi ai khỏi nhóm? Cú pháp: party kick [tên]');
    return responses;
  }
  
  // Find target player in party
  const playerParty = partyService.getPlayerParty(playerId);
  if (!playerParty) {
    responses.push('Bạn không ở trong nhóm nào.');
    return responses;
  }
  
  const memberIds = Array.from(playerParty.party.memberIds);
  const members = await PlayerSchema.find({ _id: { $in: memberIds } });
  const targetMember = members.find(m => 
    m.username.toLowerCase().includes(targetName.toLowerCase()) && m._id.toString() !== playerId
  );
  
  if (!targetMember) {
    responses.push(`Không tìm thấy thành viên "${targetName}" trong nhóm.`);
    return responses;
  }
  
  const kickResult = partyService.kickPlayer(playerId, targetMember._id.toString());
  responses.push(kickResult.message);
  
  if (kickResult.success) {
    gameState.updatePlayerParty(targetMember._id.toString(), null);
    
    // Notify kicked player
    const kickedPlayer = gameState.getPlayer(targetMember._id.toString());
    if (kickedPlayer?.ws) {
      kickedPlayer.ws.send(JSON.stringify({
        type: 'system',
        category: 'party',
        message: `Bạn đã bị đuổi khỏi nhóm.`
      }));
    }
    
    // Notify other party members
    const remainingMemberIds = partyService.getPartyMemberIds(playerParty.partyId);
    const remainingMembers = gameState.getPlayersByIds(remainingMemberIds);
    remainingMembers.forEach(member => {
      if (member.ws && member.id !== playerId) {
        member.ws.send(JSON.stringify({
          type: 'system',
          category: 'party',
          message: `[${targetMember.username}] đã bị đuổi khỏi nhóm.`
        }));
      }
    });
  }
  
  return responses;
}

async function handlePartyPromote(
  playerId: string,
  player: any,
  targetName: string | undefined
): Promise<string[]> {
  const responses: string[] = [];
  
  if (!targetName) {
    responses.push('Trao quyền cho ai? Cú pháp: party promote [tên]');
    return responses;
  }
  
  // Find target player in party
  const playerParty = partyService.getPlayerParty(playerId);
  if (!playerParty) {
    responses.push('Bạn không ở trong nhóm nào.');
    return responses;
  }
  
  const memberIds = Array.from(playerParty.party.memberIds);
  const members = await PlayerSchema.find({ _id: { $in: memberIds } });
  const targetMember = members.find(m => 
    m.username.toLowerCase().includes(targetName.toLowerCase())
  );
  
  if (!targetMember) {
    responses.push(`Không tìm thấy thành viên "${targetName}" trong nhóm.`);
    return responses;
  }
  
  const promoteResult = partyService.promotePlayer(playerId, targetMember._id.toString());
  responses.push(promoteResult.message);
  
  if (promoteResult.success) {
    // Notify all party members
    const allMemberIds = partyService.getPartyMemberIds(playerParty.partyId);
    const allMembers = gameState.getPlayersByIds(allMemberIds);
    allMembers.forEach(member => {
      if (member.ws) {
        member.ws.send(JSON.stringify({
          type: 'system',
          category: 'party',
          message: `[${targetMember.username}] đã trở thành nhóm trưởng.`
        }));
      }
    });
  }
  
  return responses;
}

async function handlePartyLoot(
  playerId: string,
  lootRuleInput: string | undefined
): Promise<string[]> {
  const responses: string[] = [];
  
  if (!lootRuleInput) {
    responses.push('Chọn quy tắc nhặt đồ:');
    responses.push('  party loot leader-only  - Chỉ trưởng nhóm');
    responses.push('  party loot round-robin  - Theo lượt');
    return responses;
  }
  
  const lootRule = lootRuleInput.toLowerCase();
  if (lootRule !== 'leader-only' && lootRule !== 'round-robin') {
    responses.push('Quy tắc không hợp lệ. Sử dụng: leader-only hoặc round-robin');
    return responses;
  }
  
  const lootResult = partyService.setLootRule(playerId, lootRule as 'leader-only' | 'round-robin');
  responses.push(lootResult.message);
  
  if (lootResult.success) {
    // Notify party members
    const playerParty = partyService.getPlayerParty(playerId);
    if (playerParty) {
      const memberIds = partyService.getPartyMemberIds(playerParty.partyId);
      const members = gameState.getPlayersByIds(memberIds);
      members.forEach(member => {
        if (member.ws && member.id !== playerId) {
          member.ws.send(JSON.stringify({
            type: 'system',
            category: 'party',
            message: lootResult.message
          }));
        }
      });
    }
  }
  
  return responses;
}
