import { AuctionItemSchema } from '../../../models/AuctionItem';
import { PlayerSchema } from '../../../models/Player';
import { ItemSchema } from '../../../models/Item';

export default defineEventHandler(async (event) => {
  const user = await getUserSession(event);
  if (!user?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    });
  }

  const body = await readBody(event);
  const { auctionId } = body;

  if (!auctionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Auction ID is required.'
    });
  }

  const playerId = user.user.id;

  try {
    // Get player
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy thông tin người chơi.'
      });
    }

    // Get auction
    const auction = await AuctionItemSchema.findById(auctionId)
      .populate('item', 'name');
    if (!auction) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy đấu giá.'
      });
    }

    // Check if auction is still active
    if (auction.status !== 'active' || auction.expiresAt < new Date()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Đấu giá đã kết thúc.'
      });
    }

    // Check if buyout price exists
    if (!auction.buyoutPrice) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Đấu giá này không có giá mua ngay.'
      });
    }

    // Can't buyout own auction
    if (auction.seller.toString() === playerId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Không thể mua đấu giá của chính mình.'
      });
    }

    // Check if player has enough gold
    if (player.gold < auction.buyoutPrice) {
      throw createError({
        statusCode: 400,
        statusMessage: `Không đủ vàng. Cần ${auction.buyoutPrice} vàng.`
      });
    }

    // Mark auction as sold first to prevent race conditions (atomic check-and-set)
    const updatedAuction = await AuctionItemSchema.findOneAndUpdate(
      { 
        _id: auctionId, 
        status: 'active',
        expiresAt: { $gte: new Date() }
      },
      { 
        status: 'sold',
        currentBid: auction.buyoutPrice,
        currentBidder: player._id
      },
      { new: false } // Return old document to check if update succeeded
    );

    // If update failed, auction was already sold or expired
    if (!updatedAuction || updatedAuction.status !== 'active') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Đấu giá đã kết thúc hoặc đã được mua.'
      });
    }

    // Now proceed with transfers (auction is locked as 'sold')
    // Refund previous bidder if exists
    if (auction.currentBidder) {
      const currentBidder = await PlayerSchema.findById(auction.currentBidder);
      if (currentBidder) {
        currentBidder.gold += auction.currentBid;
        await currentBidder.save();
      }
    }

    // Transfer gold to seller
    const seller = await PlayerSchema.findById(auction.seller);
    if (seller) {
      seller.gold += auction.buyoutPrice;
      await seller.save();
    }

    // Deduct gold from buyer and give item
    player.gold -= auction.buyoutPrice;
    player.inventory.push(auction.item._id);
    await player.save();

    const itemName = (auction.item as any).name || 'vật phẩm';

    return {
      success: true,
      message: `Đã mua [${itemName}] với giá ${auction.buyoutPrice} vàng.`
    };
  } catch (error: any) {
    console.error('Error buying out auction:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Lỗi khi mua ngay.'
    });
  }
});
