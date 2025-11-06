import { PlayerSchema } from '~/models/Player';

export default defineEventHandler(async (event) => {
  try {
    // Get all players with dungeon progress
    const players = await PlayerSchema.find({
      'dungeonProgress.highestFloor': { $exists: true }
    })
      .select('username level dungeonProgress guild')
      .populate('guild')
      .lean();

    // Map to leaderboard format
    const playersWithDungeonProgress = players.map((player: any) => ({
      username: player.username,
      level: player.level,
      highestFloor: player.dungeonProgress?.highestFloor || 1,
      currentFloor: player.dungeonProgress?.currentFloor || 1,
      guild: player.guild?.name || null
    }));

    // Sort by highest floor descending, then by current floor
    playersWithDungeonProgress.sort((a, b) => {
      if (b.highestFloor !== a.highestFloor) {
        return b.highestFloor - a.highestFloor;
      }
      return b.currentFloor - a.currentFloor;
    });

    // Return top 100
    const topPlayers = playersWithDungeonProgress.slice(0, 100);

    return {
      success: true,
      leaderboard: topPlayers
    };
  } catch (error) {
    console.error('Error fetching dungeon leaderboard:', error);
    return {
      success: false,
      message: 'Không thể tải bảng xếp hạng hầm ngục.',
      leaderboard: []
    };
  }
});
