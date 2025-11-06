/**
 * Error logging and monitoring utilities
 */

interface ErrorLog {
  timestamp: Date;
  type: string;
  message: string;
  playerId?: string;
  stack?: string;
  context?: any;
}

class ErrorLogger {
  private errors: ErrorLog[] = [];
  private maxErrors = 1000; // Keep last 1000 errors in memory
  
  /**
   * Log an error with context
   */
  log(
    type: string,
    message: string,
    options?: {
      playerId?: string;
      error?: Error;
      context?: any;
    }
  ): void {
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      type,
      message,
      playerId: options?.playerId,
      stack: options?.error?.stack,
      context: options?.context
    };
    
    // Add to memory
    this.errors.push(errorLog);
    
    // Trim if too many
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    
    // Log to console
    console.error(`[${type}] ${message}`, {
      playerId: options?.playerId,
      context: options?.context,
      stack: options?.error?.stack
    });
  }
  
  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): ErrorLog[] {
    return this.errors.slice(-limit);
  }
  
  /**
   * Get errors for a specific player
   */
  getPlayerErrors(playerId: string, limit: number = 20): ErrorLog[] {
    return this.errors
      .filter(e => e.playerId === playerId)
      .slice(-limit);
  }
  
  /**
   * Get errors by type
   */
  getErrorsByType(type: string, limit: number = 50): ErrorLog[] {
    return this.errors
      .filter(e => e.type === type)
      .slice(-limit);
  }
  
  /**
   * Get error statistics
   */
  getStats(): {
    total: number;
    byType: Record<string, number>;
    recentCount: number; // Last hour
  } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = this.errors.filter(e => e.timestamp > oneHourAgo);
    
    const byType: Record<string, number> = {};
    for (const error of this.errors) {
      byType[error.type] = (byType[error.type] || 0) + 1;
    }
    
    return {
      total: this.errors.length,
      byType,
      recentCount: recentErrors.length
    };
  }
  
  /**
   * Clear old errors (keep last N)
   */
  cleanup(keep: number = 100): void {
    if (this.errors.length > keep) {
      this.errors = this.errors.slice(-keep);
    }
  }
}

export const errorLogger = new ErrorLogger();

/**
 * Wrap async functions with error handling
 */
export function wrapAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorType: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorLogger.log(errorType, error instanceof Error ? error.message : String(error), {
        error: error instanceof Error ? error : undefined,
        context: { args }
      });
      throw error;
    }
  }) as T;
}

/**
 * Safe async execution with error logging
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorType: string,
  defaultValue: T,
  playerId?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    errorLogger.log(errorType, error instanceof Error ? error.message : String(error), {
      error: error instanceof Error ? error : undefined,
      playerId
    });
    return defaultValue;
  }
}

// Clean up old errors every 30 minutes
// Only in non-test environments
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    errorLogger.cleanup(500);
  }, 30 * 60 * 1000);
}
