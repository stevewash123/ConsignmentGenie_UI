#!/bin/bash

echo "🔍 Finding components with no selector references and no route usage..."
echo "=================================================================="

# Get all component files
components=$(find src/app -name "*.component.ts" -type f)
unreferenced_count=0
total_count=0

# Get all route files for route checking
route_content=""
for route_file in $(find src/app -name "*.routes.ts" -o -name "*routing*.ts" -o -name "*routing*.module.ts" 2>/dev/null); do
    if [ -f "$route_file" ]; then
        route_content="$route_content$(cat "$route_file")"
    fi
done

for comp_file in $components; do
    total_count=$((total_count + 1))

    # Extract selector
    selector=$(grep -o "selector: *['\"][^'\"]*['\"]" "$comp_file" 2>/dev/null | sed "s/selector: *['\"]//; s/['\"]//")

    # Extract class name
    class_name=$(grep -o "export class [A-Z][a-zA-Z]*Component" "$comp_file" 2>/dev/null | cut -d' ' -f3)

    # Skip if no selector found
    if [ -z "$selector" ]; then
        continue
    fi

    # Check if selector is used in any HTML template
    selector_found=false
    if find src/app -name "*.html" -exec grep -l "<$selector" {} \; 2>/dev/null | grep -q .; then
        selector_found=true
    fi

    # Check if component is referenced in routes
    route_found=false
    if [ -n "$class_name" ] && echo "$route_content" | grep -q "$class_name"; then
        route_found=true
    fi

    # If selector is NOT used AND NOT in routes, it's potentially unused
    if [ "$selector_found" = false ] && [ "$route_found" = false ]; then
        echo "❌ $(basename "$comp_file")"
        echo "   Path: $comp_file"
        echo "   Selector: $selector"
        echo "   Class: $class_name"
        echo ""
        unreferenced_count=$((unreferenced_count + 1))
    fi
done

echo "📊 Results: $unreferenced_count unreferenced components out of $total_count total"
echo ""
echo "These components have:"
echo "  - No selector usage in HTML templates"
echo "  - No references in routing files"
echo ""
echo "⚠️  Still verify manually for:"
echo "  - Dynamic component loading"
echo "  - Lazy-loaded modules"
echo "  - Test-only usage"