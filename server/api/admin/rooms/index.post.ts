import { RoomSchema } from '~/models/Room';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // Create new room
    const room = await RoomSchema.create(body);

    return {
      success: true,
      message: `Đã tạo phòng: ${room.name}`,
      room: {
        id: room._id,
        name: room.name,
        zone: room.zone
      }
    };
  } catch (error: any) {
    console.error('Error creating room:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create room'
    });
  }
});
