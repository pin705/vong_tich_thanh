// Trade service to manage player-to-player trading
interface TradeState {
  initiatorId: string;
  targetId: string;
  initiatorItems: string[]; // Item IDs
  targetItems: string[];
  initiatorGold: number;
  targetGold: number;
  initiatorLocked: boolean;
  targetLocked: boolean;
  initiatorConfirmed: boolean;
  targetConfirmed: boolean;
}

class TradeService {
  private trades: Map<string, TradeState>;
  private pendingInvitations: Map<string, { inviterId: string; timestamp: number }>;

  constructor() {
    this.trades = new Map();
    this.pendingInvitations = new Map();
  }

  // Send trade invitation
  inviteTrade(inviterId: string, targetId: string): { success: boolean; message: string } {
    // Check if either player is already in a trade
    if (this.getPlayerTrade(inviterId)) {
      return { success: false, message: 'Bạn đang trong một giao dịch khác.' };
    }
    if (this.getPlayerTrade(targetId)) {
      return { success: false, message: 'Người chơi đang trong một giao dịch khác.' };
    }

    // Check if there's already a pending invitation
    if (this.pendingInvitations.has(targetId)) {
      return { success: false, message: 'Người chơi đã có lời mời giao dịch đang chờ.' };
    }

    // Create pending invitation
    this.pendingInvitations.set(targetId, { inviterId, timestamp: Date.now() });

    return { success: true, message: 'Đã gửi lời mời giao dịch.' };
  }

  // Accept trade invitation
  acceptTrade(targetId: string, inviterId: string): { success: boolean; message: string; tradeId?: string } {
    const invitation = this.pendingInvitations.get(targetId);

    if (!invitation || invitation.inviterId !== inviterId) {
      return { success: false, message: 'Không tìm thấy lời mời giao dịch.' };
    }

    // Check if either player is already in a trade
    if (this.getPlayerTrade(inviterId)) {
      return { success: false, message: 'Người mời đang trong một giao dịch khác.' };
    }
    if (this.getPlayerTrade(targetId)) {
      return { success: false, message: 'Bạn đang trong một giao dịch khác.' };
    }

    // Remove invitation
    this.pendingInvitations.delete(targetId);

    // Create trade
    const tradeId = `${inviterId}-${targetId}-${Date.now()}`;
    this.trades.set(tradeId, {
      initiatorId: inviterId,
      targetId,
      initiatorItems: [],
      targetItems: [],
      initiatorGold: 0,
      targetGold: 0,
      initiatorLocked: false,
      targetLocked: false,
      initiatorConfirmed: false,
      targetConfirmed: false
    });

    return { success: true, message: 'Bắt đầu giao dịch!', tradeId };
  }

  // Decline trade invitation
  declineTrade(targetId: string, inviterId: string): { success: boolean; message: string } {
    const invitation = this.pendingInvitations.get(targetId);

    if (!invitation || invitation.inviterId !== inviterId) {
      return { success: false, message: 'Không tìm thấy lời mời giao dịch.' };
    }

    this.pendingInvitations.delete(targetId);
    return { success: true, message: 'Đã từ chối lời mời giao dịch.' };
  }

  // Get pending invitation for a player
  getPendingInvitation(playerId: string): { inviterId: string; timestamp: number } | null {
    return this.pendingInvitations.get(playerId) || null;
  }

  // Get trade that a player is part of
  getPlayerTrade(playerId: string): { tradeId: string; trade: TradeState; isInitiator: boolean } | null {
    for (const [tradeId, trade] of this.trades) {
      if (trade.initiatorId === playerId) {
        return { tradeId, trade, isInitiator: true };
      }
      if (trade.targetId === playerId) {
        return { tradeId, trade, isInitiator: false };
      }
    }
    return null;
  }

  // Add item to trade
  addItem(playerId: string, itemId: string): { success: boolean; message: string } {
    const playerTrade = this.getPlayerTrade(playerId);
    if (!playerTrade) {
      return { success: false, message: 'Bạn không đang trong giao dịch nào.' };
    }

    const { trade, isInitiator } = playerTrade;

    // Check if trade is locked
    if ((isInitiator && trade.initiatorLocked) || (!isInitiator && trade.targetLocked)) {
      return { success: false, message: 'Giao dịch đã bị khóa. Không thể thêm vật phẩm.' };
    }

    // Add item
    if (isInitiator) {
      trade.initiatorItems.push(itemId);
    } else {
      trade.targetItems.push(itemId);
    }

    return { success: true, message: 'Đã thêm vật phẩm vào giao dịch.' };
  }

  // Add gold to trade
  addGold(playerId: string, amount: number): { success: boolean; message: string } {
    const playerTrade = this.getPlayerTrade(playerId);
    if (!playerTrade) {
      return { success: false, message: 'Bạn không đang trong giao dịch nào.' };
    }

    const { trade, isInitiator } = playerTrade;

    // Check if trade is locked
    if ((isInitiator && trade.initiatorLocked) || (!isInitiator && trade.targetLocked)) {
      return { success: false, message: 'Giao dịch đã bị khóa. Không thể thêm vàng.' };
    }

    // Add gold
    if (isInitiator) {
      trade.initiatorGold = amount;
    } else {
      trade.targetGold = amount;
    }

    return { success: true, message: `Đã đặt ${amount} vàng vào giao dịch.` };
  }

  // Lock trade (prevent further changes)
  lockTrade(playerId: string): { success: boolean; message: string } {
    const playerTrade = this.getPlayerTrade(playerId);
    if (!playerTrade) {
      return { success: false, message: 'Bạn không đang trong giao dịch nào.' };
    }

    const { trade, isInitiator } = playerTrade;

    if (isInitiator) {
      trade.initiatorLocked = true;
    } else {
      trade.targetLocked = true;
    }

    return { success: true, message: 'Đã khóa giao dịch của bạn.' };
  }

  // Confirm trade (ready to complete)
  confirmTrade(playerId: string): { success: boolean; message: string; bothConfirmed?: boolean } {
    const playerTrade = this.getPlayerTrade(playerId);
    if (!playerTrade) {
      return { success: false, message: 'Bạn không đang trong giao dịch nào.' };
    }

    const { trade, isInitiator } = playerTrade;

    // Check if both sides are locked
    if (!trade.initiatorLocked || !trade.targetLocked) {
      return { success: false, message: 'Cả hai bên phải khóa giao dịch trước khi xác nhận.' };
    }

    if (isInitiator) {
      trade.initiatorConfirmed = true;
    } else {
      trade.targetConfirmed = true;
    }

    const bothConfirmed = trade.initiatorConfirmed && trade.targetConfirmed;
    return { 
      success: true, 
      message: 'Đã xác nhận giao dịch.', 
      bothConfirmed 
    };
  }

  // Complete trade (execute the exchange)
  completeTrade(tradeId: string): TradeState | null {
    const trade = this.trades.get(tradeId);
    if (!trade) return null;

    // Remove from active trades
    this.trades.delete(tradeId);

    return trade;
  }

  // Cancel trade
  cancelTrade(playerId: string): { success: boolean; message: string; tradeId?: string } {
    const playerTrade = this.getPlayerTrade(playerId);
    if (!playerTrade) {
      return { success: false, message: 'Bạn không đang trong giao dịch nào.' };
    }

    this.trades.delete(playerTrade.tradeId);
    return { success: true, message: 'Đã hủy giao dịch.', tradeId: playerTrade.tradeId };
  }
}

export const tradeService = new TradeService();
