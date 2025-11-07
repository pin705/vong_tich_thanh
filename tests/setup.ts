// Test setup file
// This file runs before all tests
import { beforeAll, afterAll, vi } from 'vitest'

// Mock environment variables for testing
beforeAll(() => {
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vong_tich_thanh_test'
  process.env.NUXT_SESSION_PASSWORD = 'test-session-password-min-32-characters-long'
})

// Clean up after all tests
afterAll(() => {
  // Cleanup code here
})

// Global test utilities
export {}
