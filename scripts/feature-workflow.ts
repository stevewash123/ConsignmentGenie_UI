#!/usr/bin/env node

/**
 * Feature-Based Smoke Test Workflow
 * 
 * Processes smoke tests one feature at a time for incremental build/test/commit.
 * Designed for use with Claude Code (CC) for iterative development.
 * 
 * Usage:
 *   npx ts-node scripts/feature-workflow.ts list              # List all features
 *   npx ts-node scripts/feature-workflow.ts status            # Show progress
 *   npx ts-node scripts/feature-workflow.ts generate admin    # Generate for one feature
 *   npx ts-node scripts/feature-workflow.ts test admin        # Test one feature
 *   npx ts-node scripts/feature-workflow.ts process admin     # Generate + test + report
 *   npx ts-node scripts/feature-workflow.ts next              # Process next incomplete feature
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawnSync } from 'child_process';
import { 
  FEATURES, 
  FeatureConfig, 
  getFeatureByName, 
  getFeatureForPath,
  getFeaturesInOrder,
  listFeatures 
} from './feature-config';

// ============================================================================
// Configuration
// ============================================================================

interface FeatureStatus {
  name: string;
  description: string;
  totalFiles: number;
  withSpecs: number;
  missingSpecs: number;
  passingTests: number;
  failingTests: number;
  status: 'not-started' | 'in-progress' | 'complete' | 'needs-fixes';
}

interface WorkflowState {
  features: Record<string, FeatureStatus>;
  lastUpdated: string;
  currentFeature: string | null;
}

const STATE_FILE = '.smoke-test-state.json';
const SRC_DIR = './src';

// ============================================================================
// File Discovery
// ============================================================================

interface FileInfo {
  filePath: string;
  type: string;
  feature: string;
  hasSpec: boolean;
}

function discoverFiles(srcDir: string): FileInfo[] {
  const files: FileInfo[] = [];
  
  const filePatterns: Record<string, RegExp> = {
    component: /\.component\.ts$/,
    service: /\.service\.ts$/,
    pipe: /\.pipe\.ts$/,
    guard: /\.guard\.ts$/,
    directive: /\.directive\.ts$/,
    resolver: /\.resolver\.ts$/,
    interceptor: /\.interceptor\.ts$/,
  };

  function scan(dir: string): void {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', 'coverage', '.git', 'e2e'].includes(entry.name)) {
          scan(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        if (entry.name.includes('.spec.') || entry.name.includes('.test.')) {
          continue;
        }
        
        for (const [type, pattern] of Object.entries(filePatterns)) {
          if (pattern.test(entry.name)) {
            const specPath = fullPath.replace(/\.ts$/, '.spec.ts');
            const feature = getFeatureForPath(fullPath);
            
            files.push({
              filePath: fullPath,
              type,
              feature: feature.name,
              hasSpec: fs.existsSync(specPath),
            });
            break;
          }
        }
      }
    }
  }
  
  scan(srcDir);
  return files;
}

// ============================================================================
// State Management
// ============================================================================

function loadState(): WorkflowState {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  }
  return {
    features: {},
    lastUpdated: new Date().toISOString(),
    currentFeature: null,
  };
}

function saveState(state: WorkflowState): void {
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function updateFeatureStatus(featureName: string, files: FileInfo[]): FeatureStatus {
  const featureFiles = files.filter(f => f.feature === featureName);
  const config = getFeatureByName(featureName);
  
  const status: FeatureStatus = {
    name: featureName,
    description: config?.description || '',
    totalFiles: featureFiles.length,
    withSpecs: featureFiles.filter(f => f.hasSpec).length,
    missingSpecs: featureFiles.filter(f => !f.hasSpec).length,
    passingTests: 0,
    failingTests: 0,
    status: 'not-started',
  };
  
  // Determine status
  if (status.missingSpecs === 0 && status.totalFiles > 0) {
    status.status = 'complete';
  } else if (status.withSpecs > 0) {
    status.status = 'in-progress';
  }
  
  return status;
}

// ============================================================================
// Commands
// ============================================================================

function cmdList(): void {
  console.log('📋 Available Features (in processing order)\n');
  console.log('─'.repeat(70));
  
  const features = getFeaturesInOrder();
  for (const feature of features) {
    console.log(`  ${feature.priority.toString().padStart(2)}. ${feature.name.padEnd(25)} ${feature.description}`);
  }
  
  console.log('─'.repeat(70));
  console.log('\nUsage:');
  console.log('  npx ts-node scripts/feature-workflow.ts generate <feature>');
  console.log('  npx ts-node scripts/feature-workflow.ts test <feature>');
  console.log('  npx ts-node scripts/feature-workflow.ts process <feature>');
}

function cmdStatus(): void {
  console.log('📊 Smoke Test Coverage Status\n');
  
  const files = discoverFiles(SRC_DIR);
  const state = loadState();
  
  // Group by feature
  const byFeature: Record<string, FileInfo[]> = {};
  for (const file of files) {
    if (!byFeature[file.feature]) {
      byFeature[file.feature] = [];
    }
    byFeature[file.feature].push(file);
  }
  
  // Display status table
  console.log('─'.repeat(80));
  console.log(
    'Feature'.padEnd(25) +
    'Total'.padStart(8) +
    'Have Spec'.padStart(12) +
    'Missing'.padStart(10) +
    'Status'.padStart(15)
  );
  console.log('─'.repeat(80));
  
  let totalFiles = 0;
  let totalWithSpecs = 0;
  let totalMissing = 0;
  
  const features = getFeaturesInOrder();
  for (const config of features) {
    const featureFiles = byFeature[config.name] || [];
    const withSpecs = featureFiles.filter(f => f.hasSpec).length;
    const missing = featureFiles.filter(f => !f.hasSpec).length;
    
    let status = '⬚ Not Started';
    if (missing === 0 && featureFiles.length > 0) {
      status = '✅ Complete';
    } else if (withSpecs > 0) {
      status = '🔄 In Progress';
    }
    
    console.log(
      config.name.padEnd(25) +
      featureFiles.length.toString().padStart(8) +
      withSpecs.toString().padStart(12) +
      missing.toString().padStart(10) +
      status.padStart(15)
    );
    
    totalFiles += featureFiles.length;
    totalWithSpecs += withSpecs;
    totalMissing += missing;
  }
  
  // Handle 'other'
  const otherFiles = byFeature['other'] || [];
  if (otherFiles.length > 0) {
    const withSpecs = otherFiles.filter(f => f.hasSpec).length;
    const missing = otherFiles.filter(f => !f.hasSpec).length;
    console.log(
      'other'.padEnd(25) +
      otherFiles.length.toString().padStart(8) +
      withSpecs.toString().padStart(12) +
      missing.toString().padStart(10) +
      ''.padStart(15)
    );
    totalFiles += otherFiles.length;
    totalWithSpecs += withSpecs;
    totalMissing += missing;
  }
  
  console.log('─'.repeat(80));
  console.log(
    'TOTAL'.padEnd(25) +
    totalFiles.toString().padStart(8) +
    totalWithSpecs.toString().padStart(12) +
    totalMissing.toString().padStart(10)
  );
  console.log('─'.repeat(80));
  
  const coverage = totalFiles > 0 ? ((totalWithSpecs / totalFiles) * 100).toFixed(1) : '0';
  console.log(`\n📈 Spec Coverage: ${coverage}%`);
  
  // Save state
  for (const config of features) {
    state.features[config.name] = updateFeatureStatus(config.name, files);
  }
  saveState(state);
}

function cmdGenerate(featureName: string): void {
  const feature = getFeatureByName(featureName);
  if (!feature) {
    console.error(`❌ Unknown feature: ${featureName}`);
    console.log('\nAvailable features:');
    listFeatures().forEach(f => console.log(`  - ${f}`));
    process.exit(1);
  }
  
  console.log(`🔧 Generating smoke tests for: ${feature.name}`);
  console.log(`   ${feature.description}\n`);
  
  // Build path pattern for generator
  const pathPattern = feature.pathPatterns[0].replace('**/', '').replace('/**', '');
  
  // Run generator with path filter
  const result = spawnSync('npx', [
    'ts-node',
    'scripts/generate-smoke-tests.ts',
    `--path=${pathPattern}`,
  ], {
    encoding: 'utf-8',
    shell: true,
    stdio: 'inherit',
  });
  
  if (result.status !== 0) {
    console.error('❌ Generation failed');
    process.exit(1);
  }
}

function cmdTest(featureName: string): void {
  const feature = getFeatureByName(featureName);
  if (!feature) {
    console.error(`❌ Unknown feature: ${featureName}`);
    process.exit(1);
  }
  
  console.log(`🧪 Running smoke tests for: ${feature.name}\n`);
  
  // Build include pattern
  const includePattern = feature.pathPatterns
    .map(p => `--include='${p.replace(/\*\*/g, '**/*')}.spec.ts'`)
    .join(' ');
  
  // Run tests
  const cmd = `ng test --watch=false --browsers=ChromeHeadless ${includePattern} -- --grep="SMOKE"`;
  console.log(`Running: ${cmd}\n`);
  
  const result = spawnSync(cmd, {
    encoding: 'utf-8',
    shell: true,
    stdio: 'inherit',
  });
  
  process.exit(result.status || 0);
}

