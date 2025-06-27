import validator from 'validator';
import xss from 'xss';

// Helper for text fields (escape + trim)
function cleanText(value: string | undefined): string {
  return validator.escape(validator.trim(value || ''));
}

// Helper for email fields
function cleanEmail(email: string | undefined): string {
  const trimmed = validator.trim(email || '');
  return validator.isEmail(trimmed) ? trimmed : '';
}

// Helper for optional rich text (e.g. help text)
function cleanRichText(value: string | undefined): string {
  return xss(value || '');
}

// Helper for optional rich text (e.g. help text)
function cleanBoolean(value: boolean | string | undefined): boolean {
  return value === true || value === 'true' ? true : false;
}

export default async function sanitizeFormConfig(rawConfig: any): Promise<any> {
  return {
    metadata: {
      version: cleanRichText(rawConfig.metadata?.version),
      clinic: {
        name: cleanRichText(rawConfig.metadata?.clinic?.name),
        email: cleanEmail(rawConfig.metadata?.clinic?.email),
        phone: cleanRichText(rawConfig.metadata?.clinic?.phone),
      },
    },
    steps: Array.isArray(rawConfig.steps)
      ? rawConfig.steps.map((step: any) => ({
          id: cleanRichText(step.id),
          title: cleanRichText(step.title),
          icon: cleanText(step.icon),
          fields: Array.isArray(step.fields)
            ? step.fields.map((field: any) => ({
                ...field,
                label: cleanRichText(field.label),
                name: cleanRichText(field.name),
                type: cleanRichText(field.name),
                required: cleanBoolean(field.required),
                options: Array.isArray(field.options)
                  ? field.options.map((option: any) => ({
                      value: cleanRichText(option.value),
                      label: cleanRichText(option.label),
                    }))
                  : [],
                guidance: cleanRichText(field.guidance),
              }))
            : [],
        }))
      : [],
  };
}

