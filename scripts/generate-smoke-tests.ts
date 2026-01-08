#!/usr/bin/env node

/**
 * Smoke Test Generator
 * 
 * Scans an Angular project for components, services, pipes, guards, etc.
 * that are missing spec files and generates smoke tests with console error tracking.
 * 
 * Usage:
 *   npx ts-node generate-smoke-tests.ts [options]
 * 
 * Options:
 *   --src=<path>       Source directory (default: ./src)
 *   --dry-run          Show what would be generated without creating files
 *   --verbose          Show detailed output
 *   --type=<type>      Only generate for specific type (component, service, pipe, guard, directive)
 *   --path=<pattern>   Only generate for paths matching pattern
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Configuration
// ============================================================================

interface Config {
  srcDir: string;
  dryRun: boolean;
  verbose: boolean;
  filterType: string | null;
  filterPath: string | null;
}

interface FileInfo {
  filePath: string;
  fileName: string;
  baseName: string;
  type: 'component' | 'service' | 'pipe' | 'guard' | 'directive' | 'resolver' | 'interceptor';
  className: string;
  specPath: string;
}

interface GenerationResult {
  generated: string[];
  skipped: string[];
  errors: string[];
}

// ============================================================================
// File Detection
// ============================================================================

const FILE_PATTERNS: Record<string, RegExp> = {
  component: /\.component\.ts$/,
  service: /\.service\.ts$/,
  pipe: /\.pipe\.ts$/,
  guard: /\.guard\.ts$/,
  directive: /\.directive\.ts$/,
  resolver: /\.resolver\.ts$/,
  interceptor: /\.interceptor\.ts$/,
};

function detectFileType(fileName: string): FileInfo['type'] | null {
  for (const [type, pattern] of Object.entries(FILE_PATTERNS)) {
    if (pattern.test(fileName)) {
      return type as FileInfo['type'];
    }
  }
  return null;
}

function toClassName(baseName: string, type: string): string {
  // Convert kebab-case to PascalCase
  const pascal = baseName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  // Add type suffix
  const typeSuffix = type.charAt(0).toUpperCase() + type.slice(1);
  return pascal + typeSuffix;
}

function findAngularFiles(dir: string, config: Config): FileInfo[] {
  const files: FileInfo[] = [];
  
  function scan(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and other non-source directories
        if (!['node_modules', 'dist', 'coverage', '.git', 'e2e'].includes(entry.name)) {
          scan(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        // Skip spec files and test files
        if (entry.name.includes('.spec.') || entry.name.includes('.test.')) {
          continue;
        }
        
        const type = detectFileType(entry.name);
        if (!type) continue;
        
        // Apply type filter
        if (config.filterType && type !== config.filterType) continue;
        
        // Apply path filter
        if (config.filterPath && !fullPath.includes(config.filterPath)) continue;
        
        // Extract base name (e.g., "item-list" from "item-list.component.ts")
        const baseName = entry.name.replace(/\.(component|service|pipe|guard|directive|resolver|interceptor)\.ts$/, '');
        const className = toClassName(baseName, type);
        const specPath = fullPath.replace(/\.ts$/, '.spec.ts');
        
        files.push({
          filePath: fullPath,
          fileName: entry.name,
          baseName,
          type,
          className,
          specPath,
        });
      }
    }
  }
  
  scan(dir);
  return files;
}

function findMissingSpecs(files: FileInfo[]): FileInfo[] {
  return files.filter(file => !fs.existsSync(file.specPath));
}

// ============================================================================
// Template Generation
// ============================================================================

function generateComponentSpec(file: FileInfo): string {
  const relativePath = `./${file.baseName}.${file.type}`;
  
  return `import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ${file.className} } from '${relativePath}';
import { ConsoleErrorTracker } from '@testing/console-error-tracker';

/**
 * Smoke tests for ${file.className}
 * 
 * These tests verify that the component renders without console errors
 * in common states and after primary user actions.
 */
