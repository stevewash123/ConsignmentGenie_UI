# ConsignmentGenie UI

**🚨 CRITICAL: Read [Master CLAUDE.md](../../CLAUDE.md) FIRST for ConsignmentGenie context, workspace structure, and development guidelines.**

## Project Overview
Angular frontend for the ConsignmentGenie multi-tenant consignment management platform. Provides user interfaces for shop owners, consignors, and future customer-facing functionality.

## Architecture
- **Framework**: Angular 17+ with standalone components
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Services + RxJS
- **Package Manager**: npm
- **HTTP Client**: Angular HttpClient with interceptors

## Project Structure
```
src/
├── app/
│   ├── components/          ← Shared UI components
│   ├── pages/              ← Route pages/views
│   ├── services/           ← API services, auth, state
│   ├── models/             ← TypeScript interfaces
│   ├── guards/             ← Route guards (auth, role)
│   ├── interceptors/       ← HTTP interceptors
│   ├── pipes/              ← Custom pipes
│   └── app.routes.ts       ← Application routing
├── assets/                 ← Static assets
├── environments/           ← Environment configs
└── main.ts                 ← Application bootstrap
```

## Key Features
- **Authentication**: JWT-based login with role management
- **consignor Management**: Add, edit, view consignor details
- **Inventory Management**: Item CRUD with consignor assignment
- **Transaction Recording**: Sales entry with split calculations
- **Payout Reporting**: Generate and export payout summaries
- **Responsive Design**: Mobile-friendly Tailwind CSS layouts

## Development Guidelines

**Essential Development Notes:**
1. **Use Chrome MCP to debug as needed** - Available for web debugging and testing
2. **Find a similar component before adding a new one** - Check services, code styles, and existing patterns
3. **Follow UI Pattern Standards** - See [UI_PATTERNS.md](../docs/UI_PATTERNS.md) for:
   - Modal vs Page decision framework
   - Entity-specific interaction patterns
   - **NEVER use browser dialogs** (`alert`, `confirm`, `prompt`) - Use shared modal components instead

## 🎨 **STYLING GUIDELINES**

**✅ This project USES Tailwind CSS** - Follow existing patterns
- **Use @apply directives** in SCSS files to apply Tailwind classes
- **Follow existing component patterns** for consistent styling
- **Use Tailwind utility classes** in templates when appropriate
- **Check existing components** to see the established styling approach

**Examples from existing codebase:**
- ✅ `@apply h-full flex flex-col bg-gray-50;`
- ✅ `@apply bg-white border-b border-gray-200 px-6 py-4;`
- ✅ `@apply flex items-center gap-3;`

## Build & Test Commands

**Always force fresh log files when piping output to avoid outdated results:**
```bash
# Fresh build with new log file
rm -f build-output.log && npx ng build 2>&1 | tee build-output.log

# Fresh test run with new log file
rm -f test-output.log && npx ng test --watch=false --browsers=ChromeHeadless 2>&1 | tee test-output.log

# Fresh lint check with new log file
rm -f lint-output.log && npx ng lint 2>&1 | tee lint-output.log
```

**Why this matters:** Piping to existing log files can give outdated results. Always `rm -f logfile.log &&` before command to ensure fresh output.

## Environment Configuration
- **Windows Development**: `environment.ts` - Points to localhost API
- **WSL Development**: `environment.development.ts` - Points to WSL API endpoints

## Git Repository
This is a **separate git repository** from the API. Always ensure you're in the correct directory before git operations:
```bash
cd /mnt/c/Projects/ConsignmentGenie/ConsignmentGenie_UI
git status  # Verify you're in the UI repo
```

## Related Projects
- [Parent Project](../CLAUDE.md)
- [ConsignmentGenie API](../ConsignmentGenie_API/CLAUDE.md)
- [Master CLAUDE.md](../../CLAUDE.md)

## Universal Configuration
📋 **See [Universal Settings](../../docs/UNIVERSAL-SETTINGS.md)** for authentication, development environment, and standards that apply to all projects.