/**
 * Performance monitoring utilities
 */

interface PerformanceMetric {
  name: string;
  count: number;
  totalTime: number;
  minTime: number;
  maxTime: number;
  avgTime: number;
  lastExecuted: Date;
}

class PerformanceMonitor {
  private metrics: Map<string, Omit<PerformanceMetric, 'avgTime'>> = new Map();
  private activeTimers: Map<string, number> = new Map();
  
  /**
   * Start timing an operation
   */
  start(operationName: string): void {
    const timerId = `${operationName}-${Date.now()}-${Math.random()}`;
    this.activeTimers.set(timerId, Date.now());
  }
  
  /**
   * End timing an operation and record the metric
   */
  end(operationName: string): void {
    // Find the most recent timer for this operation
    let latestTimer: string | null = null;
    let latestTime = 0;
    
    for (const [timerId, startTime] of this.activeTimers.entries()) {
      if (timerId.startsWith(operationName) && startTime > latestTime) {
        latestTimer = timerId;
        latestTime = startTime;
      }
    }
    
    if (!latestTimer) {
      console.warn(`No timer found for operation: ${operationName}`);
      return;
    }
    
    const startTime = this.activeTimers.get(latestTimer)!;
    const duration = Date.now() - startTime;
    
    this.activeTimers.delete(latestTimer);
    this.record(operationName, duration);
  }
  
  /**
   * Record a performance metric
   */
  private record(name: string, duration: number): void {
    const existing = this.metrics.get(name);
    
    if (existing) {
      existing.count++;
      existing.totalTime += duration;
      existing.minTime = Math.min(existing.minTime, duration);
      existing.maxTime = Math.max(existing.maxTime, duration);
      existing.lastExecuted = new Date();
    } else {
      this.metrics.set(name, {
        name,
        count: 1,
        totalTime: duration,
        minTime: duration,
        maxTime: duration,
        lastExecuted: new Date()
      });
    }
  }
  
  /**
   * Time an async function and record its performance
   */
  async timeAsync<T>(
    operationName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.start(operationName);
    try {
      const result = await fn();
      this.end(operationName);
      return result;
    } catch (error) {
      this.end(operationName);
      throw error;
    }
  }
  
  /**
   * Time a synchronous function and record its performance
   */
  time<T>(operationName: string, fn: () => T): T {
    this.start(operationName);
    try {
      const result = fn();
      this.end(operationName);
      return result;
    } catch (error) {
      this.end(operationName);
      throw error;
    }
  }
  
  /**
   * Get metrics for a specific operation
   */
  getMetric(name: string): PerformanceMetric | null {
    const metric = this.metrics.get(name);
    if (!metric) return null;
    
    return {
      ...metric,
      avgTime: metric.totalTime / metric.count
    };
  }
  
  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).map(metric => ({
      ...metric,
      avgTime: metric.totalTime / metric.count
    }));
  }
  
  /**
   * Get top slowest operations
   */
  getSlowestOperations(limit: number = 10): PerformanceMetric[] {
    return this.getAllMetrics()
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit);
  }
  
  /**
   * Get most frequent operations
   */
  getMostFrequentOperations(limit: number = 10): PerformanceMetric[] {
    return this.getAllMetrics()
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
  
  /**
   * Get operations that took longer than threshold
   */
  getSlowOperations(thresholdMs: number): PerformanceMetric[] {
    return this.getAllMetrics()
      .filter(metric => metric.avgTime > thresholdMs);
  }
  
  /**
   * Generate performance report
   */
  generateReport(): string {
    const metrics = this.getAllMetrics();
    
    if (metrics.length === 0) {
      return 'No performance data collected yet.';
    }
    
    let report = '═══════════════════════════════════════════════════\n';
    report += '         PERFORMANCE REPORT                         \n';
    report += '═══════════════════════════════════════════════════\n\n';
    
    report += `Total Operations Tracked: ${metrics.length}\n\n`;
    
    report += 'TOP 10 SLOWEST OPERATIONS (by average):\n';
    const slowest = this.getSlowestOperations(10);
    for (const metric of slowest) {
      report += `  ${metric.name}:\n`;
      report += `    Avg: ${metric.avgTime.toFixed(2)}ms | `;
      report += `Min: ${metric.minTime}ms | Max: ${metric.maxTime}ms | `;
      report += `Count: ${metric.count}\n`;
    }
    
    report += '\nMOST FREQUENT OPERATIONS:\n';
    const frequent = this.getMostFrequentOperations(10);
    for (const metric of frequent) {
      report += `  ${metric.name}: ${metric.count} times (avg: ${metric.avgTime.toFixed(2)}ms)\n`;
    }
    
    report += '\nOPERATIONS EXCEEDING 100ms:\n';
    const slow = this.getSlowOperations(100);
    if (slow.length === 0) {
      report += '  None! System is performing well.\n';
    } else {
      for (const metric of slow) {
        report += `  ${metric.name}: ${metric.avgTime.toFixed(2)}ms average\n`;
      }
    }
    
    return report;
  }
  
  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.activeTimers.clear();
  }
  
  /**
   * Clean up old metrics (keep only last N operations per metric)
   */
  cleanup(): void {
    // For now, just keep all metrics. In a production system,
    // you might want to aggregate old data and clear it.
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator function for monitoring async functions
 */
export function monitored(operationName: string) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      return await performanceMonitor.timeAsync(
        operationName || `${target.constructor.name}.${propertyKey}`,
        () => originalMethod.apply(this, args)
      );
    };
    
    return descriptor;
  };
}

// Export as global if needed for debugging
if (typeof globalThis !== 'undefined') {
  (globalThis as any).__performanceMonitor = performanceMonitor;
}
