import { resetDungeonProgress } from '../utils/dungeonService';

/**
 * Scheduler Plugin - Handle periodic tasks
 * Runs weekly dungeon reset on Sundays at 00:00
 * 
 * NOTE: This implementation uses setTimeout which will be lost on server restart.
 * For production, consider using:
 * - node-cron for persistent scheduling
 * - A job queue like Bull or Agenda
 * - External cron service
 */
export default defineNitroPlugin((nitroApp) => {
  console.log('[Scheduler] Starting scheduler plugin...');

  // Calculate milliseconds until next Sunday 00:00
  function getNextSundayMidnight(): number {
    const now = new Date();
    const nextSunday = new Date(now);
    
    // Set to next Sunday
    nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
    nextSunday.setHours(0, 0, 0, 0);
    
    return nextSunday.getTime() - now.getTime();
  }

  // Schedule weekly reset
  function scheduleWeeklyReset() {
    const msUntilSunday = getNextSundayMidnight();
    
    console.log(`[Scheduler] Next dungeon reset in ${Math.floor(msUntilSunday / 1000 / 60 / 60)} hours`);
    
    setTimeout(async () => {
      console.log('[Scheduler] Running weekly dungeon reset...');
      try {
        await resetDungeonProgress();
        console.log('[Scheduler] Weekly dungeon reset completed');
      } catch (error) {
        console.error('[Scheduler] Error during weekly reset:', error);
      }
      
      // Schedule next reset
      scheduleWeeklyReset();
    }, msUntilSunday);
  }

  // Start the scheduler
  scheduleWeeklyReset();

  console.log('[Scheduler] Scheduler plugin initialized');
});
