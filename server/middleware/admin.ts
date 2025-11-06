import { PlayerSchema } from '~/models/Player';

export default defineEventHandler(async (event) => {
  // Only apply to admin routes
  if (!event.path.startsWith('/api/admin')) {
    return;
  }

  try {
    const session = await getUserSession(event);
    
    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please login'
      });
    }

    // Get player from database
    const player = await PlayerSchema.findById(session.user.id);
    
    if (!player || player.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden - Admin access required'
      });
    }

    // User is admin, allow the request to proceed
  } catch (error: any) {
    // If it's already an error with statusCode, rethrow it
    if (error.statusCode) {
      throw error;
    }
    
    // Otherwise, wrap in a 500 error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});
