/**
 * Phone formatting utility for consistent (xxx)xxx-xxxx format
 */
export class PhoneFormatter {
  /**
   * Format a phone number to (xxx)xxx-xxxx format
   * @param value Raw input value
   * @returns Formatted phone number
   */
  static formatPhone(value: string): string {
    if (!value) return '';

    // Remove all non-numeric characters
    const numericOnly = value.replace(/\D/g, '');

    // Don't format if we don't have enough digits
    if (numericOnly.length < 3) {
      return numericOnly;
    }

    // Apply formatting based on length
    if (numericOnly.length <= 3) {
      return `(${numericOnly}`;
    } else if (numericOnly.length <= 6) {
      return `(${numericOnly.slice(0, 3)})${numericOnly.slice(3)}`;
    } else {
      return `(${numericOnly.slice(0, 3)})${numericOnly.slice(3, 6)}-${numericOnly.slice(6, 10)}`;
    }
  }

  /**
   * Get the raw numeric value from a formatted phone number
   * @param formattedPhone Formatted phone number
   * @returns Raw numeric string
   */
  static getRawValue(formattedPhone: string): string {
    return formattedPhone ? formattedPhone.replace(/\D/g, '') : '';
  }

  /**
   * Validate if a phone number has the minimum required digits
   * @param phone Phone number (formatted or raw)
   * @returns True if valid (has 10 digits)
   */
  static isValid(phone: string): boolean {
    const numericOnly = this.getRawValue(phone);
    return numericOnly.length === 10;
  }

  /**
   * Handle input event and return formatted value
   * This maintains cursor position properly
   * @param event Input event
   * @returns Formatted phone value
   */
  static handlePhoneInput(event: Event): string {
    const input = event.target as HTMLInputElement;
    const cursorPosition = input.selectionStart || 0;
    const oldValue = input.value;
    const newValue = this.formatPhone(input.value);

    // Set the formatted value
    input.value = newValue;

    // Adjust cursor position to account for formatting characters
    let newCursorPosition = cursorPosition;

    // If we added formatting characters, adjust cursor position
    const oldLength = oldValue.length;
    const newLength = newValue.length;
    if (newLength > oldLength) {
      // We added characters, move cursor forward
      newCursorPosition += (newLength - oldLength);
    }

    // Set cursor position
    setTimeout(() => {
      input.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);

    return newValue;
  }
}