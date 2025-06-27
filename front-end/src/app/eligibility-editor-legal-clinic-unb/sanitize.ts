import validator from 'validator';
import xss from 'xss';

// Helper for text fields (escape + trim)
function cleanText(value: string | undefined): string {
  return validator.escape(validator.trim(value || ''));
}

// Sanitize the validation.rules array
function sanitizeValidation(validation: any) {
  return {
    rules: Array.isArray(validation?.rules)
      ? validation.rules.map(rule => cleanText(rule))
      : [],
  };
}

// Sanitize the options array
function sanitizeOptions(options: any[]) {
  return Array.isArray(options)
    ? options.map(opt => ({
        value: cleanText(opt.value),
        label: cleanText(opt.label),
      }))
    : [];
}
// Helper for email fields
function cleanEmail(email: string | undefined): string {
  const trimmed = validator.trim(email || '');
  return validator.isEmail(trimmed) ? trimmed : '';
}

function cleanBoolean(value: boolean | string | undefined): boolean {
  return value === true || value === 'true' ? true : false;
}

// Helper for optional rich text (e.g. help text)
function cleanRichText(value: string | undefined): string {
  return xss(value || '');
}

function cleanPhone(phone: string | undefined): string {
  const trimmed = validator.trim(phone || '');
  return validator.isMobilePhone(trimmed, 'any', { strictMode: false }) ? trimmed : '';
}

function cleanNumber(value: number | undefined): number | null {
  const str = String(value ?? '').trim();
  return validator.isNumeric(str) ? Number(str) : null;
}

export default async function sanitizeFormConfig(rawConfig: any): Promise<any> {
  return {
    CONSTANTS: {
        INCOME: {
            MIN_ANNUAL: cleanNumber(rawConfig.CONSTANTS?.INCOME?.MIN_ANNUAL),
            MAX_ANNUAL: cleanNumber(rawConfig.CONSTANTS?.INCOME?.MAX_ANNUAL),
            PER_DEPENDENT: cleanNumber(rawConfig.CONSTANTS?.INCOME?.MAX_ANNUAL),
        },
        AGE: {
            MIN: cleanNumber(rawConfig.CONSTANTS?.AGE?.MIN),
            MAX: cleanNumber(rawConfig.CONSTANTS?.AGE?.MAX),
        },
        HOUSEHOLD: {
            MAX_DEPENDENTS: cleanNumber(rawConfig.CONSTANTS?.HOUSEHOLD?.MAX_DEPENDENTS),
            MIN_SIZE: cleanNumber(rawConfig.CONSTANTS?.HOUSEHOLD?.MIN_SIZE),
            MAX_SIZE: cleanNumber(rawConfig.CONSTANTS?.HOUSEHOLD?.MAX_SIZE),
        },
    },
    MONTHLY_THRESHOLDS: Array.isArray(rawConfig?.MONTHLY_THRESHOLDS)
        ? rawConfig.MONTHLY_THRESHOLDS.map((threshold: any) => ({
            income: cleanNumber(threshold.income),
            assets: cleanNumber(threshold.assets)
        })) : [],
    RESOURCES: {
      Shelters: Array.isArray(rawConfig.RESOURCES?.Shelters)
        ? rawConfig.RESOURCES.Shelters.map((shelter: any) => ({
            name: cleanText(shelter.name),
            description: cleanText(shelter.description),
            location: cleanText(shelter.location),
            phoneNumber: cleanPhone(shelter.phoneNumber),
            category: cleanText(shelter.category)
        })) : [],
        Legal: Array.isArray(rawConfig.RESOURCES?.Legal)
        ? rawConfig.RESOURCES.Legal.map((legal: any) => ({
            name: cleanRichText(legal.name),
            description: cleanRichText(legal.description),
            location: cleanRichText(legal.location),
            phoneNumber: cleanPhone(legal.phoneNumber),
            email: cleanEmail(legal.email),
            matters: cleanRichText(legal.category),
            category: cleanText(legal.category)
        })) : [],
       Emergency: Array.isArray(rawConfig.RESOURCES?.emergency)
        ? rawConfig.RESOURCES.emergency.map((emergency: any) => ({
            name: cleanText(emergency.name),
            description: cleanText(emergency.description),
            location: cleanText(emergency.location),
            phoneNumber: cleanPhone(emergency.phoneNumber),
            email: cleanEmail(emergency.email),
            category: cleanText(emergency.category)
        })): [],
  },
    formConfig: {
      metadata: {
        version: cleanText(rawConfig.metadata?.version),
        lastUpdated: cleanText(rawConfig.metadata?.lastUpdated),
        clinic: {
          name: cleanText(rawConfig.metadata?.clinic?.name),
          phone: cleanEmail(rawConfig.metadata?.clinic?.phone),
          email: cleanEmail(rawConfig.metadata?.clinic?.email),
          address: cleanText(rawConfig.metadata?.clinic?.address),
        },
      },
      steps: Array.isArray(rawConfig.steps)
        ? rawConfig.steps.map((step: any) => ({
            id: cleanText(step.id),
            icon: cleanText(step.icon),
            fields: Array.isArray(step.fields)
              ? step.fields.map((field: any) => ({
                  ...field,
                  name: cleanText(field.name),
                  label: cleanText(field.label),
                  type: cleanText(field.type),
                  required: cleanBoolean(field.required),
                  validation: sanitizeValidation(field.validation),
                  options: sanitizeOptions(field.options),
                  guidance: cleanRichText(field.guidance),          
                }))
              : [],
          }))
        : [],
    }
  };
}