function cmdProcess(featureName: string): void {
  const feature = getFeatureByName(featureName);
  if (!feature) {
    console.error(`❌ Unknown feature: ${featureName}`);
    process.exit(1);
  }
  
  console.log('═'.repeat(60));
  console.log(`  Processing Feature: ${feature.name}`);
  console.log(`  ${feature.description}`);
  console.log('═'.repeat(60));
  console.log('');
  
  // Step 1: Show current status
  console.log('📊 Step 1: Checking current status...\n');
  const files = discoverFiles(SRC_DIR);
  const featureFiles = files.filter(f => f.feature === featureName);
  const missing = featureFiles.filter(f => !f.hasSpec);
  
  console.log(`   Total files: ${featureFiles.length}`);
  console.log(`   With specs: ${featureFiles.filter(f => f.hasSpec).length}`);
  console.log(`   Missing specs: ${missing.length}`);
  console.log('');
  
  if (missing.length === 0) {
    console.log('✅ All files have specs! Running tests...\n');
  } else {
    // Step 2: Generate missing specs
    console.log('🔧 Step 2: Generating missing specs...\n');
    cmdGenerate(featureName);
    console.log('');
  }
  
  // Step 3: Run tests
  console.log('🧪 Step 3: Running smoke tests...\n');
  cmdTest(featureName);
  
  // Step 4: Report
  console.log('\n' + '═'.repeat(60));
  console.log('  Next Steps:');
  console.log('═'.repeat(60));
  console.log('');
  console.log('  1. Review any failing tests');
  console.log('  2. Fill in TODO sections (mocks, inputs, actions)');
  console.log('  3. Run tests again: npm run test:feature -- ' + featureName);
  console.log('  4. When passing, commit:');
  console.log(`     git add -A && git commit -m "test(${featureName}): add smoke tests"`);
  console.log('  5. Move to next feature: npm run workflow next');
  console.log('');
}

