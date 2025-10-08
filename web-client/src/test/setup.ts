import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Types for observer mocks
interface MockIntersectionObserverEntry {
  boundingClientRect: DOMRectReadOnly;
  intersectionRatio: number;
  intersectionRect: DOMRectReadOnly;
  isIntersecting: boolean;
  rootBounds: DOMRectReadOnly | null;
  target: Element;
  time: number;
}

interface MockResizeObserverEntry {
  target: Element;
  contentRect: DOMRectReadOnly;
  borderBoxSize: ReadonlyArray<ResizeObserverSize>;
  contentBoxSize: ReadonlyArray<ResizeObserverSize>;
  devicePixelContentBoxSize: ReadonlyArray<ResizeObserverSize>;
}

(global as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
  class IntersectionObserver {
    constructor(
      callback: (
        entries: MockIntersectionObserverEntry[],
        observer: IntersectionObserver,
      ) => void,
      options?: IntersectionObserverInit,
    ) {
      this.callback = callback;
      this.options = options;
    }
    callback: (
      entries: MockIntersectionObserverEntry[],
      observer: IntersectionObserver,
    ) => void;
    options?: IntersectionObserverInit;
    disconnect(): void {}
    observe(): void {}
    unobserve(): void {}
  };

(global as unknown as { ResizeObserver: unknown }).ResizeObserver =
  class ResizeObserver {
    constructor(
      callback: (
        entries: MockResizeObserverEntry[],
        observer: ResizeObserver,
      ) => void,
    ) {
      this.callback = callback;
    }
    callback: (
      entries: MockResizeObserverEntry[],
      observer: ResizeObserver,
    ) => void;
    disconnect(): void {}
    observe(): void {}
    unobserve(): void {}
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

// Mock Performance interface for testing
interface MockPerformance {
  now: () => number;
  mark: () => void;
  measure: () => void;
  getEntriesByName: () => PerformanceEntryList;
  getEntriesByType: () => PerformanceEntryList;
  clearMarks: () => void;
  clearMeasures: () => void;
}

if (!(global as unknown as { performance?: MockPerformance }).performance) {
  (global as unknown as { performance: MockPerformance }).performance = {
    now: (): number => Date.now(),
    mark: (): void => {},
    measure: (): void => {},
    getEntriesByName: (): PerformanceEntryList => [],
    getEntriesByType: (): PerformanceEntryList => [],
    clearMarks: (): void => {},
    clearMeasures: (): void => {},
  };
}
