import { initializeWorld } from '../utils/initWorld';

export default defineEventHandler(async (event) => {
  try {
    const result = await initializeWorld();
    return {
      success: true,
      message: 'World initialized successfully',
      data: result
    };
  } catch (error) {
    console.error('Error initializing world:', error);
    return {
      success: false,
      message: 'Failed to initialize world',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});