function cmdNext(): void {
  console.log('🔍 Finding next feature to process...\n');
  
  const files = discoverFiles(SRC_DIR);
  const features = getFeaturesInOrder();
  
  for (const config of features) {
    const featureFiles = files.filter(f => f.feature === config.name);
    const missing = featureFiles.filter(f => !f.hasSpec);
    
    if (featureFiles.length === 0) continue;
    
    if (missing.length > 0) {
      console.log(`📌 Next feature: ${config.name}`);
      console.log(`   ${config.description}`);
      console.log(`   Missing ${missing.length} of ${featureFiles.length} specs\n`);
      console.log('Run:');
      console.log(`   npx ts-node scripts/feature-workflow.ts process ${config.name}`);
      return;
    }
  }
  
  console.log('🎉 All features have specs! Run full test suite:');
  console.log('   ng test -- --grep="SMOKE"');
}

function cmdFiles(featureName: string): void {
  const feature = getFeatureByName(featureName);
  if (!feature) {
    console.error(`❌ Unknown feature: ${featureName}`);
    process.exit(1);
  }
  
  console.log(`📁 Files in feature: ${feature.name}\n`);
  
  const files = discoverFiles(SRC_DIR);
  const featureFiles = files.filter(f => f.feature === featureName);
  
  const byType: Record<string, FileInfo[]> = {};
  for (const file of featureFiles) {
    if (!byType[file.type]) byType[file.type] = [];
    byType[file.type].push(file);
  }
  
  for (const [type, typeFiles] of Object.entries(byType)) {
    console.log(`${type}s (${typeFiles.length}):`);
    for (const file of typeFiles) {
      const status = file.hasSpec ? '✅' : '❌';
      const relativePath = path.relative(SRC_DIR, file.filePath);
      console.log(`  ${status} ${relativePath}`);
    }
    console.log('');
  }
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];
  const arg1 = args[1];
  
  switch (command) {
    case 'list':
      cmdList();
      break;
    case 'status':
      cmdStatus();
      break;
    case 'generate':
      if (!arg1) {
        console.error('❌ Please specify a feature name');
        console.log('Usage: npx ts-node scripts/feature-workflow.ts generate <feature>');
        process.exit(1);
      }
      cmdGenerate(arg1);
      break;
    case 'test':
      if (!arg1) {
        console.error('❌ Please specify a feature name');
        process.exit(1);
      }
      cmdTest(arg1);
      break;
    case 'process':
      if (!arg1) {
        console.error('❌ Please specify a feature name');
        process.exit(1);
      }
      cmdProcess(arg1);
      break;
    case 'next':
      cmdNext();
      break;
    case 'files':
      if (!arg1) {
        console.error('❌ Please specify a feature name');
        process.exit(1);
      }
      cmdFiles(arg1);
      break;
    default:
      console.log('🧪 Smoke Test Feature Workflow\n');
      console.log('Commands:');
      console.log('  list                    List all features');
      console.log('  status                  Show coverage status for all features');
      console.log('  generate <feature>      Generate specs for a feature');
      console.log('  test <feature>          Run smoke tests for a feature');
      console.log('  process <feature>       Generate + test + report (full workflow)');
      console.log('  next                    Find and process next incomplete feature');
      console.log('  files <feature>         List all files in a feature');
      console.log('');
      console.log('Examples:');
      console.log('  npx ts-node scripts/feature-workflow.ts status');
      console.log('  npx ts-node scripts/feature-workflow.ts process admin');
      console.log('  npx ts-node scripts/feature-workflow.ts next');
  }
}

main();
