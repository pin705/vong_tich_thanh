import { describe, it, expect } from 'vitest'
import { parseCommand } from '../server/utils/commandParser'

describe('Command Parser', () => {
  describe('Movement Commands', () => {
    it('should parse "go bắc" correctly', () => {
      const result = parseCommand('go bắc')
      expect(result.command).toBe('go')
      expect(result.args).toEqual(['bắc'])
    })

    it('should parse shorthand "n" as go north', () => {
      const result = parseCommand('n')
      expect(result.command).toBe('go')
      expect(result.args).toContain('bắc')
    })

    it('should parse shorthand "s" as go south', () => {
      const result = parseCommand('s')
      expect(result.command).toBe('go')
      expect(result.args).toContain('nam')
    })

    it('should parse shorthand "e" as go east', () => {
      const result = parseCommand('e')
      expect(result.command).toBe('go')
      expect(result.args).toContain('đông')
    })

    it('should parse shorthand "w" as go west', () => {
      const result = parseCommand('w')
      expect(result.command).toBe('go')
      expect(result.args).toContain('tây')
    })
  })

  describe('Observation Commands', () => {
    it('should parse "look" command', () => {
      const result = parseCommand('look')
      expect(result.command).toBe('look')
      expect(result.args).toEqual([])
    })

    it('should parse "l" as look', () => {
      const result = parseCommand('l')
      expect(result.command).toBe('look')
    })

    it('should parse "look at item" correctly', () => {
      const result = parseCommand('look at sword')
      expect(result.command).toBe('look')
      expect(result.args.length).toBeGreaterThan(0)
    })

    it('should parse "inventory" command', () => {
      const result = parseCommand('inventory')
      expect(result.command).toBe('inventory')
    })

    it('should parse "i" as inventory', () => {
      const result = parseCommand('i')
      expect(result.command).toBe('inventory')
    })
  })

  describe('Combat Commands', () => {
    it('should parse "attack mob" correctly', () => {
      const result = parseCommand('attack mob')
      expect(result.command).toBe('attack')
      expect(result.args).toContain('mob')
    })

    it('should parse "a mob" as attack', () => {
      const result = parseCommand('a mob')
      expect(result.command).toBe('attack')
      expect(result.args).toContain('mob')
    })

    it('should parse "kill mob" as attack', () => {
      const result = parseCommand('kill mob')
      expect(result.command).toBe('attack')
      expect(result.args).toContain('mob')
    })

    it('should parse "flee" command', () => {
      const result = parseCommand('flee')
      expect(result.command).toBe('flee')
    })

    it('should parse "run" as flee', () => {
      const result = parseCommand('run')
      expect(result.command).toBe('flee')
    })
  })

  describe('Item Commands', () => {
    it('should parse "get item" correctly', () => {
      const result = parseCommand('get sword')
      expect(result.command).toBe('get')
      expect(result.args).toContain('sword')
    })

    it('should parse "g item" as get', () => {
      const result = parseCommand('g sword')
      expect(result.command).toBe('get')
      expect(result.args).toContain('sword')
    })

    it('should parse "drop item" correctly', () => {
      const result = parseCommand('drop sword')
      expect(result.command).toBe('drop')
      expect(result.args).toContain('sword')
    })

    it('should parse "use item" correctly', () => {
      const result = parseCommand('use potion')
      expect(result.command).toBe('use')
      expect(result.args).toContain('potion')
    })
  })

  describe('Social Commands', () => {
    it('should parse "say message" correctly', () => {
      const result = parseCommand('say hello world')
      expect(result.command).toBe('say')
      expect(result.args.join(' ')).toContain('hello world')
    })

    it('should parse "talk npc" correctly', () => {
      const result = parseCommand('talk guard')
      expect(result.command).toBe('talk')
      expect(result.args).toContain('guard')
    })

    it('should parse "t npc" as talk', () => {
      const result = parseCommand('t guard')
      expect(result.command).toBe('talk')
      expect(result.args).toContain('guard')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty command', () => {
      const result = parseCommand('')
      expect(result.command).toBe('')
    })

    it('should handle whitespace-only command', () => {
      const result = parseCommand('   ')
      expect(result.command).toBe('')
    })

    it('should trim extra whitespace', () => {
      const result = parseCommand('  look   at   sword  ')
      expect(result.command).toBe('look')
      expect(result.args.filter(arg => arg !== '')).not.toHaveLength(0)
    })

    it('should handle case insensitivity', () => {
      const result = parseCommand('LOOK')
      expect(result.command.toLowerCase()).toBe('look')
    })
  })

  describe('Multiple Arguments', () => {
    it('should parse command with multiple arguments', () => {
      const result = parseCommand('buy 5 health potion')
      expect(result.command).toBe('buy')
      expect(result.args.length).toBeGreaterThan(0)
    })

    it('should preserve argument order', () => {
      const result = parseCommand('craft iron sword')
      expect(result.command).toBe('craft')
      expect(result.args[0]).toBe('iron')
      expect(result.args[1]).toBe('sword')
    })
  })
})
