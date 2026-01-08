# Smoke Test Strategy: Console Error Tracking

## Overview

This document describes a smoke testing approach for Angular applications that goes beyond simple "component exists" tests. The strategy captures and fails on console errors that typically go unnoticed - errors that don't prevent tests from passing but indicate real bugs in production.

## The Problem

Angular's test framework allows components to "pass" tests while emitting console errors:

```
✓ should create (15ms)
✓ should display items (23ms)

ERROR: Cannot read property 'name' of undefined
ERROR: NG0100: ExpressionChangedAfterItHasBeenCheckedError
```

These errors indicate:
- Template binding failures
- Null reference exceptions
- Missing providers or pipes
- Timing issues with async data
- Incorrect mock configurations

**A component can render an empty div and pass `expect(component).toBeTruthy()`.**

## The Solution

Intercept `console.error` during tests and fail when unexpected errors occur.

### What We Catch

| Error Type | Example | Traditional Test Result |
|------------|---------|------------------------|
| Null reference in template | `Cannot read property 'name' of undefined` | ✓ PASS |
| Missing pipe | `The pipe 'currency' could not be found` | ✓ PASS |
| Property binding error | `Can't bind to 'ngModel' since it isn't a known property` | ✓ PASS |
| Change detection | `NG0100: Expression has changed after it was checked` | ✓ PASS |
| HTTP mock failures | `404 Not Found` | ✓ PASS |
| Missing translations | `Missing translation for key: ITEM.TITLE` | ✓ PASS |

### What We Ignore (Test Environment Noise)

Some errors are legitimate test framework artifacts:

```typescript
const ignoredPatterns = [
  /No provider for ActivatedRoute/,           // Isolated component tests
  /No provider for Router/,                   // When not testing routing
  /NullInjectorError.*HttpClient/,            // When HTTP isn't mocked
  /Cannot read properties of null.*DebugElement/, // Occasional teardown timing
];
```

**Important:** Start with NO ignored patterns. Only add patterns after confirming they're test-environment-specific and not production bugs.

## Test Structure

### Standard Smoke Test Pattern

Each component gets 2-4 smoke tests:

```typescript
describe('ItemListComponent', () => {
  describe('SMOKE', () => {
    it('should render with data without console errors', () => {
      // Setup: Component receives expected data
      // Assert: Component renders AND no console errors
    });

    it('should handle primary action without console errors', () => {
      // Setup: Trigger main user action (save, filter, delete)
      // Assert: Action completes AND no console errors
    });
  });
});
```

### Test Categories by File Type

| File Type | Test 1 | Test 2 | Test 3 (if applicable) |
|-----------|--------|--------|------------------------|
| **List/Browser Component** | Render with data | Filter/search action | Sort action |
| **Detail/View Component** | Render with data | N/A | N/A |
| **Edit/Form Component** | Render with data | Save action | Cancel/reset action |
| **Modal/Dialog Component** | Render open state | Confirm action | Cancel action |
| **Service** | Method returns expected | Error handling | N/A |
| **Guard** | Allows access | Denies access | N/A |
| **Pipe** | Transforms value | Handles null/undefined | N/A |

## Implementation Files

### 1. ConsoleErrorTracker (`console-error-tracker.ts`)

Core utility that intercepts console.error and console.warn:

```typescript
export class ConsoleErrorTracker {
  start(): void;           // Begin capturing
  stop(): void;            // Restore original console
  getErrors(): string[];   // Get captured errors
  hasErrors(): boolean;    // Quick check
  expectNoErrors(): void;  // Fail test if errors exist
  addIgnoredPattern(pattern: RegExp): void;  // Add noise filter
}
```

### 2. Smoke Test Helpers (`smoke-test.helpers.ts`)

Convenience functions for common patterns:

```typescript
// Quick component render test
expectComponentRendersCleanly(ComponentClass, providers);

// Test with mock data
expectComponentRendersWithData(ComponentClass, providers, mockData);

// Test user action
expectActionCompletesCleanly(fixture, action);
```

### 3. Generated Spec Files

The generator creates spec files with:

- Proper imports and TestBed configuration
- ConsoleErrorTracker integration
- Data state test
- Primary action test(s) based on component type
- Placeholder mocks for services

## Usage

### Running Smoke Tests Only

```bash
# All smoke tests (fast - ~30 seconds for 200 components)
ng test -- --grep="SMOKE"

# Smoke tests for specific feature
ng test --include='**/owner/**/*.spec.ts' -- --grep="SMOKE"
```

### npm Scripts

```json
{
  "test:smoke": "ng test -- --grep='SMOKE' --watch=false --browsers=ChromeHeadless",
  "test:smoke:watch": "ng test -- --grep='SMOKE'",
  "test:full": "ng test --watch=false --browsers=ChromeHeadless"
}
```

### CI Pipeline Integration

```yaml
# Run smoke tests first (fast fail)
- name: Smoke Tests
  run: npm run test:smoke

# Full suite only if smoke passes
- name: Full Test Suite
  run: npm run test:full
```

## Maintaining the Ignored Patterns List

### Adding a New Pattern

1. Encounter a failing smoke test
2. Verify the error is test-environment-specific:
   - Does it occur in production? → **FIX THE BUG**
   - Only in tests? → Consider adding to ignore list
3. Document WHY it's ignored:

