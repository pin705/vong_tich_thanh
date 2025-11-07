import { PlayerSchema } from '~/models/Player';
import { PetSchema } from '~/models/Pet';
import { ItemSchema } from '~/models/Item';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Bạn chưa đăng nhập.'
      });
    }

    const body = await readBody(event);
    const { petId, newName, tagInstanceId } = body;
    const playerId = session.user.id;

    if (!petId || !newName || !tagInstanceId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Thiếu thông tin cần thiết.'
      });
    }

    // Validate new name
    if (newName.length < 2 || newName.length > 20) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Tên pet phải từ 2-20 ký tự.'
      });
    }

    // Get player
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy người chơi.'
      });
    }

    // Check if player has the rename tag
    const hasTag = player.inventory.some((itemId: any) => 
      itemId.toString() === tagInstanceId
    );

    if (!hasTag) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bạn không có Thẻ Đổi Tên Pet.'
      });
    }

    // Get the pet
    const pet = await PetSchema.findById(petId);
    if (!pet) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy thú cưng.'
      });
    }

    // Check if pet belongs to player
    if (pet.ownerId.toString() !== playerId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Thú cưng này không thuộc về bạn.'
      });
    }

    // Consume the tag
    player.inventory = player.inventory.filter((itemId: any) => 
      itemId.toString() !== tagInstanceId
    );
    await player.save();

    // Delete the tag item
    await ItemSchema.findByIdAndDelete(tagInstanceId);

    // Rename the pet
    const oldName = pet.nickname;
    pet.nickname = newName;
    await pet.save();

    return {
      success: true,
      message: `Đã đổi tên thú cưng từ "${oldName}" thành "${newName}"!`,
      pet: {
        _id: pet._id,
        nickname: pet.nickname,
        level: pet.level,
        quality: pet.quality
      }
    };
  } catch (error: any) {
    console.error('Error renaming pet:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Lỗi khi đổi tên thú cưng.'
    });
  }
});
