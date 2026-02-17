// src/test/setup.ts
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import 'vitest-canvas-mock' // Si vous utilisez canvas dans vos tests

// Run cleanup after each test
afterEach(() => {
  cleanup()
})
