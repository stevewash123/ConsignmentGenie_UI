#!/bin/bash

echo "🔍 Finding potentially unused components..."
echo "=========================================="

# Get all component files
components=$(find src/app -name "*.component.ts" -type f)
unused_count=0
total_count=0

for comp_file in $components; do
    total_count=$((total_count + 1))

    # Extract selector
    selector=$(grep -o "selector: *['\"][^'\"]*['\"]" "$comp_file" 2>/dev/null | cut -d"'" -f2 | cut -d'"' -f2)

    # Extract class name
    class_name=$(grep -o "export class [A-Z][a-zA-Z]*Component" "$comp_file" 2>/dev/null | cut -d' ' -f3)

    if [ -z "$selector" ]; then
        continue
    fi

    # Check if selector is used in any HTML template
    selector_used=$(find src/app -name "*.html" -exec grep -l "<$selector" {} \; 2>/dev/null | wc -l)

    # Check if class is imported anywhere else
    class_used=0
    if [ -n "$class_name" ]; then
        class_used=$(find src/app -name "*.ts" -not -path "$comp_file" -exec grep -l "$class_name" {} \; 2>/dev/null | wc -l)
    fi

    # If neither selector nor class is used
    if [ "$selector_used" -eq 0 ] && [ "$class_used" -eq 0 ]; then
        echo "❌ $comp_file"
        echo "   Selector: $selector"
        echo "   Class: $class_name"
        echo ""
        unused_count=$((unused_count + 1))
    fi
done

echo "📊 Results: $unused_count potentially unused out of $total_count total components"
echo ""
echo "⚠️  Note: This is a basic check. Manually verify before deletion:"
echo "   - Route components may not use selectors"
echo "   - Dynamic imports/lazy loading"
echo "   - Test-only usage"