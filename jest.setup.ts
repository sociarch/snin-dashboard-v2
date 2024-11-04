import '@testing-library/jest-dom';
import axios from 'axios';

jest.mock('axios');

declare global {
  interface Window {
    botpress?: {
      on: jest.Mock;
      sendEvent: jest.Mock;
      updateUser: jest.Mock;
    };
  }
}

// Mock window.botpress
global.window.botpress = {
  on: jest.fn(),
  sendEvent: jest.fn(),
  updateUser: jest.fn()
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true
  })
) as jest.Mock;

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
}); 