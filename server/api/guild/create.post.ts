import { GuildSchema } from '../../../models/Guild';
import { PlayerSchema } from '../../../models/Player';
import { GUILD_CREATION_COST, GUILD_TAG_MIN_LENGTH, GUILD_TAG_MAX_LENGTH, GUILD_NAME_MAX_LENGTH } from '../../utils/constants';

export default defineEventHandler(async (event) => {
  const user = await getUserSession(event);
  if (!user?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    });
  }

  const body = await readBody(event);
  const { name, tag } = body;

  // Validate input
  if (!name || !tag) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tên bang và tag là bắt buộc.'
    });
  }

  if (name.length > GUILD_NAME_MAX_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Tên bang không được dài quá ${GUILD_NAME_MAX_LENGTH} ký tự.`
    });
  }

  if (tag.length < GUILD_TAG_MIN_LENGTH || tag.length > GUILD_TAG_MAX_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Tag phải có từ ${GUILD_TAG_MIN_LENGTH} đến ${GUILD_TAG_MAX_LENGTH} ký tự.`
    });
  }

  const playerId = user.user.id;
  
  // Check if player exists
  const player = await PlayerSchema.findById(playerId);
  if (!player) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy thông tin người chơi.'
    });
  }

  // Check if player already in a guild
  if (player.guild) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bạn đã có bang hội. Hãy rời bang hiện tại trước.'
    });
  }

  // Check if player has enough gold
  if (player.gold < GUILD_CREATION_COST) {
    throw createError({
      statusCode: 400,
      statusMessage: `Không đủ vàng. Cần ${GUILD_CREATION_COST} vàng để tạo bang.`
    });
  }

  // Check if guild name or tag already exists
  const existingGuild = await GuildSchema.findOne({
    $or: [
      { name: name },
      { tag: tag }
    ]
  });

  if (existingGuild) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tên bang hoặc tag đã tồn tại.'
    });
  }

  // Create guild
  const guild = await GuildSchema.create({
    name,
    tag,
    leader: playerId,
    officers: [],
    members: [playerId],
    level: 1,
    experience: 0,
    bank: [],
    currency: 0
  });

  // Update player
  player.gold -= GUILD_CREATION_COST;
  player.guild = guild._id;
  await player.save();

  return {
    success: true,
    message: `Đã tạo bang [${tag}] ${name}. Tốn ${GUILD_CREATION_COST} vàng.`,
    guild: {
      id: guild._id,
      name: guild.name,
      tag: guild.tag,
      level: guild.level
    }
  };
});
