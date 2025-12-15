# Consignment Agreement Template

This directory contains a professional consignment agreement template that can be used by consignment shops to establish formal agreements with consignors.

## Files

- `consignment-agreement-template.pdf` - The ready-to-use PDF template
- `consignment-agreement-template.html` - The HTML source file for the template
- `generate-pdf.sh` - Script to regenerate the PDF from the HTML source
- `README.md` - This documentation file

## Features

The consignment agreement template includes:

### Content Sections
- Professional header with agreement title
- Date field for agreement execution
- Shop information section (name, address, phone, email)
- Consignor information section (name, address, phone, email)
- Consignment terms (commission split, consignment period, unsold items policy)
- Comprehensive legal terms and conditions
- Signature section for both parties

### Design Features
- Print-friendly format for standard 8.5" x 11" letter size paper
- Professional typography using Times New Roman
- Clear section divisions and headers
- Underlined blank fields for hand-written information
- Checkboxes for policy selections
- Grid-based layout for organized information presentation

### Legal Terms Included
1. Consignment relationship definition
2. Item acceptance standards
3. Pricing and markdown policies
4. Payment terms and schedules
5. Liability and insurance clauses
6. Item retrieval requirements
7. Agreement termination conditions
8. Shop display rights
9. Record keeping requirements
10. Dispute resolution procedures

## Usage

### Using the PDF Template
1. Print the `consignment-agreement-template.pdf` file
2. Fill in the shop and consignor information by hand
3. Complete the consignment terms section
4. Select the appropriate unsold items policy
5. Have both parties sign and date the agreement

### Modifying the Template
1. Edit the `consignment-agreement-template.html` file to make changes
2. Run `./generate-pdf.sh` to create a new PDF
3. Alternatively, use Chrome to generate PDF manually:
   ```bash
   google-chrome --headless --disable-gpu --print-to-pdf=new-template.pdf --print-to-pdf-no-header file://$(pwd)/consignment-agreement-template.html
   ```

## Legal Disclaimer

This template is provided for general informational purposes only and should be reviewed by a qualified attorney before use. Laws vary by jurisdiction, and this template may need to be modified to comply with local regulations and specific business requirements.

## Customization Notes

The template is designed to be generic enough for any consignment shop while maintaining professional standards. Consider customizing:

- Shop-specific policies and procedures
- Local legal requirements
- Industry-specific terms
- Branding elements (logos, colors, fonts)
- Additional terms specific to your business model