/**
 * ConsoleErrorTracker
 * 
 * Intercepts console.error and console.warn during tests to capture
 * errors that would otherwise go unnoticed. Allows tests to fail
 * when unexpected console errors occur.
 * 
 * Usage:
 *   const tracker = new ConsoleErrorTracker();
 *   tracker.start();
 *   // ... run test code ...
 *   tracker.expectNoErrors();
 *   tracker.stop();
 */
export class ConsoleErrorTracker {
  private originalConsoleError!: typeof console.error;
  private originalConsoleWarn!: typeof console.warn;
  private errors: string[] = [];
  private warnings: string[] = [];
  private isTracking = false;

  /**
   * Patterns to ignore - these are test-environment-specific errors
   * that don't indicate real bugs.
   * 
   * START WITH AN EMPTY LIST. Only add patterns after confirming
   * they are test-framework artifacts, not production bugs.
   */
  private ignoredPatterns: RegExp[] = [
    // Add patterns here only after careful review
    // Example (commented out - add only if needed):
    // /NullInjectorError.*ActivatedRoute/,  // Isolated component tests without routing
    // /NullInjectorError.*Router/,          // Isolated component tests without routing
  ];

  /**
   * Patterns that indicate actual test setup issues vs application bugs.
   * These are logged but don't fail tests - they indicate the test needs improvement.
   */
  private testSetupPatterns: RegExp[] = [
    /No provider for/,
    /NullInjectorError/,
    /Can't bind to .* since it isn't a known property/,
  ];

  /**
   * Start capturing console errors and warnings.
   * Call this in beforeEach().
   */
  start(): void {
    if (this.isTracking) {
      console.warn('ConsoleErrorTracker.start() called while already tracking');
      return;
    }

    this.errors = [];
    this.warnings = [];
    this.isTracking = true;

    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;

    console.error = (...args: unknown[]) => {
      const message = this.formatMessage(args);
      
      if (!this.isIgnored(message)) {
        this.errors.push(message);
      }
      
      // Still output to console for visibility
      this.originalConsoleError.apply(console, args);
    };

    console.warn = (...args: unknown[]) => {
      const message = this.formatMessage(args);
      this.warnings.push(message);
      this.originalConsoleWarn.apply(console, args);
    };
  }

  /**
   * Stop capturing and restore original console methods.
   * Call this in afterEach().
   */
  stop(): void {
    if (!this.isTracking) {
      return;
    }

    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
    this.isTracking = false;
  }

  /**
   * Format arguments into a single string message.
   */
  private formatMessage(args: unknown[]): string {
    return args
      .map(arg => {
        if (arg instanceof Error) {
          return `${arg.name}: ${arg.message}`;
        }
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');
  }

  /**
   * Check if a message matches any ignored pattern.
   */
  private isIgnored(message: string): boolean {
    return this.ignoredPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if a message indicates a test setup issue rather than app bug.
   */
  private isTestSetupIssue(message: string): boolean {
    return this.testSetupPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Get all captured errors.
   */
  getErrors(): string[] {
    return [...this.errors];
  }

  /**
   * Get all captured warnings.
   */
  getWarnings(): string[] {
    return [...this.warnings];
  }

  /**
   * Check if any errors were captured.
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Check if any warnings were captured.
   */
  hasWarnings(): boolean {
    return this.warnings.length > 0;
  }

  /**
   * Get errors categorized by type.
   */
  getCategorizedErrors(): { appErrors: string[]; setupErrors: string[] } {
    const appErrors: string[] = [];
    const setupErrors: string[] = [];

    for (const error of this.errors) {
      if (this.isTestSetupIssue(error)) {
        setupErrors.push(error);
      } else {
        appErrors.push(error);
      }
    }

    return { appErrors, setupErrors };
  }

  /**
   * Fail the test if any errors were captured.
   * Call this at the end of your test.
   */
  expectNoErrors(): void {
    if (this.errors.length === 0) {
      return;
    }

    const { appErrors, setupErrors } = this.getCategorizedErrors();
    
    let message = 'Console errors detected during test:\n\n';
    
    if (appErrors.length > 0) {
      message += '=== APPLICATION ERRORS (bugs) ===\n';
      message += appErrors.map(e => `  ✗ ${e}`).join('\n');
      message += '\n\n';
    }
    
    if (setupErrors.length > 0) {
      message += '=== TEST SETUP ERRORS (improve test config) ===\n';
      message += setupErrors.map(e => `  ⚠ ${e}`).join('\n');
      message += '\n\n';
    }

    fail(message);
  }

  /**
   * Fail only on application errors, warn on setup errors.
   * Use this for a less strict mode during migration.
   */
  expectNoAppErrors(): void {
    const { appErrors, setupErrors } = this.getCategorizedErrors();
    
    if (setupErrors.length > 0) {
      console.warn(
        'Test setup errors detected (not failing test):\n' +
        setupErrors.map(e => `  ⚠ ${e}`).join('\n')
      );
    }
    
    if (appErrors.length > 0) {
      fail(
        'Application errors detected:\n' +
        appErrors.map(e => `  ✗ ${e}`).join('\n')
      );
    }
  }

  /**
   * Add a pattern to the ignore list for this tracker instance.
   * Use sparingly and document why.
   */
  addIgnoredPattern(pattern: RegExp): void {
    this.ignoredPatterns.push(pattern);
  }

  /**
   * Clear the ignore list (useful for testing the tracker itself).
   */
  clearIgnoredPatterns(): void {
    this.ignoredPatterns = [];
  }

  /**
   * Get the current ignore patterns.
   */
  getIgnoredPatterns(): RegExp[] {
    return [...this.ignoredPatterns];
  }

  /**
   * Create a summary report of captured errors.
   */
  getSummary(): string {
    const { appErrors, setupErrors } = this.getCategorizedErrors();
    
    return [
      `Errors: ${this.errors.length} total`,
      `  - Application errors: ${appErrors.length}`,
      `  - Test setup errors: ${setupErrors.length}`,
      `Warnings: ${this.warnings.length}`,
    ].join('\n');
  }
}

/**
 * Singleton instance for global tracking.
 * Use ConsoleErrorTracker directly for per-test isolation.
 */
export const globalConsoleTracker = new ConsoleErrorTracker();
