/**
 * Feature Configuration
 * 
 * Maps feature names to path patterns for targeted test generation and running.
 * Used by both the generator and nightly runner.
 */

export interface FeatureConfig {
  name: string;
  description: string;
  pathPatterns: string[];  // Glob-like patterns to match
  priority: number;        // Order to process (1 = first)
  estimatedFiles?: number; // Approximate files in this feature
}

export const FEATURES: FeatureConfig[] = [
  // ============================================
  // ADMIN
  // ============================================
  {
    name: 'admin',
    description: 'Admin dashboard and management',
    pathPatterns: [
      '**/admin/**',
      '**/administration/**',
    ],
    priority: 1,
    estimatedFiles: 15,
  },

  // ============================================
  // OWNER FEATURES
  // ============================================
  {
    name: 'inventory',
    description: 'Inventory Management - add/edit/list/detail inventory items',
    pathPatterns: [
      '**/inventory/**',
      '**/item/**',
      '**/items/**',
      '**/product/**',
      '**/products/**',
    ],
    priority: 2,
    estimatedFiles: 25,
  },
  {
    name: 'consignor',
    description: 'Consignor Management - invite/add/edit/list consignors, registration',
    pathPatterns: [
      '**/consignor/**',
      '**/consignors/**',
    ],
    priority: 3,
    estimatedFiles: 20,
  },
  {
    name: 'settings-account',
    description: 'Settings: Account & Profile - basic info, branding, contact',
    pathPatterns: [
      '**/settings/account/**',
      '**/settings/profile/**',
      '**/settings/branding/**',
      '**/account-settings/**',
      '**/profile/**',
    ],
    priority: 4,
    estimatedFiles: 10,
  },
  {
    name: 'settings-policies',
    description: 'Settings: Business Policies - rules, receipt settings',
    pathPatterns: [
      '**/settings/policies/**',
      '**/settings/business/**',
      '**/settings/rules/**',
      '**/settings/receipt/**',
      '**/policies/**',
    ],
    priority: 5,
    estimatedFiles: 8,
  },
  {
    name: 'settings-integrations',
    description: 'Settings: Integrations - accounting, payments, payouts, sales, inventory',
    pathPatterns: [
      '**/settings/integrations/**',
      '**/integrations/**',
      '**/square/**',
      '**/quickbooks/**',
      '**/stripe/**',
      '**/payment/**',
      '**/payout/**',
    ],
    priority: 6,
    estimatedFiles: 15,
  },
  {
    name: 'settings-consignor',
    description: 'Settings: Consignor Management - permissions, agreements',
    pathPatterns: [
      '**/settings/consignor/**',
      '**/consignor-settings/**',
      '**/agreements/**',
    ],
    priority: 7,
    estimatedFiles: 8,
  },
  {
    name: 'settings-notifications',
    description: 'Settings: Notifications - notification preferences',
    pathPatterns: [
      '**/settings/notifications/**',
      '**/notification-settings/**',
      '**/notification-preferences/**',
    ],
    priority: 8,
    estimatedFiles: 5,
  },
  {
    name: 'settings-storefront',
    description: 'Settings: Storefront - storefront configuration',
    pathPatterns: [
      '**/settings/storefront/**',
      '**/storefront/**',
      '**/shop-settings/**',
    ],
    priority: 9,
    estimatedFiles: 8,
  },
  {
    name: 'price-management',
    description: 'Price Management - price change requests and modals',
    pathPatterns: [
      '**/price/**',
      '**/pricing/**',
      '**/price-change/**',
      '**/markdown/**',
    ],
    priority: 10,
    estimatedFiles: 10,
  },
  {
    name: 'bulk-operations',
    description: 'Bulk Operations - bulk import functionality',
    pathPatterns: [
      '**/bulk/**',
      '**/import/**',
      '**/export/**',
      '**/batch/**',
    ],
    priority: 11,
    estimatedFiles: 8,
  },

  // ============================================
  // SHARED / CORE
  // ============================================
  {
    name: 'shared',
    description: 'Shared components, pipes, directives',
    pathPatterns: [
      '**/shared/**',
      '**/common/**',
      '**/core/**',
    ],
    priority: 12,
    estimatedFiles: 30,
  },
  {
    name: 'auth',
    description: 'Authentication and authorization',
    pathPatterns: [
      '**/auth/**',
      '**/login/**',
      '**/register/**',
      '**/guards/**',
    ],
    priority: 13,
    estimatedFiles: 10,
  },
  {
    name: 'layout',
    description: 'Layout components - header, sidebar, footer',
    pathPatterns: [
      '**/layout/**',
      '**/header/**',
      '**/sidebar/**',
      '**/footer/**',
      '**/nav/**',
      '**/shell/**',
    ],
    priority: 14,
    estimatedFiles: 10,
  },

  // ============================================
  // CATCH-ALL
  // ============================================
  {
    name: 'other',
    description: 'Uncategorized files',
    pathPatterns: ['**/*'],  // Matches everything not matched above
    priority: 99,
    estimatedFiles: 20,
  },
];

/**
 * Find which feature a file path belongs to.
 * Returns the first matching feature (by priority order).
 */
export function getFeatureForPath(filePath: string): FeatureConfig {
  const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
  
  // Sort by priority (lower = higher priority)
  const sortedFeatures = [...FEATURES].sort((a, b) => a.priority - b.priority);
  
  for (const feature of sortedFeatures) {
    // Skip 'other' unless nothing else matches
    if (feature.name === 'other') continue;
    
    for (const pattern of feature.pathPatterns) {
      if (matchesPattern(normalizedPath, pattern)) {
        return feature;
      }
    }
  }
  
  // Return 'other' as fallback
  return FEATURES.find(f => f.name === 'other')!;
}

/**
 * Simple glob-like pattern matching.
 * Supports ** (any path) and * (any segment).
 */
function matchesPattern(path: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\*\*/g, '<<<DOUBLESTAR>>>')
    .replace(/\*/g, '[^/]*')
    .replace(/<<<DOUBLESTAR>>>/g, '.*');
  
  const regex = new RegExp(regexPattern, 'i');
  return regex.test(path);
}

/**
 * Get feature by name.
 */
export function getFeatureByName(name: string): FeatureConfig | undefined {
  return FEATURES.find(f => f.name.toLowerCase() === name.toLowerCase());
}

/**
 * List all feature names.
 */
export function listFeatures(): string[] {
  return FEATURES
    .filter(f => f.name !== 'other')
    .sort((a, b) => a.priority - b.priority)
    .map(f => f.name);
}

/**
 * Get features in processing order.
 */
export function getFeaturesInOrder(): FeatureConfig[] {
  return [...FEATURES]
    .filter(f => f.name !== 'other')
    .sort((a, b) => a.priority - b.priority);
}