describe('${file.className}', () => {
  let tracker: ConsoleErrorTracker;

  beforeEach(() => {
    tracker = new ConsoleErrorTracker();
  });

  afterEach(() => {
    tracker.stop();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [${file.className}],
      providers: [
        // TODO: Add mock providers for dependencies
        // { provide: SomeService, useValue: mockSomeService },
      ],
    }).compileComponents();
  });

  describe('SMOKE', () => {
    it('should render with data without console errors', () => {
      tracker.start();
      
      const fixture = TestBed.createComponent(${file.className});
      const component = fixture.componentInstance;
      
      // TODO: Set up required @Input() properties
      // component.someInput = mockData;
      
      fixture.detectChanges();

      expect(component).toBeTruthy();
      tracker.expectNoErrors();
    });

    it('should handle primary action without console errors', fakeAsync(() => {
      tracker.start();
      
      const fixture = TestBed.createComponent(${file.className});
      const component = fixture.componentInstance;
      
      // TODO: Set up required @Input() properties
      // component.someInput = mockData;
      
      fixture.detectChanges();

      // TODO: Trigger primary action (e.g., save, filter, submit)
      // component.onSave();
      // - or -
      // const button = fixture.nativeElement.querySelector('button.primary');
      // button?.click();
      
      tick();
      fixture.detectChanges();

      tracker.expectNoErrors();
    }));
  });

  // TODO: Add additional smoke tests for other primary actions
  // Example: filter, sort, delete, navigation, etc.
});
`;
}

function generateServiceSpec(file: FileInfo): string {
  const relativePath = `./${file.baseName}.${file.type}`;
  
  return `import { TestBed } from '@angular/core/testing';
import { ${file.className} } from '${relativePath}';
import { ConsoleErrorTracker } from '@testing/console-error-tracker';

/**
 * Smoke tests for ${file.className}
 * 
 * These tests verify that the service can be instantiated and
 * primary methods execute without console errors.
 */
describe('${file.className}', () => {
  let service: ${file.className};
  let tracker: ConsoleErrorTracker;

  beforeEach(() => {
    tracker = new ConsoleErrorTracker();
    
    TestBed.configureTestingModule({
      providers: [
        ${file.className},
        // TODO: Add mock providers for dependencies
        // { provide: HttpClient, useValue: mockHttpClient },
      ],
    });
    
    service = TestBed.inject(${file.className});
  });

  afterEach(() => {
    tracker.stop();
  });

  describe('SMOKE', () => {
    it('should be created without console errors', () => {
      tracker.start();
      
      expect(service).toBeTruthy();
      
      tracker.expectNoErrors();
    });

    it('should execute primary method without console errors', () => {
      tracker.start();
      
      // TODO: Call the primary method
      // const result = service.getData();
      // expect(result).toBeDefined();
      
      tracker.expectNoErrors();
    });
  });
});
`;
}

function generatePipeSpec(file: FileInfo): string {
  const relativePath = `./${file.baseName}.${file.type}`;
  
  return `import { ${file.className} } from '${relativePath}';
import { ConsoleErrorTracker } from '@testing/console-error-tracker';

/**
 * Smoke tests for ${file.className}
 * 
 * These tests verify that the pipe transforms values without console errors
 * and handles edge cases (null, undefined) gracefully.
 */
describe('${file.className}', () => {
  let pipe: ${file.className};
  let tracker: ConsoleErrorTracker;

  beforeEach(() => {
    tracker = new ConsoleErrorTracker();
    pipe = new ${file.className}();
  });

  afterEach(() => {
    tracker.stop();
  });

  describe('SMOKE', () => {
    it('should transform value without console errors', () => {
      tracker.start();
      
      // TODO: Test with a typical value
      // const result = pipe.transform('test value');
      // expect(result).toBeDefined();
      
      expect(pipe).toBeTruthy();
      tracker.expectNoErrors();
    });

    it('should handle null/undefined without console errors', () => {
      tracker.start();
      
      // TODO: Verify null handling
      // const resultNull = pipe.transform(null);
      // const resultUndefined = pipe.transform(undefined);
      
      tracker.expectNoErrors();
    });
  });
});
`;
}

function generateGuardSpec(file: FileInfo): string {
  const relativePath = `./${file.baseName}.${file.type}`;
  
  return `import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ${file.className} } from '${relativePath}';
import { ConsoleErrorTracker } from '@testing/console-error-tracker';

/**
 * Smoke tests for ${file.className}
 * 
 * These tests verify that the guard executes without console errors
 * for both allow and deny scenarios.
 */
