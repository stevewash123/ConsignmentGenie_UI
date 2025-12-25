#!/bin/bash

# Fix HttpClient testing anti-patterns in service specs
# Convert from mocking HttpClient to using HttpClientTestingModule

echo "🔧 Fixing HttpClient testing patterns..."

# Find all service spec files
find . -name "*.service.spec.ts" | while read file; do
    echo "Processing: $file"

    # Skip if already uses HttpClientTestingModule
    if grep -q "HttpClientTestingModule" "$file"; then
        echo "  ✅ Already uses HttpClientTestingModule"
        continue
    fi

    # Skip if doesn't use HttpClient mocking
    if ! grep -q "provide.*HttpClient.*useValue" "$file"; then
        echo "  ⏭️  No HttpClient mocking found"
        continue
    fi

    echo "  🔄 Converting to HttpClientTestingModule pattern"

    # Create backup
    cp "$file" "$file.bak"

    # Replace imports
    sed -i 's/import { HttpClient } from .@angular\/common\/http./import { HttpClientTestingModule, HttpTestingController } from "@angular\/common\/http\/testing";/g' "$file"

    # Remove mockHttpClient declarations
    sed -i '/let mockHttpClient: jasmine\.SpyObj<HttpClient>;/d' "$file"
    sed -i '/mockHttpClient = jasmine\.createSpyObj/,/);/d' "$file"

    # Replace TestBed configuration
    sed -i 's/{ provide: HttpClient, useValue: mockHttpClient }/\/\/ HttpClient provided by HttpClientTestingModule/g' "$file"
    sed -i '/providers: \[$/,/\]/ { /HttpClient provided by HttpClientTestingModule/ { N; s/,\s*$/\n/; } }' "$file"

    # Add HttpTestingController declaration
    sed -i 's/let service: .*/&\n  let httpTestingController: HttpTestingController;/' "$file"

    # Add imports and injection in beforeEach
    sed -i '/TestBed\.configureTestingModule/i\      imports: [HttpClientTestingModule],' "$file"
    sed -i '/service = TestBed\.inject/a\    httpTestingController = TestBed.inject(HttpTestingController);' "$file"

    echo "  ✅ Converted (backup created as $file.bak)"
done

echo "🎉 HttpClient testing patterns fixed!"
echo ""
echo "⚠️  NOTE: Test methods still need manual conversion from:"
echo "   mockHttpClient.get.and.returnValue(of(response))"
echo "   To:"
echo "   const req = httpTestingController.expectOne(url);"
echo "   req.flush(response);"
echo ""
echo "   And add afterEach cleanup:"
echo "   httpTestingController.verify();"