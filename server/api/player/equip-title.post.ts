import { PlayerSchema } from '~/models/Player';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const body = await readBody(event);
    const { titleKey } = body;

    const playerId = session.user.id;

    // Get player
    const player = await PlayerSchema.findById(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    // If titleKey is null, unequip current title
    if (titleKey === null) {
      player.activeTitleKey = null;
      await player.save();

      // Recalculate stats
      const { recalculateStats } = await import('~/server/utils/playerStats');
      await recalculateStats(playerId);

      return {
        success: true,
        message: 'Đã tháo danh hiệu!',
        activeTitleKey: null,
      };
    }

    if (!titleKey) {
      return { success: false, message: 'Title key is required' };
    }

    // Check if player has this title
    const hasTitle = player.unlockedTitles?.some((t: any) => t.key === titleKey);
    if (!hasTitle) {
      return { success: false, message: 'Bạn chưa mở khóa danh hiệu này!' };
    }

    // Equip the title
    player.activeTitleKey = titleKey;
    await player.save();

    // Recalculate stats
    const { recalculateStats } = await import('~/server/utils/playerStats');
    await recalculateStats(playerId);

    return {
      success: true,
      message: 'Đã trang bị danh hiệu!',
      activeTitleKey: titleKey,
    };
  } catch (error) {
    console.error('Error equipping title:', error);
    return {
      success: false,
      message: 'Failed to equip title',
    };
  }
});
