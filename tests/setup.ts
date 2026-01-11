import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi, beforeEach } from 'vitest'

// Set environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

beforeEach(() => {
  // Reset environment variables
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
})

// Mock Supabase client for tests
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      upsert: vi.fn(),
      rpc: vi.fn(),
    })),
  })),
}))

// Mock browser-image-compression
vi.mock('browser-image-compression', () => ({
  default: vi.fn((file) => Promise.resolve(file)),
}))

// Mock window.FileReader
global.FileReader = class FileReader {
  readAsDataURL() {
    if (this.onloadend) {
      this.onloadend({ target: { result: 'data:image/png;base64,mock' } } as any)
    }
  }
  addEventListener(event: string, handler: Function) {
    if (event === 'loadend') {
      this.onloadend = handler as any
    }
  }
  onloadend: ((event: any) => void) | null = null
} as any

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()
