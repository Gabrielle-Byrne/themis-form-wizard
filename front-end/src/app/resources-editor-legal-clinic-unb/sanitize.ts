import validator from 'validator';
import xss from 'xss';

function cleanText(value: string | undefined): string {
  return validator.escape(validator.trim(value || ''));
}

function cleanEmail(email: string | undefined): string {
  const trimmed = validator.trim(email || '');
  return validator.isEmail(trimmed) ? trimmed : '';
}

function cleanPhone(phone: string | undefined): string {
  const trimmed = validator.trim(phone || '');
  return validator.isMobilePhone(trimmed, 'any', { strictMode: false }) ? trimmed : '';
}

function cleanRichText(value: string | undefined): string {
  return xss(value || '');
}

export default async function sanitizeFormConfig(rawConfig: any): Promise<any> {
  return {
    steps: Array.isArray(rawConfig.steps)
      ? rawConfig.steps.map((step: any) => ({
          name: cleanText(step.name),
          icon: cleanText(step.icon),
          fields: Array.isArray(step.fields)
            ? step.fields.map((field: any) => ({
                ...field,
                name: cleanRichText(field.name),
                description: cleanRichText(field.description),
                location: cleanRichText(field.location),
                email: cleanEmail(field.email),
                website: cleanRichText(field.website),
                phoneNumber: cleanPhone(field.phoneNumber),
                notes: cleanRichText(field.notes),
                category: cleanRichText(field.category),
              }))
            : [],
        }))
      : [],
  };
}
