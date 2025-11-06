import { PlayerSchema } from '../../../models/Player';
import { MIN_PASSWORD_LENGTH, STARTING_HP, STARTING_GOLD, STARTING_LEVEL } from '../../utils/constants';
import { validateUsername, validatePassword } from '../../utils/validation';

export default defineEventHandler(async (event) => {
  try {
    const { username, password } = await readBody(event);

    if (!username || !password) {
      throw createError({
        statusCode: 400,
        message: 'Tên người chơi và mật khẩu là bắt buộc.'
      });
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      throw createError({
        statusCode: 400,
        message: usernameValidation.error
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw createError({
        statusCode: 400,
        message: passwordValidation.error
      });
    }

    // Check if user already exists
    const existingPlayer = await PlayerSchema.findOne({ username: username.trim() });
    if (existingPlayer) {
      throw createError({
        statusCode: 400,
        message: 'Tên người chơi đã được sử dụng.'
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
    const hashedPassword = await hashPassword(password);

    // Create new player
    const player = await PlayerSchema.create({
      username: username.trim(),
      password: hashedPassword,
      currentRoomId: startingRoom._id,
      hp: STARTING_HP,
      maxHp: STARTING_HP,
      level: STARTING_LEVEL,
      experience: 0,
      gold: STARTING_GOLD,
      inventory: [],
      visitedRooms: [startingRoom._id] // Mark starting room as visited
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
