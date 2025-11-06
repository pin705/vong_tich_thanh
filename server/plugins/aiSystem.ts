import { processAgentBehaviors, clearAllRespawnTimers } from '../utils/npcAI';
import { processBossMechanics } from '../utils/bossMechanics';
import { onTick } from './globalTick';

export default defineNitroPlugin((nitroApp) => {
  console.log('[NPC AI] Initializing AI system...');
  
  // Subscribe to 10-second tick for AI behaviors
  onTick('tick:10s', () => {
    processAgentBehaviors();
  });
  
  // Subscribe to 2-second tick for boss mechanics
  onTick('tick:2s', () => {
    processBossMechanics();
  });
  
  console.log('[NPC AI] Subscribed to global tick events');
  
  // Cleanup on server shutdown
  nitroApp.hooks.hook('close', () => {
    console.log('[NPC AI] Cleaning up respawn timers...');
    clearAllRespawnTimers();
  });
});