```typescript
private ignoredPatterns: RegExp[] = [
  // Angular test framework doesn't provide ActivatedRoute by default
  // Safe to ignore in isolated component tests
  /NullInjectorError.*ActivatedRoute/,
];
```

### Quarterly Review

Review ignored patterns quarterly:
- Are any no longer needed (Angular updates)?
- Are any hiding real bugs now?
- Can test setup be improved to eliminate the need?

## Metrics

Track these metrics over time:

| Metric | Target | Why |
|--------|--------|-----|
| Smoke test coverage | 100% of components | Every component tested |
| Smoke test pass rate | 100% | No silent errors |
| Ignored patterns count | < 10 | Not hiding bugs |
| Smoke test runtime | < 60 seconds | Fast feedback |

## Migration Path

### Phase 1: Generate Missing Specs (Week 1)
- Run generator for 165 missing spec files
- All tests pass with console error tracking

### Phase 2: Fix Discovered Errors (Week 2-3)
- Generator will reveal hidden console errors
- Fix bugs (real issues, not test setup)
- Add legitimate patterns to ignore list

### Phase 3: Baseline (Week 4)
- All smoke tests passing
- Ignore list documented and justified
- CI pipeline integrated

### Phase 4: Maintenance (Ongoing)
- New components get smoke tests in PR
- Console error = test failure
- Quarterly ignore list review

## FAQ

**Q: Won't this create a lot of false positives?**
A: Initially, yes. That's the point - those "false positives" are often real bugs you didn't know about. After the initial cleanup, false positives are rare.

**Q: What about async operations?**
A: The tracker captures errors during the test execution, including async operations within `fakeAsync`/`tick` or `async`/`await` blocks.

**Q: Can I disable this for specific tests?**
A: Yes, but document why:

```typescript
it('intentionally tests error handling', () => {
  tracker.addIgnoredPattern(/Expected error for this test/);
  // ... test that triggers expected error
});
```

**Q: How is this different from E2E tests?**
A: Smoke tests are unit tests that verify component rendering. E2E tests verify user flows across the application. Both are valuable; smoke tests run in milliseconds, E2E in seconds.

---

## Nightly Automation Workflow

For large codebases, manual test fixing doesn't scale. The nightly runner automates the process:

### The Problem

- 165 missing spec files to create
- Each generated spec needs customization (mocks, inputs, actions)
- Some failures are easy (missing imports), some are hard (complex mocks)
- Developer time is precious

### The Solution: Tiered Automation

```
Tier 1: Auto-Fix (Immediate)
├── Missing imports
├── Missing detectChanges
├── Simple syntax fixes
└── ~40% of failures

Tier 2: Escalation Bundle (Morning)
├── Complex mock setup
├── Async timing issues
├── Template binding errors
└── Claude.ai designs the fix

Tier 3: Manual (Rare)
├── Architectural issues
├── Test design decisions
└── Human judgment needed
```

### Nightly Process

```bash
# Run at 2am via cron or CI scheduled job
npm run nightly

# Creates: ./test-escalations/escalation-2025-01-08.zip
```

### Morning Handoff to Claude.ai

The escalation bundle is designed for LLM consumption:

1. **SUMMARY.md** - High-level overview of all failures
2. **ERRORS.md** (per component) - Detailed errors with context
3. **Source files** - Component, spec, template, services

**Prompt for Claude.ai:**

```
I have smoke tests that are failing and couldn't be auto-fixed.
Each component folder contains:
- The spec file (test)
- The component file (source)
- Related files (template, services)
- ERRORS.md with the failure details

For each component, please:
1. Analyze why the test is failing
2. Identify what mocks or setup are missing
3. Provide the corrected spec file

Focus on making the smoke tests pass - they should verify:
- Component renders with data
- Primary action completes without console errors
```

### Why This Works

| Task | Human Time | LLM Time | Quality |
|------|-----------|----------|---------|
| Analyze error | 5-10 min | 30 sec | Similar |
| Design mock setup | 10-20 min | 1 min | LLM often better |
| Write test code | 15-30 min | 2 min | Human review needed |
| **Total per component** | **30-60 min** | **~5 min** | Review + apply |

With 12 components per night, this saves 6-12 hours of developer time per batch.

### Limiting to 12 Components

Why cap at 12?

1. **LLM context limits** - Too many files overwhelms the context window
2. **Human review capacity** - You can review 12 fixes in ~1 hour
3. **Incremental progress** - Steady improvement vs. massive PRs
4. **Feedback loop** - Learn from each batch, improve the process

### Sample Nightly Output

```
🌙 Nightly Smoke Test Runner
============================

📊 Initial Results:
   Total failures: 47

🔧 Processing: item-list.component.spec.ts
   Attempt 1/3...
   ✅ Fixed with: Add missing fakeAsync import

🔧 Processing: item-edit.component.spec.ts
   Attempt 1/3...
   ❌ No applicable fix found: Cannot read property 'form' of undefined
   Attempt 2/3...
   ❌ No applicable fix found: Cannot read property 'form' of undefined
   Attempt 3/3...
   ❌ No applicable fix found: Cannot read property 'form' of undefined
   📦 Adding to escalation bundle

... (continues for each failure)

============================
📋 NIGHTLY RUN COMPLETE
============================

Total failures: 47
Auto-fixed: 18
Escalated: 12
Remaining (for next run): 17

📁 Escalation bundle: ./test-escalations/escalation-2025-01-08.zip

☀️  In the morning, upload this zip to Claude.ai for test design help.
```
