# UI Route Fixes - OrganizationController Refactor

## ✅ FIXED ROUTES

### 1. Branding Service (`/src/app/services/branding.service.ts`)
**Fixed routes to use OrganizationBrandingController:**
- ❌ Old: `GET /api/organizations/branding`
- ✅ New: `GET /api/organizations/branding/settings`

- ❌ Old: `PUT /api/organizations/branding`
- ✅ New: `PUT /api/organizations/branding/settings`

**Logo endpoints remain the same (correct):**
- ✅ `POST /api/organizations/branding/logo`
- ✅ `DELETE /api/organizations/branding/logo`

### 2. Settings Service - Payout Settings (`/src/app/services/settings.service.ts`)
**Fixed routes to use PayoutSettingsController:**
- ❌ Old: `GET /api/organizations/payout-settings`
- ✅ New: `GET /api/payoutsettings`

- ❌ Old: `PATCH /api/organizations/payout-settings`
- ✅ New: `PATCH /api/payoutsettings`

## ✅ ALREADY CORRECT ROUTES

### Settings Service - Business/Profile Routes
These were already using the correct new routes:
- ✅ `GET /api/organizations/business/profile`
- ✅ `PATCH /api/organizations/business/profile`
- ✅ `GET /api/organizations/business/settings`
- ✅ `PATCH /api/organizations/business/settings`

### Settings Service - Consignor Routes
These were already using the correct new routes:
- ✅ `GET /api/organizations/consignors/organization-settings`
- ✅ `PATCH /api/organizations/consignors/organization-settings`
- ✅ `GET /api/organizations/consignors/default-permissions`
- ✅ `PATCH /api/organizations/consignors/default-permissions`

### Settings Service - Agreement Routes
These were already using the correct new routes:
- ✅ `POST /api/organizations/agreements/templates`
- ✅ `GET /api/organizations/agreements/templates/{templateId}`
- ✅ `GET /api/organizations/agreements/templates/{templateId}/text`
- ✅ `DELETE /api/organizations/agreements/templates/{templateId}`
- ✅ `POST /api/organizations/agreements/generate-pdf`
- ✅ `POST /api/organizations/agreements/send-sample`

## ⚠️ NEEDS INVESTIGATION

### Accounting Settings (`/src/app/services/settings.service.ts`)
**Status**: Routes marked with TODO comments - endpoints may not exist
- 🔍 `GET /api/organizations/accounting-settings` - Needs verification
- 🔍 `PATCH /api/organizations/accounting-settings` - Needs verification

**Action Required**:
1. Verify if accounting settings endpoints exist in the API
2. Check if they were moved to a different controller
3. Update routes or implement missing endpoints

## 🔍 ROUTES TO AUDIT

Based on the endpoint audit, there may be other UI services that need checking:
1. **Setup/Onboarding routes** - Check if any UI calls old setup endpoints
2. **Storefront settings routes** - Check if any UI calls old storefront endpoints
3. **Notification settings routes** - Check if any UI calls old notification endpoints

## Next Steps
1. ✅ Test the fixed branding and payout routes
2. 🔍 Investigate accounting settings endpoints
3. 🔍 Search for any remaining UI services using old routes
4. 🧹 Remove duplicate endpoints from OrganizationController.cs after UI is confirmed working

## Impact
- **Fixed**: Branding and payout settings should now work correctly
- **Profile routes**: Already working (this was the original 404 error reported)
- **Accounting**: Needs investigation before use