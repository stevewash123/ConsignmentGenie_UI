/**
 * Smoke Test Helpers
 * 
 * Convenience functions for writing smoke tests with console error tracking.
 * These helpers standardize the smoke test pattern across the codebase.
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Type } from '@angular/core';
import { ConsoleErrorTracker } from './console-error-tracker';

/**
 * Result of a smoke test setup.
 */
export interface SmokeTestContext<T> {
  fixture: ComponentFixture<T>;
  component: T;
  tracker: ConsoleErrorTracker;
  element: HTMLElement;
}

/**
 * Configuration for smoke test setup.
 */
export interface SmokeTestConfig {
  /** Additional providers beyond what's in TestBed */
  providers?: any[];
  /** Whether to auto-detect changes after creation */
  detectChanges?: boolean;
  /** Patterns to ignore for this specific test */
  ignoredPatterns?: RegExp[];
}

/**
 * Create a smoke test context with console error tracking.
 * 
 * @example
 * const ctx = await createSmokeTest(MyComponent);
 * ctx.tracker.expectNoErrors();
 */
export async function createSmokeTest<T>(
  componentClass: Type<T>,
  config: SmokeTestConfig = {}
): Promise<SmokeTestContext<T>> {
  const tracker = new ConsoleErrorTracker();
  
  // Add any test-specific ignore patterns
  if (config.ignoredPatterns) {
    config.ignoredPatterns.forEach(p => tracker.addIgnoredPattern(p));
  }
  
  tracker.start();

  const fixture = TestBed.createComponent(componentClass);
  const component = fixture.componentInstance;
  const element = fixture.nativeElement;

  if (config.detectChanges !== false) {
    fixture.detectChanges();
  }

  return { fixture, component, tracker, element };
}

/**
 * Clean up a smoke test context.
 * Call this in afterEach or at the end of your test.
 */
export function cleanupSmokeTest<T>(ctx: SmokeTestContext<T>): void {
  ctx.tracker.stop();
  ctx.fixture.destroy();
}

/**
 * Assert that a component renders without console errors.
 * This is the most basic smoke test.
 * 
 * @example
 * it('SMOKE: should render without errors', async () => {
 *   await expectCleanRender(MyComponent);
 * });
 */
export async function expectCleanRender<T>(
  componentClass: Type<T>,
  config: SmokeTestConfig = {}
): Promise<void> {
  const ctx = await createSmokeTest(componentClass, config);
  
  try {
    expect(ctx.component).toBeTruthy();
    ctx.tracker.expectNoErrors();
  } finally {
    cleanupSmokeTest(ctx);
  }
}

/**
 * Assert that a component renders with data without console errors.
 * Use this when the component requires @Input() data.
 * 
 * @example
 * it('SMOKE: should render with data', async () => {
 *   await expectRenderWithData(
 *     ItemDetailComponent,
 *     (component) => {
 *       component.item = mockItem;
 *     }
 *   );
 * });
 */
export async function expectRenderWithData<T>(
  componentClass: Type<T>,
  setupData: (component: T) => void,
  config: SmokeTestConfig = {}
): Promise<void> {
  const ctx = await createSmokeTest(componentClass, { ...config, detectChanges: false });
  
  try {
    // Set up data before first change detection
    setupData(ctx.component);
    ctx.fixture.detectChanges();
    
    expect(ctx.component).toBeTruthy();
    ctx.tracker.expectNoErrors();
  } finally {
    cleanupSmokeTest(ctx);
  }
}

/**
 * Assert that an action completes without console errors.
 * Use this to test primary component actions (save, filter, etc).
 * 
 * @example
 * it('SMOKE: should handle save action', async () => {
 *   const ctx = await createSmokeTest(EditComponent);
 *   ctx.component.formData = mockData;
 *   ctx.fixture.detectChanges();
 *   
 *   await expectActionClean(ctx, async () => {
 *     ctx.component.save();
 *     ctx.fixture.detectChanges();
 *   });
 * });
 */
