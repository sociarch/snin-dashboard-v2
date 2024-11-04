import '@testing-library/jest-dom';

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