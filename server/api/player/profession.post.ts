import { PlayerSchema } from '~/models/Player';
import { ItemSchema } from '~/models/Item';
import { professionStarterItems, validProfessions } from '~/server/utils/professionData';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const body = await readBody(event);
    const { profession } = body;

    if (!profession) {
      return { success: false, message: 'Profession is required' };
    }

    if (!validProfessions.includes(profession)) {
      return { success: false, message: 'Invalid profession' };
    }

    const playerId = session.user.id;

    // Check if player already has a profession
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    if (player.profession) {
      return { success: false, message: 'Bạn đã có nghề nghiệp rồi!' };
    }

    // Set profession
    player.profession = profession;
    player.professionLevel = 1;
    player.professionExp = 0;

    // Give starter items
    const starterItems = professionStarterItems[profession] || [];
    for (const itemData of starterItems) {
      const item = await ItemSchema.create({
        name: itemData.name,
        description: itemData.description,
        type: itemData.type,
        value: itemData.value,
        stats: itemData.stats || {}
      });
      player.inventory.push(item._id);
    }

    await player.save();

    return {
      success: true,
      message: `Đã chọn nghề nghiệp: ${profession}`,
      profession: player.profession,
      professionLevel: player.professionLevel
    };
  } catch (error) {
    console.error('Error choosing profession:', error);
    return { 
      success: false, 
      message: 'Failed to choose profession'
    };
  }
});
