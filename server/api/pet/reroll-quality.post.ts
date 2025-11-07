import { PlayerSchema } from '~/models/Player';
import { PetSchema } from '~/models/Pet';
import { PetTemplateSchema } from '~/models/PetTemplate';
import { ItemSchema } from '~/models/Item';
import { determinePetQuality, QUALITY_GROWTH_MULTIPLIER } from '~/server/utils/petService';

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
    const { petId, materialInstanceId } = body;
    const playerId = session.user.id;

    if (!petId || !materialInstanceId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Thiếu thông tin cần thiết.'
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

    // Check if player has the reroll stone
    const hasStone = player.inventory.some((itemId: any) => 
      itemId.toString() === materialInstanceId
    );

    if (!hasStone) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bạn không có Đá Tẩy Tủy Pet.'
      });
    }

    // Get the pet
    const pet = await PetSchema.findById(petId).populate('templateId');
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

    // Consume the stone
    player.inventory = player.inventory.filter((itemId: any) => 
      itemId.toString() !== materialInstanceId
    );
    await player.save();

    // Delete the stone item
    await ItemSchema.findByIdAndDelete(materialInstanceId);

    // Store old quality
    const oldQuality = pet.quality;

    // Reroll quality
    const newQuality = determinePetQuality();
    pet.quality = newQuality;

    // Recalculate stats based on new quality
    const template: any = pet.templateId;
    const oldMultiplier = QUALITY_GROWTH_MULTIPLIER[oldQuality as keyof typeof QUALITY_GROWTH_MULTIPLIER] || 1.0;
    const newMultiplier = QUALITY_GROWTH_MULTIPLIER[newQuality as keyof typeof QUALITY_GROWTH_MULTIPLIER] || 1.0;

    // Calculate stat changes
    const levelGained = pet.level - 1; // Levels gained from level 1
    
    // Remove old quality bonuses
    const oldHpBonus = Math.floor(template.statGrowth.hpPerLevel * oldMultiplier * levelGained);
    const oldAttackBonus = Math.floor(template.statGrowth.attackPerLevel * oldMultiplier * levelGained);
    const oldDefenseBonus = Math.floor(template.statGrowth.defensePerLevel * oldMultiplier * levelGained);

    // Add new quality bonuses
    const newHpBonus = Math.floor(template.statGrowth.hpPerLevel * newMultiplier * levelGained);
    const newAttackBonus = Math.floor(template.statGrowth.attackPerLevel * newMultiplier * levelGained);
    const newDefenseBonus = Math.floor(template.statGrowth.defensePerLevel * newMultiplier * levelGained);

    // Apply changes
    pet.currentStats.maxHp = template.baseStats.hp + newHpBonus;
    pet.currentStats.hp = pet.currentStats.maxHp; // Full heal
    pet.currentStats.attack = template.baseStats.attack + newAttackBonus;
    pet.currentStats.defense = template.baseStats.defense + newDefenseBonus;

    await pet.save();

    // Quality names in Vietnamese
    const qualityNames: { [key: string]: string } = {
      COMMON: 'Thường',
      UNCOMMON: 'Không Phổ Biến',
      RARE: 'Hiếm',
      EPIC: 'Sử Thi',
      LEGENDARY: 'Huyền Thoại'
    };

    return {
      success: true,
      message: `Phẩm chất đã thay đổi từ ${qualityNames[oldQuality]} sang ${qualityNames[newQuality]}!`,
      pet: {
        _id: pet._id,
        nickname: pet.nickname,
        level: pet.level,
        quality: pet.quality,
        oldQuality,
        newQuality,
        currentStats: pet.currentStats
      }
    };
  } catch (error: any) {
    console.error('Error rerolling pet quality:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Lỗi khi tẩy tủy thú cưng.'
    });
  }
});
