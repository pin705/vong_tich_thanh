import { PlayerSchema } from '../../../models/Player';

export default defineEventHandler(async (event) => {
  try {
    const { username, password } = await readBody(event);

    if (!username || !password) {
      throw createError({
        statusCode: 400,
        message: 'Username and password are required'
      });
    }

    // Check if user already exists
    const existingPlayer = await PlayerSchema.findOne({ username });
    if (existingPlayer) {
      throw createError({
        statusCode: 400,
        message: 'Username already taken'
      });
    }

    // Get starting room (Cổng Thành Cũ)
    const RoomSchema = (await import('../../../models/Room')).RoomSchema;
    const startingRoom = await RoomSchema.findOne({ name: 'Cổng Thành Cũ' });
    
    if (!startingRoom) {
      throw createError({
        statusCode: 500,
        message: 'Starting room not found. Please initialize the world first.'
      });
    }

    // Create new player (Note: In production, hash the password!)
    const player = await PlayerSchema.create({
      username,
      password, // TODO: Hash this in production!
      currentRoomId: startingRoom._id,
      hp: 100,
      maxHp: 100,
      level: 1,
      experience: 0,
      gold: 50,
      inventory: []
    });

    // Set session
    await setUserSession(event, {
      user: {
        id: player._id.toString(),
        username: player.username
      }
    });

    return {
      success: true,
      message: 'Player created successfully',
      player: {
        id: player._id.toString(),
        username: player.username,
        level: player.level,
        hp: player.hp,
        maxHp: player.maxHp
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
});
