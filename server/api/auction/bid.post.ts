import { AuctionItemSchema } from '../../../models/AuctionItem';
import { PlayerSchema } from '../../../models/Player';

const MIN_BID_INCREMENT = 5; // Minimum bid increment

export default defineEventHandler(async (event) => {
  const user = await getUserSession(event);
  if (!user?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    });
  }

  const body = await readBody(event);
  const { auctionId, bidAmount } = body;

  if (!auctionId || !bidAmount) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Auction ID và số tiền đặt giá là bắt buộc.'
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
    const auction = await AuctionItemSchema.findById(auctionId);
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

    // Can't bid on own auction
    if (auction.seller.toString() === playerId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Không thể đặt giá đấu giá của chính mình.'
      });
    }

    // Check if bid is higher than current bid
    const minBid = auction.currentBid > 0 
      ? auction.currentBid + MIN_BID_INCREMENT 
      : auction.startingPrice;

    if (bidAmount < minBid) {
      throw createError({
        statusCode: 400,
        statusMessage: `Giá đặt phải ít nhất ${minBid} vàng.`
      });
    }

    // Check if player has enough gold
    if (player.gold < bidAmount) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Không đủ vàng để đặt giá.'
      });
    }

    // Store previous bidder info before updating
    const previousBidderId = auction.currentBidder;
    const previousBid = auction.currentBid;

    // Update auction atomically to prevent race conditions
    const updatedAuction = await AuctionItemSchema.findOneAndUpdate(
      { 
        _id: auctionId, 
        status: 'active',
        expiresAt: { $gte: new Date() },
        currentBid: { $lt: bidAmount } // Ensure bid is still higher
      },
      { 
        currentBid: bidAmount,
        currentBidder: player._id,
        $push: {
          bidHistory: {
            bidder: player._id,
            amount: bidAmount,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    // If update failed, another bid was placed or auction ended
    if (!updatedAuction) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Đấu giá đã kết thúc hoặc có người đặt giá cao hơn.'
      });
    }

    // Now process refunds and payments
    // Refund previous bidder
    if (previousBidderId) {
      const previousBidder = await PlayerSchema.findById(previousBidderId);
      if (previousBidder) {
        previousBidder.gold += previousBid;
        await previousBidder.save();
      }
    }

    // Deduct gold from new bidder
    player.gold -= bidAmount;
    await player.save();

    return {
      success: true,
      message: `Đã đặt giá ${bidAmount} vàng.`,
      auction: {
        id: auction._id,
        currentBid: auction.currentBid
      }
    };
  } catch (error: any) {
    console.error('Error bidding on auction:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Lỗi khi đặt giá.'
    });
  }
});
