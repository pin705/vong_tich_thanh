import { describe, it, expect } from 'vitest'
import {
  validateUsername,
  validatePassword,
  validateNumber,
  validateItemName,
  validateChatMessage,
  validateObjectId,
  sanitizeInput,
} from '../server/utils/validation'

describe('Validation Utilities', () => {
  describe('validateUsername', () => {
    it('should accept valid usernames', () => {
      const result = validateUsername('validuser')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept usernames with numbers', () => {
      const result = validateUsername('user123')
      expect(result.valid).toBe(true)
    })

    it('should accept usernames with underscores', () => {
      const result = validateUsername('user_name')
      expect(result.valid).toBe(true)
    })

    it('should reject usernames that are too short', () => {
      const result = validateUsername('ab')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('ít nhất 3')
    })

    it('should reject usernames that are too long', () => {
      const result = validateUsername('a'.repeat(21))
      expect(result.valid).toBe(false)
      expect(result.error).toContain('không được quá 20')
    })

    it('should reject usernames with special characters', () => {
      const result = validateUsername('user@name')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('chữ cái, số và dấu gạch dưới')
    })

    it('should reject empty usernames', () => {
      const result = validateUsername('')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('bắt buộc')
    })

    it('should reject null usernames', () => {
      const result = validateUsername(null as any)
      expect(result.valid).toBe(false)
    })

    it('should trim whitespace', () => {
      const result = validateUsername('  validuser  ')
      expect(result.valid).toBe(true)
    })
  })

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      const result = validatePassword('password123')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept minimum length passwords', () => {
      const result = validatePassword('123456')
      expect(result.valid).toBe(true)
    })

    it('should reject passwords that are too short', () => {
      const result = validatePassword('12345')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('ít nhất 6')
    })

    it('should reject passwords that are too long', () => {
      const result = validatePassword('a'.repeat(101))
      expect(result.valid).toBe(false)
      expect(result.error).toContain('quá dài')
    })

    it('should reject empty passwords', () => {
      const result = validatePassword('')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('bắt buộc')
    })

    it('should reject null passwords', () => {
      const result = validatePassword(null as any)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateNumber', () => {
    it('should accept valid numbers', () => {
      const result = validateNumber(42)
      expect(result.valid).toBe(true)
    })

    it('should accept zero', () => {
      const result = validateNumber(0)
      expect(result.valid).toBe(true)
    })

    it('should accept negative numbers', () => {
      const result = validateNumber(-10)
      expect(result.valid).toBe(true)
    })

    it('should reject non-numbers', () => {
      const result = validateNumber('not a number' as any)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('số hợp lệ')
    })

    it('should reject NaN', () => {
      const result = validateNumber(NaN)
      expect(result.valid).toBe(false)
    })

    it('should reject numbers below minimum', () => {
      const result = validateNumber(5, { min: 10 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('không được nhỏ hơn')
    })

    it('should reject numbers above maximum', () => {
      const result = validateNumber(15, { max: 10 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('không được lớn hơn')
    })

    it('should reject non-integers when integer required', () => {
      const result = validateNumber(3.14, { integer: true })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('số nguyên')
    })

    it('should accept numbers within range', () => {
      const result = validateNumber(5, { min: 0, max: 10 })
      expect(result.valid).toBe(true)
    })
  })

  describe('validateItemName', () => {
    it('should accept valid item names', () => {
      const result = validateItemName('Kiếm Gỉ')
      expect(result.valid).toBe(true)
    })

    it('should accept item names with special characters', () => {
      const result = validateItemName('Bình Máu +5')
      expect(result.valid).toBe(true)
    })

    it('should reject empty item names', () => {
      const result = validateItemName('')
      expect(result.valid).toBe(false)
    })

    it('should reject item names that are too long', () => {
      const result = validateItemName('a'.repeat(51))
      expect(result.valid).toBe(false)
      expect(result.error).toContain('không được quá 50')
    })
  })

  describe('validateChatMessage', () => {
    it('should accept valid chat messages', () => {
      const result = validateChatMessage('Hello everyone!')
      expect(result.valid).toBe(true)
    })

    it('should accept Vietnamese text', () => {
      const result = validateChatMessage('Xin chào các bạn')
      expect(result.valid).toBe(true)
    })

    it('should reject empty messages', () => {
      const result = validateChatMessage('')
      expect(result.valid).toBe(false)
    })

    it('should reject messages that are too long', () => {
      const result = validateChatMessage('a'.repeat(501))
      expect(result.valid).toBe(false)
      expect(result.error).toContain('không được quá 500')
    })

    it('should trim whitespace', () => {
      const result = validateChatMessage('  hello  ')
      expect(result.valid).toBe(true)
    })
  })

  describe('validateObjectId', () => {
    it('should accept valid MongoDB ObjectIds', () => {
      const result = validateObjectId('507f1f77bcf86cd799439011')
      expect(result.valid).toBe(true)
    })

    it('should accept 24-character hex strings', () => {
      const result = validateObjectId('123456789012345678901234')
      expect(result.valid).toBe(true)
    })

    it('should reject invalid ObjectIds', () => {
      const result = validateObjectId('invalid')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('không hợp lệ')
    })

    it('should reject ObjectIds with wrong length', () => {
      const result = validateObjectId('507f1f77bcf86cd79943901')
      expect(result.valid).toBe(false)
    })

    it('should reject ObjectIds with non-hex characters', () => {
      const result = validateObjectId('507f1f77bcf86cd79943901g')
      expect(result.valid).toBe(false)
    })

    it('should reject empty ObjectIds', () => {
      const result = validateObjectId('')
      expect(result.valid).toBe(false)
    })
  })

  describe('sanitizeInput', () => {
    it('should return plain text unchanged', () => {
      const result = sanitizeInput('Hello World')
      expect(result).toBe('Hello World')
    })

    it('should remove HTML tags', () => {
      const result = sanitizeInput('<script>alert("xss")</script>')
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('</script>')
    })

    it('should remove dangerous HTML', () => {
      const result = sanitizeInput('<img src="x" onerror="alert(1)">')
      expect(result).not.toContain('<img')
      expect(result).not.toContain('onerror')
    })

    it('should handle Vietnamese characters', () => {
      const result = sanitizeInput('Xin chào các bạn')
      expect(result).toBe('Xin chào các bạn')
    })

    it('should limit length', () => {
      const longText = 'a'.repeat(2000)
      const result = sanitizeInput(longText, { maxLength: 100 })
      expect(result.length).toBeLessThanOrEqual(100)
    })

    it('should trim whitespace', () => {
      const result = sanitizeInput('  hello  ')
      expect(result).toBe('hello')
    })

    it('should handle empty input', () => {
      const result = sanitizeInput('')
      expect(result).toBe('')
    })

    it('should preserve safe special characters', () => {
      const result = sanitizeInput('Level +5 [Rare]')
      expect(result).toContain('+5')
      expect(result).toContain('[Rare]')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined inputs gracefully', () => {
      expect(validateUsername(undefined as any).valid).toBe(false)
      expect(validatePassword(undefined as any).valid).toBe(false)
      expect(validateItemName(undefined as any).valid).toBe(false)
      expect(validateChatMessage(undefined as any).valid).toBe(false)
    })

    it('should handle null inputs gracefully', () => {
      expect(validateUsername(null as any).valid).toBe(false)
      expect(validatePassword(null as any).valid).toBe(false)
      expect(validateItemName(null as any).valid).toBe(false)
      expect(validateChatMessage(null as any).valid).toBe(false)
    })

    it('should handle object inputs gracefully', () => {
      expect(validateUsername({} as any).valid).toBe(false)
      expect(validatePassword({} as any).valid).toBe(false)
    })

    it('should handle array inputs gracefully', () => {
      expect(validateUsername([] as any).valid).toBe(false)
      expect(validatePassword([] as any).valid).toBe(false)
    })
  })
})
