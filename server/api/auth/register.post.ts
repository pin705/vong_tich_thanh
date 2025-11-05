import { PlayerSchema } from '../../../models/Player';
import bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS, MIN_PASSWORD_LENGTH, STARTING_HP, STARTING_GOLD, STARTING_LEVEL } from '../../utils/constants';

export default defineEventHandler(async (event) => {
  try {
    const { username, password } = await readBody(event);

    if (!username || !password) {
      throw createError({
        statusCode: 400,
        message: 'Username and password are required'
      });
    }

    // Validate password length
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw createError({
        statusCode: 400,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
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

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Create new player
    const player = await PlayerSchema.create({
      username,
      password: hashedPassword,
      currentRoomId: startingRoom._id,
      hp: STARTING_HP,
      maxHp: STARTING_HP,
      level: STARTING_LEVEL,
      experience: 0,
      gold: STARTING_GOLD,
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
