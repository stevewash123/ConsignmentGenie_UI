# Component Finder - ConsignmentGenie UI

## Quick Route to Component Mapping

**🎯 Purpose**: Stop wasting time hunting for components! This maps every route to its exact file location.

### Owner Settings Routes

| Route | Component File | Purpose |
|-------|---------------|---------|
| `owner/settings/account/billing` | `./settings/account/license.component.ts` | **Subscription/billing management** |
| `owner/settings/account/owner-contact-info` | `./settings/account/owner-contact-info/owner-contact-info.component.ts` | Owner contact information |
| `owner/settings/store-profile/basic-info` | `./settings/profile/basic-info/store-profile-basic-info.component.ts` | Shop basic information |
| `owner/settings/profile/branding` | `./settings/profile/branding/branding.component.ts` | Logo, colors, branding |
| `owner/settings/business/tax-settings` | `./settings/business/tax-settings.component.ts` | Tax configuration |
| `owner/settings/business/receipt-settings` | `./settings/business/receipt-settings/receipt-settings.component.ts` | Receipt templates |
| `owner/settings/business/policies` | `./settings/business/policies/policies.component.ts` | Shop policies |
| `owner/settings/consignors/defaults` | `./settings/consignors/consignor-settings.component.ts` | Default consignor terms |
| `owner/settings/consignors/onboarding` | `./settings/consignors/onboarding/consignor-onboarding.component.ts` | Consignor onboarding flow |
| `owner/settings/consignors/agreement` | `./settings/consignors/agreement/agreements.component.ts` | Consignor agreements |
| `owner/settings/payouts/general` | `./settings/payouts/general/payout-general.component.ts` | Payout configuration |
| `owner/settings/payouts/direct-deposit` | `./settings/payouts/direct-deposit/payout-direct-deposit.component.ts` | ACH/bank setup |
| `owner/settings/sales/general` | `./settings/integrations/sales/sales.component.ts` | POS integrations |
| `owner/settings/book-keeping/general` | `./settings/book-keeping/general/book-keeping-general.component.ts` | Accounting settings |
| `owner/settings/book-keeping/quickbooks` | `./settings/integrations/accounting/accounting.component.ts` | QuickBooks integration |
| `owner/settings/notifications` | `./settings/notifications/notifications.component.ts` | Notification preferences |
| `owner/settings/storefront` | `./settings/storefront/storefront-settings.component.ts` | Online store setup |

### Owner Main Routes

| Route | Component File | Purpose |
|-------|---------------|---------|
| `owner/dashboard` | `./components/owner-dashboard.component.ts` | Main dashboard |
| `owner/consignors` | `./components/consignor-list.component.ts` | Consignor list view |
| `owner/consignors/new` | `./components/consignor-add.component.ts` | Add new consignor |
| `owner/consignors/:id` | `./components/consignor-detail.component.ts` | Consignor detail view |
| `owner/consignors/:id/edit` | `./components/consignor-edit.component.ts` | Edit consignor |
| `owner/inventory` | `./components/inventory-list.component.ts` | Inventory list |
| `owner/inventory/new` | `./components/inventory-add.component.ts` | Add new item |
| `owner/inventory/:id` | `./components/item-detail.component.ts` | Item detail view |
| `owner/inventory/:id/edit` | `./components/inventory-edit.component.ts` | Edit item |
| `owner/record-sale` | `./components/record-sale.component.ts` | POS sale entry |
| `owner/sales` | `./components/owner-sales.component.ts` | Sales history |
| `owner/payouts` | `./components/owner-payouts.component.ts` | Payout management |

### File Path Reference

All paths are relative to: `/src/app/owner/`

**Example**:
- Route: `owner/settings/account/billing`
- Full path: `/src/app/owner/settings/account/license.component.ts`

---

## 🔧 How to Update This File

1. **When adding new routes**: Update this mapping immediately
2. **Route file locations**:
   - Main routes: `/src/app/owner/owner.routes.ts`
   - App routes: `/src/app/app.routes.ts`
3. **Auto-generation**: Consider creating a script to parse routes and auto-update this file

---

## 💡 Why This Exists

**Before**: "Where's the billing component?" → 10 minutes of searching
**After**: Check this file → Found in 5 seconds

**Last Updated**: 2025-01-29
**Source**: Generated from `owner.routes.ts` analysis