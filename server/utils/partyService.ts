// Party System - In-memory party management for real-time multiplayer

export interface PartyState {
  leaderId: string;
  memberIds: Set<string>;
  lootRule: 'leader-only' | 'round-robin';
  lootTurn: number; // For round-robin, tracks current turn index
  invitations: Map<string, { inviterId: string; timestamp: number }>; // pending invitations
}

class PartyService {
  private parties: Map<string, PartyState> = new Map();
  private playerToParty: Map<string, string> = new Map();

  // Create a new party with the leader
  createParty(leaderId: string): string {
    const partyId = `party-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    this.parties.set(partyId, {
      leaderId,
      memberIds: new Set([leaderId]),
      lootRule: 'round-robin',
      lootTurn: 0,
      invitations: new Map()
    });
    
    this.playerToParty.set(leaderId, partyId);
    
    return partyId;
  }

  // Send an invitation to a player
  invitePlayer(inviterId: string, inviteeId: string): { success: boolean; message: string; partyId?: string } {
    // Check if inviter is in a party
    let partyId = this.playerToParty.get(inviterId);
    
    // If inviter is not in a party, create one
    if (!partyId) {
      partyId = this.createParty(inviterId);
    }
    
    const party = this.parties.get(partyId);
    if (!party) {
      return { success: false, message: 'Lỗi: Không tìm thấy nhóm.' };
    }

    // Check if inviter is the leader
    if (party.leaderId !== inviterId) {
      return { success: false, message: 'Chỉ nhóm trưởng mới có thể mời người khác.' };
    }

    // Check if invitee is already in a party
    if (this.playerToParty.has(inviteeId)) {
      return { success: false, message: 'Người chơi đã có nhóm.' };
    }

    // Check if invitee already has a pending invitation
    if (party.invitations.has(inviteeId)) {
      return { success: false, message: 'Đã gửi lời mời cho người chơi này.' };
    }

    // Add invitation
    party.invitations.set(inviteeId, {
      inviterId,
      timestamp: Date.now()
    });

    return { success: true, message: 'Đã gửi lời mời.', partyId };
  }

  // Accept an invitation
  acceptInvitation(inviteeId: string, inviterId: string): { success: boolean; message: string; partyId?: string } {
    const partyId = this.playerToParty.get(inviterId);
    
    if (!partyId) {
      return { success: false, message: 'Người mời không còn ở trong nhóm.' };
    }

    const party = this.parties.get(partyId);
    if (!party) {
      return { success: false, message: 'Không tìm thấy nhóm.' };
    }

    // Check if invitation exists
    const invitation = party.invitations.get(inviteeId);
    if (!invitation || invitation.inviterId !== inviterId) {
      return { success: false, message: 'Không tìm thấy lời mời.' };
    }

    // Remove invitation
    party.invitations.delete(inviteeId);

    // Add player to party
    party.memberIds.add(inviteeId);
    this.playerToParty.set(inviteeId, partyId);

    return { success: true, message: 'Đã tham gia nhóm.', partyId };
  }

  // Decline an invitation
  declineInvitation(inviteeId: string, inviterId: string): { success: boolean; message: string } {
    const partyId = this.playerToParty.get(inviterId);
    
    if (!partyId) {
      return { success: false, message: 'Người mời không còn ở trong nhóm.' };
    }

    const party = this.parties.get(partyId);
    if (!party) {
      return { success: false, message: 'Không tìm thấy nhóm.' };
    }

    // Remove invitation
    if (party.invitations.has(inviteeId)) {
      party.invitations.delete(inviteeId);
      return { success: true, message: 'Đã từ chối lời mời.' };
    }

    return { success: false, message: 'Không tìm thấy lời mời.' };
  }

  // Leave party
  leaveParty(playerId: string): { success: boolean; message: string; wasLeader?: boolean; newLeaderId?: string } {
    const partyId = this.playerToParty.get(playerId);
    
    if (!partyId) {
      return { success: false, message: 'Bạn không ở trong nhóm nào.' };
    }

    const party = this.parties.get(partyId);
    if (!party) {
      return { success: false, message: 'Không tìm thấy nhóm.' };
    }

    const wasLeader = party.leaderId === playerId;
    
    // Remove player from party
    party.memberIds.delete(playerId);
    this.playerToParty.delete(playerId);

    // If party is empty, delete it
    if (party.memberIds.size === 0) {
      this.parties.delete(partyId);
      return { success: true, message: 'Đã rời nhóm. Nhóm đã bị giải tán.', wasLeader };
    }

    // If leader left, promote someone else
    let newLeaderId: string | undefined;
    if (wasLeader) {
      newLeaderId = Array.from(party.memberIds)[0];
      party.leaderId = newLeaderId;
    }

    return { success: true, message: 'Đã rời nhóm.', wasLeader, newLeaderId };
  }

  // Kick a player from party (leader only)
  kickPlayer(leaderId: string, targetId: string): { success: boolean; message: string } {
    const partyId = this.playerToParty.get(leaderId);
    
    if (!partyId) {
      return { success: false, message: 'Bạn không ở trong nhóm nào.' };
    }

    const party = this.parties.get(partyId);
    if (!party) {
      return { success: false, message: 'Không tìm thấy nhóm.' };
    }

    if (party.leaderId !== leaderId) {
      return { success: false, message: 'Chỉ nhóm trưởng mới có thể đuổi thành viên.' };
    }

    if (!party.memberIds.has(targetId)) {
      return { success: false, message: 'Người chơi không ở trong nhóm.' };
    }

    if (targetId === leaderId) {
      return { success: false, message: 'Không thể đuổi chính mình. Hãy dùng lệnh rời nhóm.' };
    }

    // Remove player
    party.memberIds.delete(targetId);
    this.playerToParty.delete(targetId);

    return { success: true, message: 'Đã đuổi người chơi khỏi nhóm.' };
  }

  // Promote a player to leader (leader only)
  promotePlayer(leaderId: string, targetId: string): { success: boolean; message: string } {
    const partyId = this.playerToParty.get(leaderId);
    
    if (!partyId) {
      return { success: false, message: 'Bạn không ở trong nhóm nào.' };
    }

    const party = this.parties.get(partyId);
    if (!party) {
      return { success: false, message: 'Không tìm thấy nhóm.' };
    }

    if (party.leaderId !== leaderId) {
      return { success: false, message: 'Chỉ nhóm trưởng mới có thể trao quyền.' };
    }

    if (!party.memberIds.has(targetId)) {
      return { success: false, message: 'Người chơi không ở trong nhóm.' };
    }

    if (targetId === leaderId) {
      return { success: false, message: 'Bạn đã là nhóm trưởng.' };
    }

    // Change leader
    party.leaderId = targetId;

    return { success: true, message: 'Đã trao quyền nhóm trưởng.' };
  }

  // Set loot rule (leader only)
  setLootRule(leaderId: string, rule: 'leader-only' | 'round-robin'): { success: boolean; message: string } {
    const partyId = this.playerToParty.get(leaderId);
    
    if (!partyId) {
      return { success: false, message: 'Bạn không ở trong nhóm nào.' };
    }

    const party = this.parties.get(partyId);
    if (!party) {
      return { success: false, message: 'Không tìm thấy nhóm.' };
    }

    if (party.leaderId !== leaderId) {
      return { success: false, message: 'Chỉ nhóm trưởng mới có thể đặt quy tắc nhặt đồ.' };
    }

    party.lootRule = rule;
    party.lootTurn = 0; // Reset turn

    return { success: true, message: `Đã đặt quy tắc nhặt đồ: ${rule === 'leader-only' ? 'Chỉ Trưởng Nhóm' : 'Theo Lượt'}.` };
  }

  // Get party information
  getParty(partyId: string): PartyState | undefined {
    return this.parties.get(partyId);
  }

  // Get player's party
  getPlayerParty(playerId: string): { partyId: string; party: PartyState } | null {
    const partyId = this.playerToParty.get(playerId);
    if (!partyId) return null;
    
    const party = this.parties.get(partyId);
    if (!party) return null;
    
    return { partyId, party };
  }

  // Check if player can loot
  canLoot(playerId: string): { canLoot: boolean; reason?: string } {
    const partyId = this.playerToParty.get(playerId);
    if (!partyId) {
      return { canLoot: true }; // Not in party, can loot freely
    }

    const party = this.parties.get(partyId);
    if (!party) {
      return { canLoot: true };
    }

    if (party.lootRule === 'leader-only') {
      if (party.leaderId === playerId) {
        return { canLoot: true };
      }
      return { canLoot: false, reason: 'Chỉ nhóm trưởng mới có thể nhặt đồ.' };
    }

    // For round-robin, check if it's this player's turn
    const memberIds = Array.from(party.memberIds);
    const currentTurnPlayer = memberIds[party.lootTurn % memberIds.length];
    
    if (currentTurnPlayer === playerId) {
      return { canLoot: true };
    }
    
    return { canLoot: false, reason: `Đến lượt người khác nhặt đồ.` };
  }

  // Advance loot turn (for round-robin)
  advanceLootTurn(partyId: string) {
    const party = this.parties.get(partyId);
    if (party && party.lootRule === 'round-robin') {
      party.lootTurn++;
    }
  }

  // Get next looter for round-robin
  getNextLooter(partyId: string): string | null {
    const party = this.parties.get(partyId);
    if (!party || party.lootRule !== 'round-robin') {
      return null;
    }

    const memberIds = Array.from(party.memberIds);
    return memberIds[party.lootTurn % memberIds.length] || null;
  }

  // Broadcast to party members
  getPartyMemberIds(partyId: string): string[] {
    const party = this.parties.get(partyId);
    if (!party) return [];
    return Array.from(party.memberIds);
  }

  // Get pending invitations for a player
  getPendingInvitations(playerId: string): { inviterId: string; partyId: string; timestamp: number }[] {
    const invitations: { inviterId: string; partyId: string; timestamp: number }[] = [];
    
    this.parties.forEach((party, partyId) => {
      const invitation = party.invitations.get(playerId);
      if (invitation) {
        invitations.push({
          inviterId: invitation.inviterId,
          partyId,
          timestamp: invitation.timestamp
        });
      }
    });
    
    return invitations;
  }

  // Clean up old invitations (older than 5 minutes)
  cleanupOldInvitations() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    this.parties.forEach(party => {
      party.invitations.forEach((invitation, playerId) => {
        if (now - invitation.timestamp > maxAge) {
          party.invitations.delete(playerId);
        }
      });
    });
  }
}

export const partyService = new PartyService();

// Clean up old invitations every minute
setInterval(() => {
  partyService.cleanupOldInvitations();
}, 60000);
