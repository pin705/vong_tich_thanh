import { AuctionItemSchema } from '../../../models/AuctionItem';

export default defineEventHandler(async (event) => {
  const user = await getUserSession(event);
  if (!user?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    });
  }

  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  try {
    // Get active auctions only
    const now = new Date();
    const filter = {
      status: 'active',
      expiresAt: { $gt: now }
    };

    const auctions = await AuctionItemSchema.find(filter)
      .populate('item', 'name description type value')
      .populate('seller', 'username level')
      .populate('currentBidder', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuctionItemSchema.countDocuments(filter);

    return {
      success: true,
      auctions: auctions.map((auction: any) => ({
        id: auction._id,
        item: auction.item,
        seller: {
          id: auction.seller._id,
          username: auction.seller.username,
          level: auction.seller.level
        },
        startingPrice: auction.startingPrice,
        currentBid: auction.currentBid,
        currentBidder: auction.currentBidder ? {
          id: auction.currentBidder._id,
          username: auction.currentBidder.username
        } : null,
        buyoutPrice: auction.buyoutPrice,
        expiresAt: auction.expiresAt,
        bidCount: auction.bidHistory?.length || 0
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error listing auctions:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Lỗi khi lấy danh sách đấu giá.'
    });
  }
});
