# CC Workflow Guide: Feature-by-Feature Smoke Tests

This guide is for Claude Code (CC) to follow when adding smoke tests incrementally.

## The Pattern

For each feature:
```
1. Generate specs
2. Run tests (expect some failures)
3. Fix failures (fill in mocks, inputs)
4. Run tests again
5. Commit when green
6. Move to next feature
```

## Quick Start

```bash
# See what needs work
npm run workflow:status

# Process features in order
npm run feature:admin          # Start here
npm run feature:inventory      # Then this
npm run feature:consignor      # And so on...
```

## Feature Processing Order

| Priority | Feature | npm script | Description |
|----------|---------|------------|-------------|
| 1 | admin | `npm run feature:admin` | Admin dashboard |
| 2 | inventory | `npm run feature:inventory` | Items CRUD |
| 3 | consignor | `npm run feature:consignor` | Consignor management |
| 4 | settings-account | `npm run feature:settings-account` | Profile, branding |
| 5 | settings-policies | `npm run feature:settings-policies` | Business rules |
| 6 | settings-integrations | `npm run feature:settings-integrations` | Square, payments |
| 7 | settings-consignor | `npm run feature:settings-consignor` | Permissions, agreements |
| 8 | settings-notifications | `npm run feature:settings-notifications` | Alert preferences |
| 9 | settings-storefront | `npm run feature:settings-storefront` | Shop config |
| 10 | price-management | `npm run feature:price-management` | Price changes |
| 11 | bulk-operations | `npm run feature:bulk-operations` | Import/export |

## Detailed Workflow

### Step 1: Check Status

```bash
npm run workflow:status
```

Output shows which features need work:
```
Feature                  Total    Have Spec    Missing    Status
────────────────────────────────────────────────────────────────
admin                       15          3          12    🔄 In Progress
inventory                   25          0          25    ⬚ Not Started
consignor                   20          0          20    ⬚ Not Started
...
```

### Step 2: Process a Feature

```bash
npm run feature:admin
```

This runs:
1. Generates missing spec files
2. Runs smoke tests
3. Reports results

### Step 3: Fix Failing Tests

Generated specs have TODO markers:

```typescript
// TODO: Add mock providers for dependencies
// { provide: SomeService, useValue: mockSomeService },

// TODO: Set up required @Input() properties
// component.someInput = mockData;

// TODO: Trigger primary action
// component.onSave();
```

**Common fixes:**

1. **Missing mock service:**
```typescript
const mockItemService = jasmine.createSpyObj('ItemService', ['getItems', 'saveItem']);
mockItemService.getItems.and.returnValue(of([]));

providers: [
  { provide: ItemService, useValue: mockItemService }
]
```

2. **Missing @Input():**
```typescript
const fixture = TestBed.createComponent(ItemDetailComponent);
component.item = { id: '1', name: 'Test Item', price: 10 };
fixture.detectChanges();
```

3. **Async data loading:**
```typescript
it('should render with data', fakeAsync(() => {
  mockService.getData.and.returnValue(of(mockData));
  fixture.detectChanges();
  tick();
  fixture.detectChanges();
  
  tracker.expectNoErrors();
}));
```

### Step 4: Run Tests Again

```bash
# Run just this feature's tests
npm run workflow -- test admin

# Or run all smoke tests
ng test -- --grep="SMOKE"
```

### Step 5: Commit When Green

```bash
git add -A
git commit -m "test(admin): add smoke tests for admin feature"
```

### Step 6: Next Feature

```bash
npm run workflow:next
```

Or explicitly:
```bash
npm run feature:inventory
```

## Handling Persistent Failures

If a test keeps failing after 3 attempts:

1. **Add to escalation list** - Note the component in a TODO
2. **Skip and move on** - Use `xit()` temporarily
3. **Review in morning** - Use nightly runner to bundle for Claude.ai review

```typescript
// TODO: Escalate - complex mock setup needed
xit('should render with data', () => {
  // ...
});
```

## Commit Message Format

```
test(<feature>): add smoke tests for <feature>

- Generated specs for X components
- Added mocks for Y services
- Covers render + primary action scenarios
```

Examples:
```
test(admin): add smoke tests for admin feature
test(inventory): add smoke tests for inventory management
test(settings-account): add smoke tests for account settings
```

## Tips for CC

1. **One feature at a time** - Don't try to do multiple features in one session
2. **Run tests frequently** - After each fix, run tests to verify
3. **Minimal mocks** - Only mock what's needed for the smoke test
4. **Copy patterns** - Once one component works, copy its mock setup to similar components
5. **Don't over-engineer** - Smoke tests just verify "renders without errors"

## File Locations

```
src/
├── testing/
│   ├── console-error-tracker.ts   # Error capture
│   ├── smoke-test.helpers.ts      # Test helpers
│   └── index.ts
scripts/
├── feature-config.ts              # Feature definitions
├── feature-workflow.ts            # This workflow
├── generate-smoke-tests.ts        # Spec generator
└── nightly-smoke-runner.ts        # Overnight automation
```

## Customizing Feature Mappings

If files aren't matching the right feature, edit `scripts/feature-config.ts`:

```typescript
{
  name: 'inventory',
  pathPatterns: [
    '**/inventory/**',
    '**/item/**',
    '**/items/**',
    '**/products/**',     // Add more patterns as needed
    '**/catalog/**',
  ],
  priority: 2,
},
```

## Success Criteria

A feature is "done" when:
- [ ] All files have spec files
- [ ] All smoke tests pass
- [ ] No console errors during render
- [ ] Primary actions don't throw errors
- [ ] Changes committed with proper message

## Getting Help

If stuck on a component:
1. Check the example files in `examples/`
2. Look at similar components that already have passing tests
3. Add to escalation bundle for Claude.ai review
