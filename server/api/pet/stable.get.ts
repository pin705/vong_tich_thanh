import { PlayerSchema } from '~/models/Player';
import { PetSchema } from '~/models/Pet';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Bạn chưa đăng nhập.'
      });
    }

    const playerId = session.user.id;

    // Get player with pets
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Không tìm thấy người chơi.'
      });
    }

    // Get all pets in stable
    const pets = await PetSchema.find({ 
      _id: { $in: player.petStable || [] } 
    }).populate('templateId');

    // Format pet data
    const formattedPets = pets.map((pet: any) => ({
      _id: pet._id,
      nickname: pet.nickname,
      level: pet.level,
      exp: pet.exp,
      expToNextLevel: pet.expToNextLevel,
      quality: pet.quality,
      currentStats: pet.currentStats,
      skills: pet.skills,
      templateName: pet.templateId?.name || 'Unknown',
      isActive: player.activePetId?.toString() === pet._id.toString()
    }));

    return {
      success: true,
      pets: formattedPets,
      activePetId: player.activePetId?.toString() || null
    };
  } catch (error: any) {
    console.error('Error getting pet stable:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Lỗi khi lấy danh sách thú cưng.'
    });
  }
});