describe('${file.className}', () => {
  let guard: ${file.className};
  let tracker: ConsoleErrorTracker;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    tracker = new ConsoleErrorTracker();
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    TestBed.configureTestingModule({
      providers: [
        ${file.className},
        { provide: Router, useValue: mockRouter },
        // TODO: Add other mock providers
      ],
    });
    
    guard = TestBed.inject(${file.className});
  });

  afterEach(() => {
    tracker.stop();
  });

  describe('SMOKE', () => {
    it('should be created without console errors', () => {
      tracker.start();
      
      expect(guard).toBeTruthy();
      
      tracker.expectNoErrors();
    });

    it('should allow access without console errors', () => {
      tracker.start();
      
      // TODO: Set up conditions for allowed access
      // const result = guard.canActivate(mockRoute, mockState);
      // expect(result).toBe(true);
      
      tracker.expectNoErrors();
    });

    it('should deny access without console errors', () => {
      tracker.start();
      
      // TODO: Set up conditions for denied access
      // const result = guard.canActivate(mockRoute, mockState);
      // expect(result).toBe(false);
      
      tracker.expectNoErrors();
    });
  });
});
`;
}

function generateDirectiveSpec(file: FileInfo): string {
  const relativePath = `./${file.baseName}.${file.type}`;
  
  return `import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${file.className} } from '${relativePath}';
import { ConsoleErrorTracker } from '@testing/console-error-tracker';

/**
 * Test host component for ${file.className}
 */
