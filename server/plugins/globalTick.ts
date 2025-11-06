import { EventEmitter } from 'events';

/**
 * Global Tick System - Unified tick loop for all game systems
 * Provides synchronized tick events to reduce multiple setInterval calls
 */

// Create a global event emitter for tick events
export const tickEmitter = new EventEmitter();

// Tick intervals
const TICK_100MS = 100;
const TICK_1S = 1000;
const TICK_2S = 2000;
const TICK_10S = 10000;

let tick100msInterval: NodeJS.Timeout | null = null;
let tick1sInterval: NodeJS.Timeout | null = null;
let tick2sInterval: NodeJS.Timeout | null = null;
let tick10sInterval: NodeJS.Timeout | null = null;

// Tick counters for debugging
let tick100msCount = 0;
let tick1sCount = 0;
let tick2sCount = 0;
let tick10sCount = 0;

/**
 * Start the global tick system
 */
export function startGlobalTick(): void {
  if (tick100msInterval || tick1sInterval || tick2sInterval || tick10sInterval) {
    console.log('[Global Tick] System already running');
    return;
  }

  console.log('[Global Tick] Starting unified tick system...');

  // 100ms tick (for fast-paced combat updates)
  tick100msInterval = setInterval(() => {
    tick100msCount++;
    tickEmitter.emit('tick:100ms', { count: tick100msCount, timestamp: Date.now() });
  }, TICK_100MS);

  // 1 second tick (for general updates)
  tick1sInterval = setInterval(() => {
    tick1sCount++;
    tickEmitter.emit('tick:1s', { count: tick1sCount, timestamp: Date.now() });
  }, TICK_1S);

  // 2 second tick (for boss mechanics, etc.)
  tick2sInterval = setInterval(() => {
    tick2sCount++;
    tickEmitter.emit('tick:2s', { count: tick2sCount, timestamp: Date.now() });
  }, TICK_2S);

  // 10 second tick (for AI behaviors, long-term effects)
  tick10sInterval = setInterval(() => {
    tick10sCount++;
    tickEmitter.emit('tick:10s', { count: tick10sCount, timestamp: Date.now() });
  }, TICK_10S);

  console.log('[Global Tick] System started successfully');
  console.log('[Global Tick] Available events: tick:100ms, tick:1s, tick:2s, tick:10s');
}

/**
 * Stop the global tick system
 */
export function stopGlobalTick(): void {
  console.log('[Global Tick] Stopping unified tick system...');

  if (tick100msInterval) {
    clearInterval(tick100msInterval);
    tick100msInterval = null;
  }

  if (tick1sInterval) {
    clearInterval(tick1sInterval);
    tick1sInterval = null;
  }

  if (tick2sInterval) {
    clearInterval(tick2sInterval);
    tick2sInterval = null;
  }

  if (tick10sInterval) {
    clearInterval(tick10sInterval);
    tick10sInterval = null;
  }

  // Remove all listeners
  tickEmitter.removeAllListeners();

  console.log('[Global Tick] System stopped');
}

/**
 * Get tick statistics (for debugging)
 */
export function getTickStats(): {
  tick100ms: number;
  tick1s: number;
  tick2s: number;
  tick10s: number;
  listeners: {
    tick100ms: number;
    tick1s: number;
    tick2s: number;
    tick10s: number;
  };
} {
  return {
    tick100ms: tick100msCount,
    tick1s: tick1sCount,
    tick2s: tick2sCount,
    tick10s: tick10sCount,
    listeners: {
      tick100ms: tickEmitter.listenerCount('tick:100ms'),
      tick1s: tickEmitter.listenerCount('tick:1s'),
      tick2s: tickEmitter.listenerCount('tick:2s'),
      tick10s: tickEmitter.listenerCount('tick:10s')
    }
  };
}

/**
 * Register a tick listener
 * @param event - The tick event to listen to
 * @param callback - The callback function
 */
export function onTick(
  event: 'tick:100ms' | 'tick:1s' | 'tick:2s' | 'tick:10s',
  callback: (data: { count: number; timestamp: number }) => void
): void {
  tickEmitter.on(event, callback);
}

/**
 * Unregister a tick listener
 * @param event - The tick event
 * @param callback - The callback function
 */
export function offTick(
  event: 'tick:100ms' | 'tick:1s' | 'tick:2s' | 'tick:10s',
  callback: (data: { count: number; timestamp: number }) => void
): void {
  tickEmitter.off(event, callback);
}

// Nitro plugin to start/stop the global tick system
export default defineNitroPlugin((nitroApp) => {
  console.log('[Global Tick Plugin] Initializing...');
  
  // Start the global tick system
  startGlobalTick();
  
  // Stop the system on server shutdown
  nitroApp.hooks.hook('close', () => {
    stopGlobalTick();
  });
});
