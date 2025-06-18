// validationRules.js

// Import config for constants and resources
import configData from './formConfig.json';
const { CONSTANTS, RESOURCES } = configData;

export const validationRules = {
  // Emergency Assessment Validation Rules
  immediateRisk: (value, formData) => {
    if (value === "yes") {
      return {
        isValid: true,
        resources: RESOURCES.emergency,
        terminateIfInvalid: true
      };
    }
    return { isValid: true };
  },

  shelterNeeded: (value, formData) => {
    if (value === "yes") {
      const combinedResources = [
        ...(formData.immediateRisk === "yes" ? RESOURCES.emergency : []),
        ...RESOURCES.Shelters
      ];
      return {
        isValid: true,
        resources: combinedResources
      };
    }
    if (formData.immediateRisk === "yes") {
      return {
        isValid: true,
        resources: RESOURCES.emergency
      };
    }
    return { isValid: true };
  },

  // Demographic Information Validation Rules
  dateOfBirth: (value) => {
    if (!value) return { isValid: false, message: "Date of Birth is required" };
    
    const today = new Date();
    const birthDate = new Date(value);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return {
      isValid: age >= CONSTANTS.AGE.MIN && age <= CONSTANTS.AGE.MAX,
      message: `Age must be between ${CONSTANTS.AGE.MIN} and ${CONSTANTS.AGE.MAX} years`
    };
  },

  isInFuture: (value) => {    
    if (!value) return { isValid: true }
    const courtDate = new Date(value);
    const today = new Date();

    return {
      isValid: courtDate > today,
      message: `Date must be in the future`
    };
  },

  isInPast: (value) => {    
    if (!value) return { isValid: true }
    const courtDate = new Date(value);
    const today = new Date();

    return {
      isValid: courtDate < today,
      message: `Date must be in the past`
    };
  },

  postalCode: (value) => {
    const postalCodeRegex = /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/;
    return {
      isValid: postalCodeRegex.test(value),
      message: "Please enter a valid postal code in format 'A1A 1A1'"
    };
  },

  phoneNumber: (value) => {
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return {
      isValid: phoneRegex.test(value),
      message: "Please enter a valid phone number"
    };
  },

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(value),
      message: "Please enter a valid email address"
    };
  },

  // Financial Information Validation Rules
  totalMonthlyIncome: (value, formData) => {
    const totalIncome = parseFloat(value) || 0;
    const householdSize = parseInt(formData.householdSize) || 1;
    
    // Check against monthly thresholds
    const threshold = configData.MONTHLY_THRESHOLDS[householdSize] || 
                     configData.MONTHLY_THRESHOLDS[configData.CONSTANTS.HOUSEHOLD.MAX_SIZE];

    return {
      isValid: totalIncome <= threshold.income,
      message: `Total monthly income exceeds maximum threshold for household size of ${householdSize}`
    };
  },

  totalAssets: (value, formData) => {
    const totalAssets = parseFloat(value) || 0;
    const householdSize = parseInt(formData.householdSize) || 1;
    
    // Check against asset thresholds
    const threshold = configData.MONTHLY_THRESHOLDS[householdSize] || 
                     configData.MONTHLY_THRESHOLDS[configData.CONSTANTS.HOUSEHOLD.MAX_SIZE];

    return {
      isValid: totalAssets <= threshold.assets,
      message: `Total assets exceed maximum threshold for household size of ${householdSize}`
    };
  },

  // Document Submission Validation Rules
  documentsSubmitted: (value, formData) => {
    if (!value) {
      return {
        isValid: false,
        message: "You must confirm that you have submitted the required documents"
      };
    }
    return { isValid: true };
  },

  // Consent and Declaration Validation Rules
  intakeDisclaimer: (value) => ({
    isValid: value === "agree",
    message: "You must agree to the intake disclaimer to continue"
  }),

  emailCommunicationConsent: (value) => ({
    isValid: value === "accept",
    message: "You must accept email communication to continue"
  }),

  evaluationConsent: (value) => ({
    isValid: !!value,
    message: "You must consent to service evaluation to continue"
  }),

  informationDeclaration: (value) => ({
    isValid: !!value,
    message: "You must declare that the information provided is true and correct"
  }),

  // Legal Issue Validation Rules
  issueDescription: (value) => ({
    isValid: value && value.length >= 50,
    message: "Please provide a detailed description of at least 50 characters"
  }),

  opposingParties: (value) => ({
    isValid: !!value,
    message: "Please provide information about opposing parties or indicate if none"
  }),

  // Generic validation helper functions
  required: (value, fieldName) => ({
    isValid: !!value,
    message: `${fieldName} is required`
  }),

  minLength: (value, minLength) => ({
    isValid: value && value.length >= minLength,
    message: `Must be at least ${minLength} characters long`
  }),

  maxLength: (value, maxLength) => ({
    isValid: value && value.length <= maxLength,
    message: `Must not exceed ${maxLength} characters`
  }),

  numeric: (value) => ({
    isValid: !isNaN(value) && value >= 0,
    message: "Please enter a valid number"
  })
};

// Helper function to combine multiple validation rules
export const combineValidations = (rules) => (value, formData) => {
  for (const rule of rules) {
    const result = rule(value, formData);
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
};

// Export individual validation functions for reuse
export const {
  required,
  minLength,
  maxLength,
  numeric,
  email,
  phoneNumber,
  dateOfBirth,
  isInFuture,
  isInPast,
  postalCode
} = validationRules;