import { PlayerFactionSchema } from '../../../models/PlayerFaction';

export default defineEventHandler(async (event) => {
  const user = await getUserSession(event);
  if (!user?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    });
  }

  const playerId = user.user.id;

  try {
    // Get all faction reputations for the player
    const reputations = await PlayerFactionSchema.find({ player: playerId });

    // Format reputation levels
    const formattedReputations = reputations.map((rep: any) => {
      let level = 'Trung Lập';
      const reputation = rep.reputation;

      if (reputation >= 6000) level = 'Tôn Kính';
      else if (reputation >= 3000) level = 'Danh Dự';
      else if (reputation >= 500) level = 'Thân Thiện';
      else if (reputation >= 0) level = 'Trung Lập';
      else if (reputation >= -500) level = 'Không Thân Thiện';
      else if (reputation >= -3000) level = 'Thù Địch';
      else level = 'Căm Ghét';

      return {
        faction: rep.factionName,
        reputation: rep.reputation,
        level
      };
    });

    return {
      success: true,
      reputations: formattedReputations
    };
  } catch (error) {
    console.error('Error getting faction reputations:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Lỗi khi lấy thông tin danh vọng.'
    });
  }
});
