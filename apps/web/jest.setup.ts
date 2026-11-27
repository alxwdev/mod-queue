import '@testing-library/jest-dom';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { server } from '@/test/msw/server';

expect.extend(toHaveNoViolations);

// Component tests render a component on its own, outside the app's landmarks. The `region` rule
// skips a check of the render container, but it fails a check of the whole document (for example,
// to include a Radix portal). The Playwright axe checks cover the landmarks of the real pages.
// axe-core keeps this configuration globally, so the `axe` export of jest-axe uses it too.
configureAxe({ globalOptions: { rules: [{ id: 'region', enabled: false }] } });

// A request without a handler fails the test instead of reaching the network.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// jsdom does not implement the browser APIs below.
Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

window.scrollTo = () => {};
Element.prototype.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};
Element.prototype.hasPointerCapture = () => false;

// jsdom has no layout, so every size is 0 and TanStack Virtual would render no rows: it reads the
// size of its scroll container from clientWidth and clientHeight. Give every element the size of an
// 800 × 600 scroll container.
Object.defineProperties(Element.prototype, {
  clientHeight: { configurable: true, get: () => 600 },
  clientWidth: { configurable: true, get: () => 800 },
});
Object.defineProperties(HTMLElement.prototype, {
  offsetHeight: { configurable: true, get: () => 600 },
  offsetWidth: { configurable: true, get: () => 800 },
});
Element.prototype.getBoundingClientRect = () => new DOMRect(0, 0, 800, 600);