@Component({
  template: \`<div ${file.baseName}>Test Content</div>\`,
  imports: [${file.className}],
  standalone: true,
})
class TestHostComponent {}

/**
 * Smoke tests for ${file.className}
 * 
 * These tests verify that the directive applies without console errors.
 */
describe('${file.className}', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let tracker: ConsoleErrorTracker;

  beforeEach(() => {
    tracker = new ConsoleErrorTracker();
  });

  afterEach(() => {
    tracker.stop();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, ${file.className}],
    }).compileComponents();
    
    fixture = TestBed.createComponent(TestHostComponent);
  });

  describe('SMOKE', () => {
    it('should apply to element without console errors', () => {
      tracker.start();
      
      fixture.detectChanges();
      
      const element = fixture.nativeElement.querySelector('[${file.baseName}]');
      expect(element).toBeTruthy();
      
      tracker.expectNoErrors();
    });
  });
});
`;
}

function generateResolverSpec(file: FileInfo): string {
  const relativePath = `./${file.baseName}.${file.type}`;
  
  return `import { TestBed } from '@angular/core/testing';
import { ${file.className} } from '${relativePath}';
import { ConsoleErrorTracker } from '@testing/console-error-tracker';

/**
 * Smoke tests for ${file.className}
 */
describe('${file.className}', () => {
  let resolver: ${file.className};
  let tracker: ConsoleErrorTracker;

  beforeEach(() => {
    tracker = new ConsoleErrorTracker();
    
    TestBed.configureTestingModule({
      providers: [
        ${file.className},
        // TODO: Add mock providers
      ],
    });
    
    resolver = TestBed.inject(${file.className});
  });

  afterEach(() => {
    tracker.stop();
  });

  describe('SMOKE', () => {
    it('should be created without console errors', () => {
      tracker.start();
      
      expect(resolver).toBeTruthy();
      
      tracker.expectNoErrors();
    });

    it('should resolve data without console errors', () => {
      tracker.start();
      
      // TODO: Test the resolve method
      // const result = resolver.resolve(mockRoute, mockState);
      
      tracker.expectNoErrors();
    });
  });
});
`;
}

function generateInterceptorSpec(file: FileInfo): string {
  const relativePath = `./${file.baseName}.${file.type}`;
  
  return `import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { of } from 'rxjs';
import { ${file.className} } from '${relativePath}';
import { ConsoleErrorTracker } from '@testing/console-error-tracker';

/**
 * Smoke tests for ${file.className}
 */
describe('${file.className}', () => {
  let interceptor: ${file.className};
  let tracker: ConsoleErrorTracker;
  let mockHandler: jasmine.SpyObj<HttpHandler>;

  beforeEach(() => {
    tracker = new ConsoleErrorTracker();
    mockHandler = jasmine.createSpyObj('HttpHandler', ['handle']);
    mockHandler.handle.and.returnValue(of({} as HttpEvent<any>));
    
    TestBed.configureTestingModule({
      providers: [
        ${file.className},
        // TODO: Add mock providers
      ],
    });
    
    interceptor = TestBed.inject(${file.className});
  });

  afterEach(() => {
    tracker.stop();
  });

  describe('SMOKE', () => {
    it('should be created without console errors', () => {
      tracker.start();
      
      expect(interceptor).toBeTruthy();
      
      tracker.expectNoErrors();
    });

    it('should intercept request without console errors', () => {
      tracker.start();
      
      const mockRequest = new HttpRequest('GET', '/api/test');
      interceptor.intercept(mockRequest, mockHandler);
      
      expect(mockHandler.handle).toHaveBeenCalled();
      tracker.expectNoErrors();
    });
  });
});
`;
}

function generateSpec(file: FileInfo): string {
  switch (file.type) {
    case 'component':
      return generateComponentSpec(file);
    case 'service':
      return generateServiceSpec(file);
    case 'pipe':
      return generatePipeSpec(file);
    case 'guard':
      return generateGuardSpec(file);
    case 'directive':
      return generateDirectiveSpec(file);
    case 'resolver':
      return generateResolverSpec(file);
    case 'interceptor':
      return generateInterceptorSpec(file);
    default:
      throw new Error(`Unknown file type: ${file.type}`);
  }
}

// ============================================================================
// Main Execution
// ============================================================================

function parseArgs(): Config {
  const args = process.argv.slice(2);
  const config: Config = {
    srcDir: './src',
    dryRun: false,
    verbose: false,
    filterType: null,
    filterPath: null,
  };
  
  for (const arg of args) {
    if (arg.startsWith('--src=')) {
      config.srcDir = arg.slice(6);
    } else if (arg === '--dry-run') {
      config.dryRun = true;
    } else if (arg === '--verbose') {
      config.verbose = true;
    } else if (arg.startsWith('--type=')) {
      config.filterType = arg.slice(7);
    } else if (arg.startsWith('--path=')) {
      config.filterPath = arg.slice(7);
    }
  }
  
  return config;
}

function main(): void {
  const config = parseArgs();
  
  console.log('🔍 Smoke Test Generator');
  console.log('========================\n');
  
  if (!fs.existsSync(config.srcDir)) {
    console.error(`❌ Source directory not found: ${config.srcDir}`);
    process.exit(1);
  }
  
  console.log(`Source directory: ${config.srcDir}`);
  console.log(`Dry run: ${config.dryRun}`);
  if (config.filterType) console.log(`Filter type: ${config.filterType}`);
  if (config.filterPath) console.log(`Filter path: ${config.filterPath}`);
  console.log('');
  
  // Find all Angular files
  console.log('Scanning for Angular files...');
  const allFiles = findAngularFiles(config.srcDir, config);
  console.log(`Found ${allFiles.length} Angular files\n`);
  
  // Find files missing specs
  const missingSpecs = findMissingSpecs(allFiles);
  console.log(`Missing spec files: ${missingSpecs.length}\n`);
  
  if (missingSpecs.length === 0) {
    console.log('✅ All files have spec files!');
    return;
  }
  
  // Group by type for summary
  const byType = missingSpecs.reduce((acc, file) => {
    acc[file.type] = (acc[file.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('Missing specs by type:');
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`);
  }
  console.log('');
  
  // Generate specs
  const result: GenerationResult = {
    generated: [],
    skipped: [],
    errors: [],
  };
  
  for (const file of missingSpecs) {
    try {
      const content = generateSpec(file);
      
      if (config.dryRun) {
        console.log(`[DRY RUN] Would create: ${file.specPath}`);
        if (config.verbose) {
          console.log('---');
          console.log(content.slice(0, 500) + '...');
          console.log('---\n');
        }
        result.generated.push(file.specPath);
      } else {
        fs.writeFileSync(file.specPath, content);
        console.log(`✅ Created: ${file.specPath}`);
        result.generated.push(file.specPath);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ Error generating ${file.specPath}: ${message}`);
      result.errors.push(file.specPath);
    }
  }
  
  // Summary
  console.log('\n========================');
  console.log('Summary:');
  console.log(`  Generated: ${result.generated.length}`);
  console.log(`  Skipped: ${result.skipped.length}`);
  console.log(`  Errors: ${result.errors.length}`);
  
  if (config.dryRun) {
    console.log('\n⚠️  This was a dry run. No files were created.');
    console.log('   Remove --dry-run to generate files.');
  } else {
    console.log('\n✅ Spec files generated!');
    console.log('\nNext steps:');
    console.log('  1. Review generated files and fill in TODO sections');
    console.log('  2. Add mock providers for dependencies');
    console.log('  3. Set up @Input() data for components');
    console.log('  4. Run: ng test -- --grep="SMOKE"');
  }
}

main();
