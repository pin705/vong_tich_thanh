import { AuctionItemSchema } from '../../../models/AuctionItem';
import { PlayerSchema } from '../../../models/Player';
import { validateObjectId, validateNumber } from '~/server/utils/validation';

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

  if (!auctionId || bidAmount === undefined || bidAmount === null) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Auction ID và số tiền đặt giá là bắt buộc.'
    });
  }

  // Validate auctionId format
  const idValidation = validateObjectId(auctionId);
  if (!idValidation.valid) {
    throw createError({
      statusCode: 400,
      statusMessage: idValidation.error || 'Auction ID không hợp lệ.'
    });
  }

  // Validate bid amount
  const amountValidation = validateNumber(bidAmount, 'Số tiền đặt giá', { min: 1, integer: true });
  if (!amountValidation.valid) {
    throw createError({
      statusCode: 400,
      statusMessage: amountValidation.error || 'Số tiền đặt giá không hợp lệ.'
    });
  }

  const playerId = user.user.id;
  const validatedBidAmount = amountValidation.value!; // Use validated value

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

    if (validatedBidAmount < minBid) {
      throw createError({
        statusCode: 400,
        statusMessage: `Giá đặt phải ít nhất ${minBid} vàng.`
      });
    }

    // Check if player has enough gold
    if (player.gold < validatedBidAmount) {
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
        currentBid: { $lt: validatedBidAmount } // Ensure new bid is higher than current bid
      },
      { 
        currentBid: validatedBidAmount,
        currentBidder: player._id,
        $push: {
          bidHistory: {
            bidder: player._id,
            amount: validatedBidAmount,
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
    player.gold -= validatedBidAmount;
    await player.save();

    return {
      success: true,
      message: `Đã đặt giá ${validatedBidAmount} vàng.`,
      auction: {
        id: auction._id,
        currentBid: updatedAuction.currentBid
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
