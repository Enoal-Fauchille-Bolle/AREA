import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

(global as any).IntersectionObserver = class IntersectionObserver {
  constructor(callback: (entries: any[], observer: any) => void, options?: any) {
    this.callback = callback;
    this.options = options;
  }
  callback: (entries: any[], observer: any) => void;
  options?: any;
  disconnect() {}
  observe() {}
  unobserve() {}
};

(global as any).ResizeObserver = class ResizeObserver {
  constructor(callback: (entries: any[], observer: any) => void) {
    this.callback = callback;
  }
  callback: (entries: any[], observer: any) => void;
  disconnect() {}
  observe() {}
  unobserve() {}
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
});

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  writable: true,
  value: () => {},
});

Object.defineProperty(document, 'fonts', {
  writable: true,
  value: {
    ready: Promise.resolve(new Set()),
    check: () => true,
    load: () => Promise.resolve(new Set()),
    addEventListener: () => {},
    removeEventListener: () => {},
  },
});

if (!(global as any).performance) {
  (global as any).performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByName: () => [],
    getEntriesByType: () => [],
    clearMarks: () => {},
    clearMeasures: () => {},
  };
}
