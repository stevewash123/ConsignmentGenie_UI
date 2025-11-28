# ConsignmentGenie UI

**🚨 CRITICAL: Read [Master CLAUDE.md](../../CLAUDE.md) FIRST for ConsignmentGenie context, workspace structure, and development guidelines.**

## Project Overview
Angular frontend for the ConsignmentGenie multi-tenant consignment management platform. Provides user interfaces for shop owners, providers, and future customer-facing functionality.

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
- **Provider Management**: Add, edit, view provider details
- **Inventory Management**: Item CRUD with provider assignment
- **Transaction Recording**: Sales entry with split calculations
- **Payout Reporting**: Generate and export payout summaries
- **Responsive Design**: Mobile-friendly Tailwind CSS layouts

## Development Guidelines

**Essential Development Notes:**
1. **Use Chrome MCP to debug as needed** - Available for web debugging and testing
2. **Find a similar component before adding a new one** - Check services, code styles, and existing patterns

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