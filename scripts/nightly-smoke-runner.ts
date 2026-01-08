#!/usr/bin/env node

/**
 * Nightly Smoke Test Runner
 * 
 * Runs smoke tests, attempts auto-fixes for failures, and bundles
 * persistent failures for morning review with Claude.ai.
 * 
 * Process:
 * 1. Run smoke tests
 * 2. For each failing spec:
 *    - Attempt fix (up to 3 times)
 *    - If still failing, bundle for escalation
 * 3. Create zip with problem files + errors (max 12 components)
 * 
 * Usage:
 *   npx ts-node scripts/nightly-smoke-runner.ts
 *   npx ts-node scripts/nightly-smoke-runner.ts --max-components=6
 *   npx ts-node scripts/nightly-smoke-runner.ts --skip-fixes
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawnSync } from 'child_process';

// ============================================================================
// Configuration
// ============================================================================

interface Config {
  srcDir: string;
  maxComponents: number;
  maxAttempts: number;
  outputDir: string;
  skipFixes: boolean;
  verbose: boolean;
}

interface TestFailure {
  specFile: string;
  componentFile: string;
  testName: string;
  errorMessage: string;
  consoleErrors: string[];
  attempts: number;
  fixed: boolean;
}

interface EscalationBundle {
  specFile: string;
  componentFile: string;
  relatedFiles: string[];
  errors: string[];
  attempts: FixAttempt[];
}

interface FixAttempt {
  attemptNumber: number;
  strategy: string;
  result: 'success' | 'failed';
  errorAfter: string;
}

// ============================================================================
// Test Runner
// ============================================================================

function runSmokeTests(config: Config): { output: string; failures: TestFailure[] } {
  console.log('🧪 Running smoke tests...\n');
  
  const result = spawnSync('npx', [
    'ng', 'test',
    '--watch=false',
    '--browsers=ChromeHeadless',
    '--reporters=json',
    '--grep=SMOKE'
  ], {
    encoding: 'utf-8',
    shell: true,
    timeout: 600000, // 10 minutes
    maxBuffer: 50 * 1024 * 1024, // 50MB
  });

  const output = result.stdout + result.stderr;
  const failures = parseTestFailures(output, config);
  
  return { output, failures };
}

function parseTestFailures(output: string, config: Config): TestFailure[] {
  const failures: TestFailure[] = [];
  
  // Parse Karma/Jasmine output for failures
  // Pattern: "Chrome Headless X.X FAILED"
  // Then extract spec file and error details
  
  const failureBlocks = output.split(/(?=FAILED|Failed:)/);
  
  for (const block of failureBlocks) {
    if (!block.includes('FAILED') && !block.includes('Failed:')) continue;
    
    // Extract spec file path
    const specMatch = block.match(/([^\s]+\.spec\.ts)/);
    if (!specMatch) continue;
    
    const specFile = findSpecFile(specMatch[1], config.srcDir);
    if (!specFile) continue;
    
    // Extract test name
    const testNameMatch = block.match(/(?:FAILED|Failed:)\s*(.+?)(?:\n|$)/);
    const testName = testNameMatch ? testNameMatch[1].trim() : 'Unknown test';
    
    // Extract error message
    const errorMatch = block.match(/Error:\s*(.+?)(?:\n\s+at|\n\n|$)/s);
    const errorMessage = errorMatch ? errorMatch[1].trim() : block.slice(0, 500);
    
    // Extract console errors (from our tracker)
    const consoleErrors = extractConsoleErrors(block);
    
    // Derive component file from spec file
    const componentFile = specFile.replace('.spec.ts', '.ts');
    
    // Check if we already have this spec
    const existing = failures.find(f => f.specFile === specFile);
    if (existing) {
      existing.consoleErrors.push(...consoleErrors);
      continue;
    }
    
    failures.push({
      specFile,
      componentFile,
      testName,
      errorMessage,
      consoleErrors,
      attempts: 0,
      fixed: false,
    });
  }
  
  return failures;
}

function findSpecFile(partialPath: string, srcDir: string): string | null {
  // Try to find the full path to the spec file
  const fileName = path.basename(partialPath);
  
  function searchDir(dir: string): string | null {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !['node_modules', 'dist'].includes(entry.name)) {
        const found = searchDir(fullPath);
        if (found) return found;
      } else if (entry.name === fileName) {
        return fullPath;
      }
    }
    
    return null;
  }
  
  return searchDir(srcDir);
}

function extractConsoleErrors(block: string): string[] {
  const errors: string[] = [];
  
  // Match patterns from our ConsoleErrorTracker output
  const trackerMatch = block.match(/Console errors detected during test:([\s\S]*?)(?=\n\n|\nâœ—|\nâœ"|$)/);
  if (trackerMatch) {
    const lines = trackerMatch[1].split('\n');
    for (const line of lines) {
      const errorLine = line.match(/[âœ—â š]\s*(.+)/);
      if (errorLine) {
        errors.push(errorLine[1].trim());
      }
    }
  }
  
  // Also catch raw console errors
  const consoleMatch = block.matchAll(/console\.error[:\s]+(.+?)(?:\n|$)/g);
  for (const match of consoleMatch) {
    errors.push(match[1].trim());
  }
  
  return errors;
}

// ============================================================================
// Auto-Fix Strategies
// ============================================================================

interface FixStrategy {
  name: string;
  applies: (failure: TestFailure, specContent: string) => boolean;
  apply: (failure: TestFailure, specContent: string) => string;
}

const fixStrategies: FixStrategy[] = [
  {
    name: 'Add missing fakeAsync import',
    applies: (f, content) => 
      f.errorMessage.includes('fakeAsync') && 
      !content.includes("import { fakeAsync"),
    apply: (f, content) => {
      // Add fakeAsync to existing import or create new one
      if (content.includes("from '@angular/core/testing'")) {
        return content.replace(
          /(import\s*{\s*)([^}]+)(}\s*from\s*'@angular\/core\/testing')/,
          (match, p1, p2, p3) => {
            if (!p2.includes('fakeAsync')) {
              return `${p1}${p2.trim()}, fakeAsync, tick${p3}`;
            }
            return match;
          }
        );
      }
      return content;
    }
  },
  {
    name: 'Add missing tick import',
    applies: (f, content) => 
      f.errorMessage.includes('tick') && 
      content.includes('fakeAsync') &&
      !content.includes('tick'),
    apply: (f, content) => {
      return content.replace(
        /(import\s*{[^}]*fakeAsync)([^}]*}\s*from\s*'@angular\/core\/testing')/,
        '$1, tick$2'
      );
    }
  },
  {
    name: 'Add missing of import from rxjs',
    applies: (f, content) => 
      (f.errorMessage.includes("'of' is not defined") || 
       f.errorMessage.includes('of is not defined')) &&
      !content.includes("from 'rxjs'"),
    apply: (f, content) => {
      const importLine = "import { of } from 'rxjs';\n";
      // Add after last import
      const lastImportIndex = content.lastIndexOf('import ');
      const lineEnd = content.indexOf('\n', lastImportIndex);
      return content.slice(0, lineEnd + 1) + importLine + content.slice(lineEnd + 1);
    }
  },
  {
    name: 'Fix missing detectChanges after async',
    applies: (f, content) => 
      f.errorMessage.includes('fixture.detectChanges') ||
      f.consoleErrors.some(e => e.includes('ExpressionChanged')),
    apply: (f, content) => {
      // Add detectChanges after tick() calls that don't have it
      return content.replace(
        /tick\(\);\s*\n(\s*)(?!fixture\.detectChanges)/g,
        'tick();\n$1fixture.detectChanges();\n$1'
      );
    }
  },
  {
    name: 'Add waitForAsync wrapper',
    applies: (f, content) => 
      f.errorMessage.includes('async') &&
      f.errorMessage.includes('Promise'),
    apply: (f, content) => {
      // This is a placeholder - real implementation would be more complex
      return content;
    }
  },
  {
    name: 'Fix tracker not stopped',
    applies: (f, content) => 
      f.errorMessage.includes('tracker') &&
      !content.includes('tracker.stop()'),
    apply: (f, content) => {
      // Add tracker.stop() to afterEach if missing
      if (content.includes('afterEach') && !content.includes('tracker.stop()')) {
        return content.replace(
          /(afterEach\s*\(\s*\(\)\s*=>\s*{)/,
          '$1\n    tracker.stop();'
        );
      }
      return content;
    }
  },
];

function attemptFix(failure: TestFailure, config: Config): FixAttempt {
  const attempt: FixAttempt = {
    attemptNumber: failure.attempts + 1,
    strategy: 'none',
    result: 'failed',
    errorAfter: '',
  };

  if (!fs.existsSync(failure.specFile)) {
    attempt.errorAfter = 'Spec file not found';
    return attempt;
  }

  const originalContent = fs.readFileSync(failure.specFile, 'utf-8');
  let modifiedContent = originalContent;
  const appliedStrategies: string[] = [];

  // Try each applicable strategy
  for (const strategy of fixStrategies) {
    if (strategy.applies(failure, modifiedContent)) {
      const newContent = strategy.apply(failure, modifiedContent);
      if (newContent !== modifiedContent) {
        modifiedContent = newContent;
        appliedStrategies.push(strategy.name);
      }
    }
  }

  if (appliedStrategies.length === 0) {
    attempt.strategy = 'No applicable fix found';
    attempt.errorAfter = failure.errorMessage;
    return attempt;
  }

  attempt.strategy = appliedStrategies.join(', ');

  // Write modified file
  fs.writeFileSync(failure.specFile, modifiedContent);

  // Re-run just this test
  const testResult = runSingleTest(failure.specFile);
  
  if (testResult.success) {
    attempt.result = 'success';
    failure.fixed = true;
  } else {
    attempt.result = 'failed';
    attempt.errorAfter = testResult.error;
    // Restore original file
    fs.writeFileSync(failure.specFile, originalContent);
  }

  return attempt;
}

function runSingleTest(specFile: string): { success: boolean; error: string } {
  const relativePath = path.relative(process.cwd(), specFile);
  
  const result = spawnSync('npx', [
    'ng', 'test',
    '--watch=false',
    '--browsers=ChromeHeadless',
    `--include=${relativePath}`,
    '--grep=SMOKE'
  ], {
    encoding: 'utf-8',
    shell: true,
    timeout: 120000, // 2 minutes for single test
  });

  const output = result.stdout + result.stderr;
  const success = !output.includes('FAILED') && !output.includes('Failed:');
  
  // Extract error if failed
  let error = '';
  if (!success) {
    const errorMatch = output.match(/Error:\s*(.+?)(?:\n\s+at|\n\n|$)/s);
    error = errorMatch ? errorMatch[1].trim() : 'Unknown error';
  }

  return { success, error };
}

// ============================================================================
// Escalation Bundle Creation
// ============================================================================

function createEscalationBundle(failure: TestFailure, attempts: FixAttempt[]): EscalationBundle {
  const bundle: EscalationBundle = {
    specFile: failure.specFile,
    componentFile: failure.componentFile,
    relatedFiles: [],
    errors: [failure.errorMessage, ...failure.consoleErrors],
    attempts,
  };

  // Find related files (template, styles, service)
  const baseName = path.basename(failure.componentFile, '.ts');
  const dir = path.dirname(failure.componentFile);
  
  const possibleRelated = [
    `${baseName}.html`,
    `${baseName}.scss`,
    `${baseName}.css`,
    `${baseName}.module.ts`,
  ];

  for (const fileName of possibleRelated) {
    const filePath = path.join(dir, fileName);
    if (fs.existsSync(filePath)) {
      bundle.relatedFiles.push(filePath);
    }
  }

  // Look for service imports in the component
  if (fs.existsSync(failure.componentFile)) {
    const content = fs.readFileSync(failure.componentFile, 'utf-8');
    const serviceMatches = content.matchAll(/from\s*['"](.+\.service)['"]/g);
    for (const match of serviceMatches) {
      const servicePath = resolveImportPath(dir, match[1]);
      if (servicePath && fs.existsSync(servicePath)) {
        bundle.relatedFiles.push(servicePath);
      }
    }
  }

  return bundle;
}

function resolveImportPath(fromDir: string, importPath: string): string | null {
  // Resolve relative import to absolute path
  if (importPath.startsWith('.')) {
    const resolved = path.resolve(fromDir, importPath + '.ts');
    return fs.existsSync(resolved) ? resolved : null;
  }
  // For non-relative imports, we'd need tsconfig paths - skip for now
  return null;
}

function createEscalationZip(bundles: EscalationBundle[], config: Config): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const outputDir = path.join(config.outputDir, `escalation-${timestamp}`);
  
  // Create output directory
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  // Create summary file
  const summary = createEscalationSummary(bundles);
  fs.writeFileSync(path.join(outputDir, 'SUMMARY.md'), summary);

  // Copy files for each bundle
  for (let i = 0; i < bundles.length; i++) {
    const bundle = bundles[i];
    const bundleDir = path.join(outputDir, `component-${i + 1}`);
    fs.mkdirSync(bundleDir, { recursive: true });

    // Copy spec file
    if (fs.existsSync(bundle.specFile)) {
      fs.copyFileSync(
        bundle.specFile,
        path.join(bundleDir, path.basename(bundle.specFile))
      );
    }

    // Copy component file
    if (fs.existsSync(bundle.componentFile)) {
      fs.copyFileSync(
        bundle.componentFile,
        path.join(bundleDir, path.basename(bundle.componentFile))
      );
    }

    // Copy related files
    for (const relatedFile of bundle.relatedFiles) {
      if (fs.existsSync(relatedFile)) {
        fs.copyFileSync(
          relatedFile,
          path.join(bundleDir, path.basename(relatedFile))
        );
      }
    }

    // Create error details file
    const errorDetails = createErrorDetails(bundle, i + 1);
    fs.writeFileSync(path.join(bundleDir, 'ERRORS.md'), errorDetails);
  }

  // Create zip
  const zipPath = `${outputDir}.zip`;
  execSync(`cd "${config.outputDir}" && zip -r "${path.basename(zipPath)}" "${path.basename(outputDir)}"`);
  
  // Clean up directory, keep zip
  fs.rmSync(outputDir, { recursive: true });

  return zipPath;
}

function createEscalationSummary(bundles: EscalationBundle[]): string {
  const lines = [
    '# Smoke Test Escalation Bundle',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `## Summary`,
    '',
    `Total components needing help: ${bundles.length}`,
    '',
    '## Components',
    '',
  ];

  for (let i = 0; i < bundles.length; i++) {
    const bundle = bundles[i];
    const componentName = path.basename(bundle.componentFile, '.ts');
    
    lines.push(`### ${i + 1}. ${componentName}`);
    lines.push('');
    lines.push(`- Spec: \`${path.basename(bundle.specFile)}\``);
    lines.push(`- Component: \`${path.basename(bundle.componentFile)}\``);
    lines.push(`- Related files: ${bundle.relatedFiles.length}`);
    lines.push(`- Auto-fix attempts: ${bundle.attempts.length}`);
    lines.push('');
    lines.push('**Primary Error:**');
    lines.push('```');
    lines.push(bundle.errors[0]?.slice(0, 300) || 'Unknown');
    lines.push('```');
    lines.push('');
  }

  lines.push('## Instructions for Claude.ai');
  lines.push('');
  lines.push('For each component folder:');
  lines.push('1. Read ERRORS.md to understand what failed');
  lines.push('2. Review the spec file and component file');
  lines.push('3. Identify what mocks or setup are missing');
  lines.push('4. Suggest fixes for the smoke tests');
  lines.push('');
  lines.push('Focus on:');
  lines.push('- Missing mock providers');
  lines.push('- Missing @Input() setup');
  lines.push('- Async timing issues');
  lines.push('- Template binding errors');

  return lines.join('\n');
}

function createErrorDetails(bundle: EscalationBundle, index: number): string {
  const lines = [
    `# Component ${index}: ${path.basename(bundle.componentFile, '.ts')}`,
    '',
    '## Files Included',
    '',
    `- ${path.basename(bundle.specFile)}`,
    `- ${path.basename(bundle.componentFile)}`,
    ...bundle.relatedFiles.map(f => `- ${path.basename(f)}`),
    '',
    '## Errors',
    '',
  ];

  for (const error of bundle.errors) {
    lines.push('```');
    lines.push(error);
    lines.push('```');
    lines.push('');
  }

  lines.push('## Auto-Fix Attempts');
  lines.push('');

  for (const attempt of bundle.attempts) {
    lines.push(`### Attempt ${attempt.attemptNumber}`);
    lines.push(`- Strategy: ${attempt.strategy}`);
    lines.push(`- Result: ${attempt.result}`);
    if (attempt.errorAfter) {
      lines.push('- Error after:');
      lines.push('```');
      lines.push(attempt.errorAfter.slice(0, 500));
      lines.push('```');
    }
    lines.push('');
  }

  lines.push('## What to Fix');
  lines.push('');
  lines.push('Based on the errors above, this test needs:');
  lines.push('');
  lines.push('- [ ] _Fill in based on error analysis_');
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// Main Execution
// ============================================================================

function parseArgs(): Config {
  const args = process.argv.slice(2);
  const config: Config = {
    srcDir: './src',
    maxComponents: 12,
    maxAttempts: 3,
    outputDir: './test-escalations',
    skipFixes: false,
    verbose: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--src=')) {
      config.srcDir = arg.slice(6);
    } else if (arg.startsWith('--max-components=')) {
      config.maxComponents = parseInt(arg.slice(17), 10);
    } else if (arg.startsWith('--max-attempts=')) {
      config.maxAttempts = parseInt(arg.slice(15), 10);
    } else if (arg.startsWith('--output=')) {
      config.outputDir = arg.slice(9);
    } else if (arg === '--skip-fixes') {
      config.skipFixes = true;
    } else if (arg === '--verbose') {
      config.verbose = true;
    }
  }

  return config;
}

async function main(): Promise<void> {
  const config = parseArgs();
  
  console.log('🌙 Nightly Smoke Test Runner');
  console.log('============================\n');
  console.log(`Max components to escalate: ${config.maxComponents}`);
  console.log(`Max fix attempts per component: ${config.maxAttempts}`);
  console.log(`Skip auto-fixes: ${config.skipFixes}`);
  console.log('');

  // Ensure output directory exists
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  // Run initial smoke tests
  const { output, failures } = runSmokeTests(config);
  
  console.log(`\n📊 Initial Results:`);
  console.log(`   Total failures: ${failures.length}`);
  console.log('');

  if (failures.length === 0) {
    console.log('✅ All smoke tests passing! Nothing to escalate.');
    return;
  }

  // Process failures
  const escalationBundles: EscalationBundle[] = [];
  const allAttempts: Map<string, FixAttempt[]> = new Map();

  for (const failure of failures) {
    if (escalationBundles.length >= config.maxComponents) {
      console.log(`\n⚠️  Reached max components (${config.maxComponents}). Remaining failures will be processed next run.`);
      break;
    }

    console.log(`\n🔧 Processing: ${path.basename(failure.specFile)}`);
    
    const attempts: FixAttempt[] = [];
    
    if (!config.skipFixes) {
      // Try to fix up to maxAttempts times
      for (let i = 0; i < config.maxAttempts && !failure.fixed; i++) {
        console.log(`   Attempt ${i + 1}/${config.maxAttempts}...`);
        
        const attempt = attemptFix(failure, config);
        attempts.push(attempt);
        failure.attempts++;
        
        if (attempt.result === 'success') {
          console.log(`   ✅ Fixed with: ${attempt.strategy}`);
        } else {
          console.log(`   ❌ ${attempt.strategy}: ${attempt.errorAfter.slice(0, 100)}`);
        }
      }
    }

    // If still not fixed, add to escalation
    if (!failure.fixed) {
      console.log(`   📦 Adding to escalation bundle`);
      const bundle = createEscalationBundle(failure, attempts);
      escalationBundles.push(bundle);
      allAttempts.set(failure.specFile, attempts);
    }
  }

  // Create escalation zip if there are failures to escalate
  if (escalationBundles.length > 0) {
    console.log('\n📦 Creating escalation bundle...');
    const zipPath = createEscalationZip(escalationBundles, config);
    
    console.log('\n============================');
    console.log('📋 NIGHTLY RUN COMPLETE');
    console.log('============================\n');
    console.log(`Total failures: ${failures.length}`);
    console.log(`Auto-fixed: ${failures.filter(f => f.fixed).length}`);
    console.log(`Escalated: ${escalationBundles.length}`);
    console.log(`Remaining (for next run): ${failures.length - failures.filter(f => f.fixed).length - escalationBundles.length}`);
    console.log('');
    console.log(`📁 Escalation bundle: ${zipPath}`);
    console.log('');
    console.log('☀️  In the morning, upload this zip to Claude.ai for test design help.');
  } else {
    console.log('\n✅ All failures were auto-fixed! No escalation needed.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
