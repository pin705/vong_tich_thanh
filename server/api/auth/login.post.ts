import { PlayerSchema } from '../../../models/Player';
import bcrypt from 'bcrypt';

export default defineEventHandler(async (event) => {
  try {
    const { username, password } = await readBody(event);

    if (!username || !password) {
      throw createError({
        statusCode: 400,
        message: 'Username and password are required'
      });
    }

    // Find player by username only
    const player = await PlayerSchema.findOne({ username });
    
    if (!player) {
      throw createError({
        statusCode: 401,
        message: 'Invalid username or password'
      });
    }

    // Verify password using bcrypt
    const isPasswordValid = await verifyPassword(player.password, password);
    
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid username or password'
      });
    }

    // Set session
    await setUserSession(event, {
      user: {
        id: player._id.toString(),
        username: player.username
      }
    });

    return {
      success: true,
      message: 'Login successful',
      player: {
        id: player._id.toString(),
        username: player.username,
        level: player.level,
        hp: player.hp,
        maxHp: player.maxHp,
        roomId: player.currentRoomId.toString()
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
});
