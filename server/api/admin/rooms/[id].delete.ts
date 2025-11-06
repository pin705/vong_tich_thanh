import { RoomSchema } from '~/models/Room';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Not authenticated'
      });
    }

    const roomId = getRouterParam(event, 'id');
    if (!roomId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Room ID is required'
      });
    }

    const room = await RoomSchema.findByIdAndDelete(roomId);

    if (!room) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Room not found'
      });
    }

    return {
      success: true,
      message: `Đã xóa phòng: ${room.name}`
    };
  } catch (error: any) {
    console.error('Error deleting room:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to delete room'
    });
  }
});
