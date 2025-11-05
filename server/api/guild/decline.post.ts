import { guildService } from '../../utils/guildService';

export default defineEventHandler(async (event) => {
  const user = await getUserSession(event);
  if (!user?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    });
  }

  const body = await readBody(event);
  const { guildId } = body;

  if (!guildId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Guild ID is required.'
    });
  }

  const playerId = user.user.id;

  // Decline invitation via guild service
  const result = guildService.declineInvitation(playerId, guildId);
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.message
    });
  }

  return {
    success: true,
    message: result.message
  };
});
