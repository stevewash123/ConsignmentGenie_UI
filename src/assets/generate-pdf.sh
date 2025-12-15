#!/bin/bash
# Script to generate consignment agreement PDF from HTML template

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
HTML_FILE="$SCRIPT_DIR/consignment-agreement-template.html"
PDF_FILE="$SCRIPT_DIR/consignment-agreement-template.pdf"

echo "Generating PDF from HTML template..."
echo "Input: $HTML_FILE"
echo "Output: $PDF_FILE"

google-chrome --headless --disable-gpu --print-to-pdf="$PDF_FILE" --print-to-pdf-no-header "file://$HTML_FILE"

if [ $? -eq 0 ]; then
    echo "PDF generated successfully!"
    echo "File size: $(wc -c < "$PDF_FILE") bytes"
else
    echo "Error generating PDF"
    exit 1
fi