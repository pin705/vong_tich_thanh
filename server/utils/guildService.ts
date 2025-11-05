// Guild System - In-memory guild management for real-time features
// Note: Persistent data is stored in MongoDB via GuildSchema

export interface GuildInvitation {
  guildId: string;
  guildName: string;
  inviterId: string;
  inviterName: string;
  timestamp: number;
}

class GuildService {
  // Track pending invitations (guildId -> playerId -> invitation)
  private invitations: Map<string, Map<string, GuildInvitation>> = new Map();
  
  // Track online guild members for real-time chat
  private onlineMembers: Map<string, Set<string>> = new Map(); // guildId -> Set of playerIds

  // Add player to online members
  addOnlineMember(guildId: string, playerId: string) {
    if (!this.onlineMembers.has(guildId)) {
      this.onlineMembers.set(guildId, new Set());
    }
    this.onlineMembers.get(guildId)!.add(playerId);
  }

  // Remove player from online members
  removeOnlineMember(guildId: string, playerId: string) {
    const members = this.onlineMembers.get(guildId);
    if (members) {
      members.delete(playerId);
      if (members.size === 0) {
        this.onlineMembers.delete(guildId);
      }
    }
  }

  // Get online members of a guild
  getOnlineMembers(guildId: string): string[] {
    const members = this.onlineMembers.get(guildId);
    return members ? Array.from(members) : [];
  }

  // Send invitation to player
  sendInvitation(guildId: string, guildName: string, inviterId: string, inviterName: string, targetId: string): { success: boolean; message: string } {
    // Check if player already has invitation from this guild
    let guildInvitations = this.invitations.get(guildId);
    if (!guildInvitations) {
      guildInvitations = new Map();
      this.invitations.set(guildId, guildInvitations);
    }

    if (guildInvitations.has(targetId)) {
      return { success: false, message: 'Đã gửi lời mời cho người chơi này.' };
    }

    // Add invitation
    guildInvitations.set(targetId, {
      guildId,
      guildName,
      inviterId,
      inviterName,
      timestamp: Date.now()
    });

    return { success: true, message: 'Đã gửi lời mời vào bang.' };
  }

  // Get pending invitations for a player
  getPendingInvitations(playerId: string): GuildInvitation[] {
    const invitations: GuildInvitation[] = [];
    
    this.invitations.forEach((guildInvitations) => {
      const invitation = guildInvitations.get(playerId);
      if (invitation) {
        invitations.push(invitation);
      }
    });
    
    return invitations;
  }

  // Accept invitation
  acceptInvitation(playerId: string, guildId: string): { success: boolean; message: string } {
    const guildInvitations = this.invitations.get(guildId);
    
    if (!guildInvitations || !guildInvitations.has(playerId)) {
      return { success: false, message: 'Không tìm thấy lời mời.' };
    }

    // Remove invitation
    guildInvitations.delete(playerId);
    if (guildInvitations.size === 0) {
      this.invitations.delete(guildId);
    }

    return { success: true, message: 'Đã tham gia bang.' };
  }

  // Decline invitation
  declineInvitation(playerId: string, guildId: string): { success: boolean; message: string } {
    const guildInvitations = this.invitations.get(guildId);
    
    if (!guildInvitations || !guildInvitations.has(playerId)) {
      return { success: false, message: 'Không tìm thấy lời mời.' };
    }

    // Remove invitation
    guildInvitations.delete(playerId);
    if (guildInvitations.size === 0) {
      this.invitations.delete(guildId);
    }

    return { success: true, message: 'Đã từ chối lời mời.' };
  }

  // Clean up old invitations (older than 10 minutes)
  cleanupOldInvitations() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    this.invitations.forEach((guildInvitations, guildId) => {
      guildInvitations.forEach((invitation, playerId) => {
        if (now - invitation.timestamp > maxAge) {
          guildInvitations.delete(playerId);
        }
      });
      
      // Clean up empty guild invitation maps
      if (guildInvitations.size === 0) {
        this.invitations.delete(guildId);
      }
    });
  }
}

export const guildService = new GuildService();

// Clean up old invitations every 2 minutes
setInterval(() => {
  guildService.cleanupOldInvitations();
}, 2 * 60 * 1000);
