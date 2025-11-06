import { PlayerSchema } from '~/models/Player';
import { calculatePlayerPower } from '~/server/utils/powerCalculation';

export default defineEventHandler(async (event) => {
  try {
    // Get top players by power
    const players = await PlayerSchema.find()
      .populate('equipment.helmet')
      .populate('equipment.chest')
      .populate('equipment.legs')
      .populate('equipment.boots')
      .populate('equipment.weapon')
      .populate('guild')
      .lean();

    // Calculate power for each player
    const playersWithPower = players.map((player: any) => ({
      username: player.username,
      level: player.level,
      power: calculatePlayerPower(player),
      guild: player.guild?.name || null,
      profession: player.profession || null,
      professionLevel: player.professionLevel || 0
    }));

    // Sort by power descending
    playersWithPower.sort((a, b) => b.power - a.power);

    // Return top 100
    const topPlayers = playersWithPower.slice(0, 100);

    return {
      success: true,
      leaderboard: topPlayers
    };
  } catch (error) {
    console.error('Error fetching power leaderboard:', error);
    return {
      success: false,
      message: 'Không thể tải bảng xếp hạng sức mạnh.',
      leaderboard: []
    };
  }
});
