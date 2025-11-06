/**
 * Validation utilities for game commands and inputs
 */

/**
 * Validate player name
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Tên người chơi là bắt buộc.' };
  }

  const trimmed = username.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, error: 'Tên người chơi phải có ít nhất 3 ký tự.' };
  }
  
  if (trimmed.length > 20) {
    return { valid: false, error: 'Tên người chơi không được quá 20 ký tự.' };
  }
  
  // Only allow alphanumeric and underscores
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Tên người chơi chỉ được chứa chữ cái, số và dấu gạch dưới.' };
  }
  
  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Mật khẩu là bắt buộc.' };
  }
  
  if (password.length < 6) {
    return { valid: false, error: 'Mật khẩu phải có ít nhất 6 ký tự.' };
  }
  
  if (password.length > 100) {
    return { valid: false, error: 'Mật khẩu quá dài.' };
  }
  
  return { valid: true };
}

/**
 * Validate numeric input (gold, quantity, etc.)
 */
export function validateNumber(
  value: any,
  fieldName: string,
  options: { min?: number; max?: number; integer?: boolean } = {}
): { valid: boolean; value?: number; error?: string } {
  const num = Number(value);
  
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} phải là một số.` };
  }
  
  if (options.integer && !Number.isInteger(num)) {
    return { valid: false, error: `${fieldName} phải là số nguyên.` };
  }
  
  if (options.min !== undefined && num < options.min) {
    return { valid: false, error: `${fieldName} phải lớn hơn hoặc bằng ${options.min}.` };
  }
  
  if (options.max !== undefined && num > options.max) {
    return { valid: false, error: `${fieldName} không được vượt quá ${options.max}.` };
  }
  
  return { valid: true, value: num };
}

/**
 * Validate item name input
 */
export function validateItemName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Tên vật phẩm là bắt buộc.' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Tên vật phẩm không được để trống.' };
  }
  
  if (trimmed.length > 50) {
    return { valid: false, error: 'Tên vật phẩm quá dài.' };
  }
  
  return { valid: true };
}

/**
 * Validate chat message
 */
export function validateChatMessage(message: string): { valid: boolean; error?: string } {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Tin nhắn không được để trống.' };
  }
  
  const trimmed = message.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Tin nhắn không được để trống.' };
  }
  
  if (trimmed.length > 500) {
    return { valid: false, error: 'Tin nhắn quá dài (tối đa 500 ký tự).' };
  }
  
  return { valid: true };
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .slice(0, 500); // Limit length
}

/**
 * Validate MongoDB ObjectId format
 */
export function validateObjectId(id: string): { valid: boolean; error?: string } {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'ID không hợp lệ.' };
  }
  
  // MongoDB ObjectId is a 24-character hex string
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return { valid: false, error: 'ID không đúng định dạng.' };
  }
  
  return { valid: true };
}

/**
 * Rate limiting helper - tracks action counts per player
 */
class RateLimiter {
  private actionCounts: Map<string, { count: number; resetTime: number }> = new Map();
  
  /**
   * Check if action is allowed for player
   * @param playerId Player ID
   * @param maxActions Maximum actions per window
   * @param windowMs Time window in milliseconds
   * @returns true if action is allowed, false otherwise
   */
  checkLimit(playerId: string, maxActions: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.actionCounts.get(playerId);
    
    if (!record || now > record.resetTime) {
      // New window
      this.actionCounts.set(playerId, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    
    if (record.count >= maxActions) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  /**
   * Reset limit for a player (e.g., on logout)
   */
  reset(playerId: string): void {
    this.actionCounts.delete(playerId);
  }
  
  /**
   * Clean up old records (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [playerId, record] of this.actionCounts.entries()) {
      if (now > record.resetTime) {
        this.actionCounts.delete(playerId);
      }
    }
  }
}

export const commandRateLimiter = new RateLimiter();
export const chatRateLimiter = new RateLimiter();

// Clean up rate limiters every 5 minutes
// Only in non-test environments
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    commandRateLimiter.cleanup();
    chatRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}
