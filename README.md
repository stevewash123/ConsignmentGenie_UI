# Smoke Test Generator & Console Error Tracking

Generate smoke tests for Angular components, services, pipes, guards, directives, resolvers, and interceptors with automatic console error detection.

## Quick Start

### 1. Copy Files to Your Project

```bash
# Copy testing utilities
cp -r src/testing/ your-project/src/testing/

# Copy generator script
cp scripts/generate-smoke-tests.ts your-project/scripts/
```

### 2. Add Path Alias (tsconfig.json)

```json
{
  "compilerOptions": {
    "paths": {
      "@testing/*": ["src/testing/*"]
    }
  }
}
```

### 3. Add npm Scripts (package.json)

```json
{
  "scripts": {
    "generate:smoke": "ts-node scripts/generate-smoke-tests.ts",
    "generate:smoke:dry": "ts-node scripts/generate-smoke-tests.ts --dry-run",
    "test:smoke": "ng test -- --grep='SMOKE' --watch=false --browsers=ChromeHeadless",
    "test:smoke:watch": "ng test -- --grep='SMOKE'"
  }
}
```

### 4. Generate Missing Spec Files

```bash
# Preview what will be generated
npm run generate:smoke:dry

# Generate all missing specs
npm run generate:smoke

# Generate only components
npm run generate:smoke -- --type=component

# Generate for specific path
npm run generate:smoke -- --path=owner
```

### 5. Run Smoke Tests

```bash
# Run all smoke tests (fast)
npm run test:smoke

# Run with watch mode during development
npm run test:smoke:watch
```

## Files Included

```
smoke-tests/
├── SMOKE_TEST_STRATEGY.md      # Detailed strategy document
├── README.md                    # This file
├── package.json                 # npm scripts
├── scripts/
│   └── generate-smoke-tests.ts # Generator script
└── src/
    └── testing/
        ├── index.ts                    # Barrel export
        ├── console-error-tracker.ts    # Error capture utility
        └── smoke-test.helpers.ts       # Test helper functions
```

## Usage Examples

### Basic Smoke Test

```typescript
import { ConsoleErrorTracker } from '@testing';

describe('MyComponent', () => {
  let tracker: ConsoleErrorTracker;

  beforeEach(() => {
    tracker = new ConsoleErrorTracker();
  });

  afterEach(() => {
    tracker.stop();
  });

  describe('SMOKE', () => {
    it('should render without console errors', () => {
      tracker.start();
      
      const fixture = TestBed.createComponent(MyComponent);
      fixture.detectChanges();
      
      expect(fixture.componentInstance).toBeTruthy();
      tracker.expectNoErrors();
    });
  });
});
```

### Using Helper Functions

```typescript
import { createSmokeTest, expectActionClean, cleanupSmokeTest } from '@testing';

describe('EditComponent', () => {
  describe('SMOKE', () => {
    it('should render with data', async () => {
      const ctx = await createSmokeTest(EditComponent);
      ctx.component.item = mockItem;
      ctx.fixture.detectChanges();
      
      expect(ctx.element.querySelector('.item-name')).toBeTruthy();
      ctx.tracker.expectNoErrors();
      cleanupSmokeTest(ctx);
    });

    it('should handle save action', async () => {
      const ctx = await createSmokeTest(EditComponent);
      ctx.component.item = mockItem;
      ctx.fixture.detectChanges();
      
      await expectActionClean(ctx, () => {
        ctx.component.save();
      });
      
      cleanupSmokeTest(ctx);
    });
  });
});
```

## Generator Options

| Option | Description | Example |
|--------|-------------|---------|
| `--src=<path>` | Source directory | `--src=./src/app` |
| `--dry-run` | Preview without creating files | `--dry-run` |
| `--verbose` | Show generated content | `--verbose` |
| `--type=<type>` | Filter by file type | `--type=component` |
| `--path=<pattern>` | Filter by path pattern | `--path=owner` |

## What Gets Generated

### Component Spec

- Test 1: Render with data without console errors
- Test 2: Handle primary action without console errors
- TODO markers for inputs, mocks, and actions

### Service Spec

