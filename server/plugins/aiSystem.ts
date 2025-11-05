import { startAISystem, stopAISystem } from '../utils/npcAI';

export default defineNitroPlugin((nitroApp) => {
  console.log('[NPC AI] Initializing AI system...');
  
  // Start AI system when server starts
  startAISystem();
  
  // Stop AI system on server shutdown (for cleanup)
  nitroApp.hooks.hook('close', () => {
    console.log('[NPC AI] Stopping AI system...');
    stopAISystem();
  });
});
