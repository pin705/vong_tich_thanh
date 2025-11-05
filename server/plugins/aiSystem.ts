import { startAISystem, stopAISystem } from '../utils/npcAI';
import { processBossMechanics } from '../utils/bossMechanics';

export default defineNitroPlugin((nitroApp) => {
  console.log('[NPC AI] Initializing AI system...');
  
  // Start AI system when server starts
  startAISystem();
  
  // Start boss mechanics processing (every 2 seconds for more responsive mechanics)
  const bossMechanicsInterval = setInterval(() => {
    processBossMechanics();
  }, 2000);
  
  // Stop AI system on server shutdown (for cleanup)
  nitroApp.hooks.hook('close', () => {
    console.log('[NPC AI] Stopping AI system...');
    stopAISystem();
    clearInterval(bossMechanicsInterval);
  });
});
