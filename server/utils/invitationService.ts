import { gameState } from './gameState';

/**
 * Invitation Service - Centralized invitation management
 * Handles invitations for party, guild, and trade systems
 */

export type InvitationType = 'party' | 'guild' | 'trade';

export interface Invitation {
  id: string;
  inviterId: string;
  targetId: string;
  type: InvitationType;
  timestamp: number;
  metadata?: any; // Additional context-specific data
}

class InvitationService {
  private invitations: Map<string, Invitation> = new Map();
  
  /**
   * Generate a unique invitation ID
   */
  private generateInvitationId(): string {
    return `inv-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Create a new invitation
   * @param inviterId - The player sending the invitation
   * @param targetId - The player receiving the invitation
   * @param type - The type of invitation
   * @param metadata - Optional additional data
   * @param onAccept - Callback function to execute when invitation is accepted
   * @param onDecline - Callback function to execute when invitation is declined
   * @returns Success status and invitation ID
   */
  createInvitation(
    inviterId: string,
    targetId: string,
    type: InvitationType,
    metadata?: any,
    validate?: () => { valid: boolean; message?: string }
  ): { success: boolean; message: string; invitationId?: string } {
    try {
      // Check if inviter is online
      const inviter = gameState.getPlayer(inviterId);
      if (!inviter) {
        return { success: false, message: 'Người mời không trực tuyến.' };
      }

      // Check if target is online
      const target = gameState.getPlayer(targetId);
      if (!target) {
        return { success: false, message: 'Người chơi không trực tuyến.' };
      }

      // Check if target is the same as inviter
      if (inviterId === targetId) {
        return { success: false, message: 'Bạn không thể mời chính mình.' };
      }

      // Check for existing pending invitation of the same type to this target
      const existingInvitation = this.getPendingInvitationByTarget(targetId, type, inviterId);
      if (existingInvitation) {
        return { success: false, message: 'Đã có lời mời đang chờ xử lý.' };
      }

      // Run custom validation if provided
      if (validate) {
        const validationResult = validate();
        if (!validationResult.valid) {
          return { 
            success: false, 
            message: validationResult.message || 'Không thể gửi lời mời.' 
          };
        }
      }

      // Create invitation
      const invitationId = this.generateInvitationId();
      const invitation: Invitation = {
        id: invitationId,
        inviterId,
        targetId,
        type,
        timestamp: Date.now(),
        metadata
      };

      this.invitations.set(invitationId, invitation);

      // Send WebSocket notification to target
      if (target.ws) {
        const inviterPlayer = gameState.getPlayer(inviterId);
        target.ws.send(JSON.stringify({
          type: 'invitation',
          payload: {
            invitationId,
            inviterName: inviterPlayer?.username || 'Unknown',
            invitationType: type,
            message: this.getInvitationMessage(type, inviterPlayer?.username)
          }
        }));
      }

      return { 
        success: true, 
        message: 'Đã gửi lời mời.', 
        invitationId 
      };
    } catch (error) {
      console.error('Error creating invitation:', error);
      return { success: false, message: 'Lỗi khi tạo lời mời.' };
    }
  }

  /**
   * Accept an invitation
   * @param invitationId - The invitation ID
   * @param onAccept - Callback to execute the acceptance logic
   * @returns Success status and message
   */
  acceptInvitation(
    invitationId: string,
    onAccept: (invitation: Invitation) => Promise<{ success: boolean; message: string; data?: any }>
  ): Promise<{ success: boolean; message: string; data?: any }> {
    return this.processInvitation(invitationId, onAccept, true);
  }

  /**
   * Decline an invitation
   * @param invitationId - The invitation ID
   * @param onDecline - Optional callback to execute on decline
   * @returns Success status and message
   */
  async declineInvitation(
    invitationId: string,
    onDecline?: (invitation: Invitation) => Promise<void>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const invitation = this.invitations.get(invitationId);
      
      if (!invitation) {
        return { success: false, message: 'Không tìm thấy lời mời.' };
      }

      // Execute decline callback if provided
      if (onDecline) {
        await onDecline(invitation);
      }

      // Notify inviter
      const inviter = gameState.getPlayer(invitation.inviterId);
      const target = gameState.getPlayer(invitation.targetId);
      if (inviter?.ws) {
        inviter.ws.send(JSON.stringify({
          type: 'system',
          category: invitation.type,
          message: `[${target?.username || 'Player'}] đã từ chối lời mời ${this.getTypeLabel(invitation.type)}.`
        }));
      }

      // Remove invitation
      this.invitations.delete(invitationId);

      return { success: true, message: 'Đã từ chối lời mời.' };
    } catch (error) {
      console.error('Error declining invitation:', error);
      return { success: false, message: 'Lỗi khi từ chối lời mời.' };
    }
  }

  /**
   * Process an invitation (accept or decline)
   * @param invitationId - The invitation ID
   * @param callback - Callback to execute
   * @param isAccept - Whether this is an accept (true) or decline (false)
   * @returns Success status and message
   */
  private async processInvitation(
    invitationId: string,
    callback: (invitation: Invitation) => Promise<{ success: boolean; message: string; data?: any }>,
    isAccept: boolean
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const invitation = this.invitations.get(invitationId);
      
      if (!invitation) {
        return { success: false, message: 'Không tìm thấy lời mời.' };
      }

      // Execute callback
      const result = await callback(invitation);

      if (result.success) {
        // Notify inviter
        const inviter = gameState.getPlayer(invitation.inviterId);
        const target = gameState.getPlayer(invitation.targetId);
        if (inviter?.ws && isAccept) {
          inviter.ws.send(JSON.stringify({
            type: 'system',
            category: invitation.type,
            message: `[${target?.username || 'Player'}] đã chấp nhận lời mời ${this.getTypeLabel(invitation.type)}.`
          }));
        }

        // Remove invitation after successful processing
        this.invitations.delete(invitationId);
      }

      return result;
    } catch (error) {
      console.error('Error processing invitation:', error);
      return { success: false, message: 'Lỗi khi xử lý lời mời.' };
    }
  }

  /**
   * Get a pending invitation by ID
   * @param invitationId - The invitation ID
   * @returns The invitation or null
   */
  getInvitation(invitationId: string): Invitation | null {
    return this.invitations.get(invitationId) || null;
  }

  /**
   * Get all pending invitations for a target player
   * @param targetId - The target player ID
   * @param type - Optional filter by invitation type
   * @returns Array of invitations
   */
  getPendingInvitationsForTarget(targetId: string, type?: InvitationType): Invitation[] {
    const invitations: Invitation[] = [];
    
    this.invitations.forEach((invitation) => {
      if (invitation.targetId === targetId) {
        if (!type || invitation.type === type) {
          invitations.push(invitation);
        }
      }
    });
    
    return invitations;
  }

  /**
   * Get a specific pending invitation for a target from a specific inviter
   * @param targetId - The target player ID
   * @param type - The invitation type
   * @param inviterId - The inviter player ID
   * @returns The invitation or null
   */
  getPendingInvitationByTarget(targetId: string, type: InvitationType, inviterId: string): Invitation | null {
    for (const [, invitation] of this.invitations) {
      if (invitation.targetId === targetId && 
          invitation.type === type && 
          invitation.inviterId === inviterId) {
        return invitation;
      }
    }
    return null;
  }

  /**
   * Cancel all invitations involving a player (either as inviter or target)
   * @param playerId - The player ID
   */
  cancelAllInvitationsForPlayer(playerId: string): void {
    const toDelete: string[] = [];
    
    this.invitations.forEach((invitation, id) => {
      if (invitation.inviterId === playerId || invitation.targetId === playerId) {
        toDelete.push(id);
      }
    });
    
    toDelete.forEach(id => this.invitations.delete(id));
  }

  /**
   * Cancel invitations of a specific type for a player
   * @param playerId - The player ID
   * @param type - The invitation type
   */
  cancelInvitationsByType(playerId: string, type: InvitationType): void {
    const toDelete: string[] = [];
    
    this.invitations.forEach((invitation, id) => {
      if ((invitation.inviterId === playerId || invitation.targetId === playerId) && 
          invitation.type === type) {
        toDelete.push(id);
      }
    });
    
    toDelete.forEach(id => this.invitations.delete(id));
  }

  /**
   * Clean up expired invitations (older than 5 minutes)
   */
  cleanupExpiredInvitations(): void {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const toDelete: string[] = [];
    
    this.invitations.forEach((invitation, id) => {
      if (invitation.timestamp < fiveMinutesAgo) {
        toDelete.push(id);
      }
    });
    
    toDelete.forEach(id => this.invitations.delete(id));
  }

  /**
   * Get a human-readable invitation message
   * @param type - The invitation type
   * @param inviterName - The inviter's name
   * @returns The formatted message
   */
  private getInvitationMessage(type: InvitationType, inviterName?: string): string {
    const name = inviterName || 'Someone';
    switch (type) {
      case 'party':
        return `[${name}] mời bạn vào nhóm.`;
      case 'guild':
        return `[${name}] mời bạn vào bang hội.`;
      case 'trade':
        return `[${name}] mời bạn giao dịch.`;
      default:
        return `[${name}] gửi lời mời.`;
    }
  }

  /**
   * Get type label in Vietnamese
   * @param type - The invitation type
   * @returns The Vietnamese label
   */
  private getTypeLabel(type: InvitationType): string {
    switch (type) {
      case 'party':
        return 'nhóm';
      case 'guild':
        return 'bang hội';
      case 'trade':
        return 'giao dịch';
      default:
        return 'lời mời';
    }
  }
}

// Export singleton instance
export const invitationService = new InvitationService();

