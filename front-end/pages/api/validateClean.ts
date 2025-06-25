import validator from 'validator';
import xss from 'xss';

export function validateAndSanitizeInput(
  formData: Record<string, any>,
) {
  const fields: Array<{
    name: string;
    type: string;
    required?: boolean;
    options?: string[];
  }>
  const errors: Record<string, string> = {};
  const clean: Record<string, any> = {};

  for (const field of fields) {
    let value = formData[field.name];

    // Convert to string (if it's not an array or boolean)
    if (typeof value === 'string') {
      value = value.trim();
    }

    if (field.required && (value === undefined || value === '' || value === false)) {
      errors[field.name] = `${field.name} is required`;
      continue;
    }

    if (value !== undefined) {
      switch (field.type) {
        case 'email':
          if (!validator.isEmail(value)) {
            errors[field.name] = 'Invalid email';
            continue;
          }
          break;
        case 'checkbox':
          if (value !== true && value !== 'true') {
            errors[field.name] = 'This must be checked';
            continue;
          }
          value = true;
          break;
        case 'date':
          if (!validator.isDate(value, { format: 'YYYY-MM-DD', strictMode: true })) {
            errors[field.name] = 'Invalid date format';
          }
          break;
        case 'tel':
          if (!validator.isDate(value, { format: 'YYYY-MM-DD', strictMode: true })) {
            errors[field.name] = 'Invalid date format';
          }
          break;
        case 'number':
          if (!validator.isNumeric(value)) {
            errors[field.name] = 'Must be a number';
            continue;
          }
          break;
        case 'currency':
          if (!validator.isNumeric(value)) {
            errors[field.name] = 'Must be a number';
            continue;
          }
          break;
        case 'select':
        case 'radio':
          if (field.options && !field.options.includes(value)) {
            errors[field.name] = 'Invalid option selected';
            continue;
          }
          break;
        case 'checkbox':
          if (!Array.isArray(value)) {
            value = [value];
          }
          value = value.filter((v: string) => field.options?.includes(v));
          break;
      }

      // Sanitize
      if (typeof value === 'string') {
        value = xss(value);
        value = validator.escape(value);
      }

      clean[field.name] = value;
    }
  }

  return { clean, errors };
}