import xss from 'xss';
import validator from 'validator';

  type FieldType = 'string' | 'text' |'textarea' | 'number' | 'currency'| 'boolean' | 'date' | 'radio' | 'checkbox' | 'select' | 'textarea' | 'email' | 'tel';

  interface FieldSchema {
    name: string;
    type: FieldType;
    required?: boolean;
    label: String;
    critical?: boolean,
    guidance?: string;
    validation?: {
      rules?: string[];
    };
    options?: Array<{ value: string; label: string }>;
  }

  interface Step {
    id: string;
    title: string,
    critical: boolean,
    icon: string,
    guidance: string;
    fields: FieldSchema[];
  }

  interface FormConfig {
    steps: Step[];
  }

export function validateAndSanitizeForm(
    formData: Record<string, any>,
    formConfig: FormConfig
  ): Record<string, string> {
    const sanitizedData: Record<string, string> = {};

    for (const category of formConfig.steps) {
      for (const field of category.fields) {
      
        const value = formData[field.name];

        if (field.required && (value === undefined || value === null || value === '')) {
          throw new Error(`Field "${field.name}" is required.`);
        }

        if (!field.required && (value === undefined || value === null || value === '')) {
          sanitizedData[field.name] = '';
          continue;
        }

        const rawValue = typeof value === 'string' ? value.trim() : value;
        let sanitizedValue = '';

        switch (field.type) {
          case 'string':
          case 'text':
          case 'textarea':
          case 'radio':
            if (typeof rawValue !== 'string') {
              throw new Error(`Field "${field.name}" must be a string.`);
            }
            sanitizedValue = validator.escape(xss(rawValue));
            break;

          case 'number':
            const num = Number(rawValue);
            if (isNaN(num)) {
              throw new Error(`Field "${field.name}" must be a valid number.`);
            }
            sanitizedValue = String(num);
            break;

          case 'currency':
            const cur = Number(rawValue);
            if (isNaN(cur)) {
              throw new Error(`Field "${field.name}" must be a valid number.`);
            }
            sanitizedValue = String(cur);
            break;
          case 'select':
            if (typeof rawValue !== 'string' || !field.options?.some(option => option.value === rawValue)) {
              throw new Error(`Field "${field.name}" must be a valid option.`); 
            }
            sanitizedValue = rawValue;
            break;
          case 'checkbox':
            if (typeof rawValue !== 'boolean' && !Array.isArray(rawValue)) {
              throw new Error(`Field "${field.name}" must be a boolean or an array of values.`);
            }
            if (Array.isArray(rawValue)) {
              sanitizedValue = rawValue.map(val => validator.escape(xss(String(val)))).join(', ');
            } else {
              sanitizedValue = rawValue ? 'true' : 'false';
            }
            break;
          case 'radio':
            if (typeof rawValue !== 'string' || !field.options?.some(option => option .value === rawValue)) {
              throw new Error(`Field "${field.name}" must be a valid option.`);
            }
            sanitizedValue = rawValue;  
            break;
          case 'boolean':
            if (
              typeof rawValue === 'boolean' ||
              rawValue === 'true' ||
              rawValue === 'false'
            ) {
              sanitizedValue =
                rawValue === true || rawValue === 'true' ? 'true' : 'false';
            } else {
              throw new Error(`Field "${field.name}" must be a boolean.`);
            }
            break;

          case 'date':
            if (typeof rawValue !== 'string' || !validator.isISO8601(rawValue)) {
              throw new Error(`Field "${field.name}" must be a valid ISO 8601 date.`);
            }
            sanitizedValue = rawValue;
            break;
          
          case 'email':
            if (typeof rawValue !== 'string' || !validator.isEmail(rawValue)) {
              throw new Error(`Field "${field.name}" must be a valid email address.`);
            }
            sanitizedValue = validator.normalizeEmail(rawValue) || '';
            break;
          case 'tel':
            if (typeof rawValue !== 'string' || !validator.isMobilePhone(rawValue, 'any', { strictMode: false })) {
              throw new Error(`Field "${field.name}" must be a valid phone number.`);  
            }
            sanitizedValue = rawValue;
            break;
          default:
            throw new Error(`Unsupported type "${field.type}" for field "${field.name}".`);
        }

        sanitizedData[field.name] = sanitizedValue;
      }
    }

    return sanitizedData;
}