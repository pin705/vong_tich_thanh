import { RoomSchema } from '~/models/Room';

export default defineEventHandler(async (event) => {
  try {
    // Get all rooms
    const rooms = await RoomSchema.find({}).lean();

    return {
      success: true,
      rooms: rooms.map((room: any) => ({
        id: room._id.toString(),
        name: room.name,
        description: room.description,
        zone: room.zone
      }))
    };
  } catch (error) {
    console.error('Error loading rooms:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load rooms'
    });
  }
});
