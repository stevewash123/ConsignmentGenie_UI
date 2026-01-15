# Dead Code Cleanup Guide for ConsignmentGenie UI

## Overview
After running `npx knip`, we've identified **67 unused files** plus numerous unused exports, types, and enum members that can be safely removed to improve maintainability.

## ✅ Quick Start for Claude Code

```bash
# Run the analysis
npx knip

# After each cleanup session, re-run to see progress
npx knip --reporter=json > dead-code-report.json
```

## 📋 Cleanup Priority Order

### 1. **HIGH PRIORITY - Safe Deletions** (Start Here)
These are clearly unused legacy files:

**Mock Services** (safe to delete):
- `src/app/consignor/services/mock-consignor-payout.service.ts`
- `src/app/consignor/services/mock-earnings.service.ts`
- `src/app/features/consignor/services/mock-statement.service.ts`

**Legacy Auth Components** (replaced by new auth):
- `src/app/auth/login.component.ts`
- `src/app/auth/register-owner.component.ts`
- `src/app/public/owner-signup.component.ts`

**Old Module System Files** (replaced by standalone components):
- `src/app/features/consignor/items/items.module.ts`

**Legacy Models** (verify not used in API):
- `src/app/models/price-change-notification.model.ts`
- `src/app/models/price-change.model.ts`
- `src/app/models/item.model.ts` (likely replaced by API models)

### 2. **MEDIUM PRIORITY - Feature Components**
These may be unfinished features or replaced functionality:

**Price Change System** (old feature):
- `src/app/owner/components/modals/initiate-price-change/initiate-price-change.component.ts`
- `src/app/consignor/components/modals/respond-price-change/respond-price-change.component.ts`
- `src/app/public/price-change-response.component.ts`
- `src/app/services/price-change-notification.service.ts`
- `src/app/services/price-change.service.ts`

**Legacy Consignor Features**:
- `src/app/consignor/components/agreement-gate.component.ts`
- `src/app/consignor/components/consignor-items.component.ts`
- `src/app/consignor/components/monthly-statements.component.ts`
- `src/app/consignor/services/monthly-statements.service.ts`

### 3. **LOW PRIORITY - Verify Before Deletion**
These might be works-in-progress or have dependencies:

**Settings Components** (check if used in routes):
- `src/app/owner/settings/integrations/payments/payments.component.ts`
- `src/app/owner/settings/integrations/square-connection.component.ts`
- `src/app/owner/account/account-information.component.ts`

**Shopper Features** (future phase, keep unless confirmed unused):
- All files in `src/app/shopper/` directory

## 🔍 Verification Steps for Claude Code

Before deleting any file, verify:

```bash
# 1. Check if file is referenced in any routes
grep -r "ComponentName" src/app/**/*routes*.ts

# 2. Check if it's lazy loaded
grep -r "component.*import" src/app/**/*.ts

# 3. Check if selector is used in any templates
grep -r "app-component-selector" src/app/**/*.html

# 4. Check for dynamic imports
grep -r "import.*ComponentName" src/app/**/*.ts
```

## 🧹 Cleanup Commands for Claude Code

```bash
# Method 1: Delete specific files (safest)
rm src/app/consignor/services/mock-consignor-payout.service.ts

# Method 2: Bulk delete after verification
# (Only after manually confirming each file is safe)
cat << 'EOF' > cleanup.sh
#!/bin/bash
files_to_delete=(
  "src/app/consignor/services/mock-consignor-payout.service.ts"
  "src/app/consignor/services/mock-earnings.service.ts"
  # Add more files here after verification
)

for file in "${files_to_delete[@]}"; do
  if [ -f "$file" ]; then
    echo "Deleting: $file"
    rm "$file"
  fi
done
EOF
chmod +x cleanup.sh
./cleanup.sh
```

## 🎯 Clean Up Unused Exports/Types

For each file with unused exports:

```typescript
// Example: Remove unused interface from a file
// Before:
interface UnusedInterface { ... }  // ← Delete this
interface UsedInterface { ... }    // ← Keep this

// After:
interface UsedInterface { ... }    // ← Keep this only
```

## ⚡ Progressive Cleanup Workflow

1. **Start with mock services** (safest)
2. **Re-run knip** to see progress
3. **Remove legacy auth components**
4. **Re-run knip** to see progress
5. **Continue with next priority group**

## 🚨 Important Notes

- **Always commit working code before cleanup**
- **Test the application after each group of deletions**
- **Keep shopper features** (future implementation)
- **Verify routes don't reference deleted components**
- **Some interfaces might be used by API calls** (check network requests)

## 📊 Progress Tracking

Track progress by running knip after each cleanup session:

```bash
# Initial: 67 unused files
# After mock cleanup: ? unused files
# After auth cleanup: ? unused files
# Target: <20 unused files
```

## 🔄 Automated Cleanup Script Template

```bash
#!/bin/bash
echo "Running dead code cleanup..."

# High priority deletions (after manual verification)
SAFE_TO_DELETE=(
  # Add verified files here
)

for file in "${SAFE_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ Deleting: $file"
    rm "$file"
  else
    echo "❌ File not found: $file"
  fi
done

# Re-run analysis
echo "Re-running knip analysis..."
npx knip --reporter=compact

echo "Cleanup complete. Review the results above."
```

This guide provides a systematic approach to cleaning up the dead code while minimizing risk of breaking the application.