export async function expectActionClean<T>(
  ctx: SmokeTestContext<T>,
  action: () => void | Promise<void>
): Promise<void> {
  await action();
  ctx.fixture.detectChanges();
  ctx.tracker.expectNoErrors();
}

/**
 * Run an action within fakeAsync and assert no console errors.
 * Use this for actions that involve timers or async operations.
 * 
 * @example
 * it('SMOKE: should handle async filter', fakeAsync(() => {
 *   const ctx = createSmokeTestSync(ListComponent);
 *   expectFakeAsyncActionClean(ctx, () => {
 *     ctx.component.filterText = 'search';
 *     ctx.fixture.detectChanges();
 *     tick(300); // debounce
 *     ctx.fixture.detectChanges();
 *   });
 * }));
 */
export function expectFakeAsyncActionClean<T>(
  ctx: SmokeTestContext<T>,
  action: () => void
): void {
  action();
  ctx.fixture.detectChanges();
  ctx.tracker.expectNoErrors();
}

/**
 * Synchronous version of createSmokeTest for use in fakeAsync blocks.
 * TestBed must already be configured.
 */
export function createSmokeTestSync<T>(
  componentClass: Type<T>,
  config: SmokeTestConfig = {}
): SmokeTestContext<T> {
  const tracker = new ConsoleErrorTracker();
  
  if (config.ignoredPatterns) {
    config.ignoredPatterns.forEach(p => tracker.addIgnoredPattern(p));
  }
  
  tracker.start();

  const fixture = TestBed.createComponent(componentClass);
  const component = fixture.componentInstance;
  const element = fixture.nativeElement;

  if (config.detectChanges !== false) {
    fixture.detectChanges();
  }

  return { fixture, component, tracker, element };
}

/**
 * Helper to query elements and assert they exist.
 */
export function expectElement(element: HTMLElement, selector: string): HTMLElement {
  const found = element.querySelector(selector);
  if (!found) {
    fail(`Expected element matching '${selector}' to exist`);
  }
  return found as HTMLElement;
}

/**
 * Helper to query multiple elements and assert count.
 */
export function expectElements(
  element: HTMLElement, 
  selector: string, 
  expectedCount: number
): NodeListOf<HTMLElement> {
  const found = element.querySelectorAll(selector);
  expect(found.length).toBe(
    expectedCount, 
    `Expected ${expectedCount} elements matching '${selector}', found ${found.length}`
  );
  return found as NodeListOf<HTMLElement>;
}

/**
 * Helper to click an element and trigger change detection.
 */
export function clickElement<T>(
  ctx: SmokeTestContext<T>,
  selector: string
): void {
  const element = expectElement(ctx.element, selector);
  element.click();
  ctx.fixture.detectChanges();
}

/**
 * Helper to set input value and trigger change detection.
 */
export function setInputValue<T>(
  ctx: SmokeTestContext<T>,
  selector: string,
  value: string
): void {
  const input = expectElement(ctx.element, selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('change'));
  ctx.fixture.detectChanges();
}

/**
 * Describe block helper for smoke tests.
 * Ensures consistent naming and setup.
 * 
 * @example
 * describeSmokeTests('ItemListComponent', () => {
 *   beforeEach(async () => {
 *     await TestBed.configureTestingModule({...}).compileComponents();
 *   });
 * 
 *   smokeTest('renders with data', async () => {
 *     // ...
 *   });
 * });
 */
export function describeSmokeTests(
  componentName: string,
  tests: () => void
): void {
  describe(componentName, () => {
    describe('SMOKE', tests);
  });
}

/**
 * It block helper that's tagged as a smoke test.
 */
export function smokeTest(
  description: string,
  testFn: () => void | Promise<void>
): void {
  it(`SMOKE: ${description}`, testFn);
}

/**
 * It block helper for fakeAsync smoke tests.
 */
export function smokeTestAsync(
  description: string,
  testFn: () => void
): void {
  it(`SMOKE: ${description}`, fakeAsync(testFn));
}
