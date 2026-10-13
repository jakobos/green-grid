import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

import '@testing-library/jest-dom/vitest'

// jsdom does not implement the Web Storage API; provide a minimal mock.
const makeStorageMock = (): Storage => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
}

Object.defineProperty(window, 'localStorage', {
  value: makeStorageMock(),
  writable: true,
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})
