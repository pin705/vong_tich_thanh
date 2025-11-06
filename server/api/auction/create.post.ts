import { AuctionItemSchema } from '../../../models/AuctionItem';
import { PlayerSchema } from '../../../models/Player';
import { ItemSchema } from '../../../models/Item';
import { removeItemFromPlayer, removeGoldFromPlayer, addItemToPlayer } from '../../utils/inventoryService';

const AUCTION_FEE = 10; // 10 gold to create auction
const DEFAULT_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export default defineEventHandler(async (event) => {
  const user = await getUserSession(event);
  if (!user?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    });
  }

  const body = await readBody(event);
  const { itemId, startingPrice, buyoutPrice, duration } = body;

  if (!itemId || !startingPrice) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Item ID và giá khởi điểm là bắt buộc.'
    });
  }

  if (startingPrice < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Giá khởi điểm phải lớn hơn 0.'
    });
  }

  if (buyoutPrice && buyoutPrice <= startingPrice) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Giá mua ngay phải lớn hơn giá khởi điểm.'
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

    // Check if player has enough gold for auction fee
    if (player.gold < AUCTION_FEE) {
      throw createError({
        statusCode: 400,
        statusMessage: `Không đủ vàng để tạo đấu giá. Phí: ${AUCTION_FEE} vàng.`
      });
    }

    // Check if item exists in player's inventory
    const itemExists = player.inventory.some((id: any) => id.toString() === itemId);
    if (!itemExists) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Vật phẩm không có trong túi đồ.'
      });
    }

    // Get item details
    const item = await ItemSchema.findById(itemId);
    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy vật phẩm.'
      });
    }

    // Use inventory service to remove item and deduct gold
    const removeItemResult = await removeItemFromPlayer(playerId, itemId);
    if (!removeItemResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: removeItemResult.message
      });
    }

    const removeGoldResult = await removeGoldFromPlayer(playerId, AUCTION_FEE);
    if (!removeGoldResult.success) {
      // Rollback: add item back to inventory using inventory service
      await addItemToPlayer(playerId, itemId);
      throw createError({
        statusCode: 400,
        statusMessage: removeGoldResult.message
      });
    }

    // Create auction
    const auctionDuration = duration || DEFAULT_DURATION;
    const expiresAt = new Date(Date.now() + auctionDuration);

    const auction = await AuctionItemSchema.create({
      item: itemId,
      seller: playerId,
      startingPrice,
      currentBid: 0,
      buyoutPrice: buyoutPrice || null,
      duration: auctionDuration,
      expiresAt,
      status: 'active'
    });

    return {
      success: true,
      message: `Đã tạo đấu giá cho [${item.name}]. Phí: ${AUCTION_FEE} vàng.`,
      auction: {
        id: auction._id,
        expiresAt: auction.expiresAt
      }
    };
  } catch (error: any) {
    console.error('Error creating auction:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Lỗi khi tạo đấu giá.'
    });
  }
});