- Test 1: Service creation without console errors  
- Test 2: Primary method execution without console errors

### Pipe Spec

- Test 1: Transform value without console errors
- Test 2: Handle null/undefined without console errors

### Guard Spec

- Test 1: Creation without console errors
- Test 2: Allow access scenario
- Test 3: Deny access scenario

## Maintenance

### Running Smoke Tests in CI

```yaml
# GitHub Actions example
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      
      # Fast smoke tests first
      - name: Smoke Tests
        run: npm run test:smoke
      
      # Full suite only if smoke passes
      - name: Full Test Suite
        run: npm run test:ci
```

### Ignoring Test Environment Errors

Edit `console-error-tracker.ts`:

```typescript
private ignoredPatterns: RegExp[] = [
  // Document WHY each pattern is ignored
  /NullInjectorError.*ActivatedRoute/,  // Isolated tests without routing
];
```

## Troubleshooting

### "Cannot find module '@testing'"

Add the path alias to `tsconfig.spec.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@testing/*": ["src/testing/*"]
    }
  }
}
```

### "ts-node not found"

Install ts-node:

```bash
npm install -D ts-node
```

### Tests pass but show console errors

This is expected! The whole point is to capture these errors. Either:
1. Fix the underlying bug
2. Add to ignored patterns (with documentation)

---

## Nightly Runner: Auto-Fix + Escalation

The nightly runner automates the fix-or-escalate workflow:

### How It Works

```
┌─────────────────┐
│  Run Smoke Tests │
└────────┬────────┘
         ▼
    ┌─────────┐
    │ Failures │──────No──────▶ Done! ✅
    └────┬────┘
         │Yes
         ▼
┌─────────────────────┐
│ For each failure:   │
│  Attempt fix (x3)   │
└────────┬────────────┘
         ▼
    ┌─────────┐
    │ Fixed?  │──────Yes─────▶ Next failure
    └────┬────┘
         │No
         ▼
┌─────────────────────┐
│ Add to escalation   │
│ bundle (max 12)     │
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ Create ZIP for      │
│ morning review      │
└─────────────────────┘
```

### Usage

```bash
# Run nightly process
npm run nightly

# Skip auto-fixes (just bundle failures)
npm run nightly:dry

# Limit to 6 components
npm run nightly:max6

# Custom options
npx ts-node scripts/nightly-smoke-runner.ts \
  --max-components=8 \
  --max-attempts=2 \
  --output=./my-escalations
```

### Auto-Fix Strategies

The runner attempts these fixes automatically:

| Strategy | What It Fixes |
|----------|---------------|
| Add fakeAsync import | Missing fakeAsync in test |
| Add tick import | Missing tick() function |
| Add rxjs of import | Missing `of()` operator |
| Add detectChanges | Missing detectChanges after tick |
| Add tracker.stop | Missing cleanup in afterEach |

### Escalation Bundle Contents

When failures can't be auto-fixed, the runner creates a zip:

```
escalation-2025-01-08/
├── SUMMARY.md              # Overview for Claude.ai
├── component-1/
│   ├── ERRORS.md           # Detailed errors + attempts
│   ├── my.component.ts     # Component source
│   ├── my.component.spec.ts# Test file
│   ├── my.component.html   # Template (if exists)
│   └── my.service.ts       # Related service (if imported)
├── component-2/
│   └── ...
└── ...
```

### Morning Workflow

1. Check for zip in `./test-escalations/`
2. Upload to Claude.ai
3. Prompt: "Review these failing smoke tests and suggest fixes for each component"
4. Apply fixes
5. Re-run: `npm run test:smoke`

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--max-components=N` | 12 | Max failures to bundle |
| `--max-attempts=N` | 3 | Fix attempts per failure |
| `--output=PATH` | ./test-escalations | Output directory |
| `--skip-fixes` | false | Skip auto-fix, just bundle |
| `--verbose` | false | Show detailed output |

---

## Contributing

When adding new smoke tests:

1. Always include `SMOKE` in the describe block for filtering
2. Always use ConsoleErrorTracker
3. Test at least: creation/render, primary action
4. Document any ignored patterns
