export default (async () => {
  // Import the initializeWorld function
  const { initializeWorld } = await import('../utils/initWorld');

  try {
    // Initialize the game world when the plugin is loaded
    await initializeWorld();
    console.log('Game world initialized successfully.');
  } catch (error) {
    console.error('Error initializing game world:', error);
  }
});