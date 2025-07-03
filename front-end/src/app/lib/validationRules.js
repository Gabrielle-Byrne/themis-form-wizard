export async function getValidationRules(CONSTANTS, RESOURCES) {
  return {
    immediateRisk: (value, formData) => {
      if (value === "yes") {
        return {
          isValid: true,
          resources: RESOURCES.emergency,
          terminateIfInvalid: true,
        };
      }
      return { isValid: true };
    },
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
    if (!value) return { isValid: false, message: "Date of Birth is required", messageFR: "La date de naissance est requise" };
    
    const today = new Date();
    const birthDate = new Date(value);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return {
      isValid: age >= CONSTANTS.AGE.MIN && age <= CONSTANTS.AGE.MAX,
      message: `Age must be between ${CONSTANTS.AGE.MIN} and ${CONSTANTS.AGE.MAX} years`,
      messageFR: `L'âge doit être compris entre ${CONSTANTS.AGE.MIN} et ${CONSTANTS.AGE.MAX} ans`
    };
  },

  isInFuture: (value) => {
    if (!value) return { isValid: true };
    const courtDate = new Date(value);
    const today = new Date();

    return {
      isValid: courtDate > today,
      message: `Date must be in the future`,
      messageFR: `La date doit être dans le futur`
    };
  },

  isInPast: (value) => {    
    if (!value) return { isValid: true };
    const courtDate = new Date(value);
    const today = new Date();

    return {
      isValid: courtDate < today,
      message: `Date must be in the past`,
      messageFR: `La date doit être dans le passé`
    };
  },

  postalCode: (value) => {
    const postalCodeRegex = /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/;
    return {
      isValid: postalCodeRegex.test(value),
      message: "Please enter a valid postal code in format 'A1A 1A1'",
      messageFR: "Veuillez entrer un code postal valide au format 'A1A 1A1'"
    };
  },

  phoneNumber: (value) => {
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return {
      isValid: phoneRegex.test(value),
      message: "Please enter a valid phone number",
      messageFR: "Veuillez entrer un numéro de téléphone valide"
    };
  },

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(value),
      message: "Please enter a valid email address",
      messageFR: "Veuillez entrer une adresse e-mail valide"
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
      message: `Total monthly income exceeds maximum threshold for household size of ${householdSize}`,
      messageFR: `Le revenu mensuel total dépasse le seuil maximum pour une taille de ménage de ${householdSize}`
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
      message: `Total assets exceed maximum threshold for household size of ${householdSize}`,
      messageFR: `Le total des actifs dépasse le seuil maximum pour une taille de ménage de ${householdSize}`
    };
  },

  // Document Submission Validation Rules
  documentsSubmitted: (value, formData) => {
    if (!value) {
      return {
        isValid: false,
        message: "You must confirm that you have submitted the required documents",
        messageFR: "Vous devez confirmer que vous avez soumis les documents requis"
      };
    }
    return { isValid: true };
  },

  // Consent and Declaration Validation Rules
  intakeDisclaimer: (value) => ({
    isValid: value === "agree",
    message: "You must agree to the intake disclaimer to continue",
    messageFR: "Vous devez accepter le disclaimer d'admission pour continuer"
  }),

  emailCommunicationConsent: (value) => ({
    isValid: value === "accept",
    message: "You must accept email communication to continue",
    messageFR: "Vous devez accepter la communication par e-mail pour continuer"
  }),

  evaluationConsent: (value) => ({
    isValid: !!value,
    message: "You must consent to service evaluation to continue",
    messageFR: "Vous devez consentir à l'évaluation du service pour continuer"
  }),

  informationDeclaration: (value) => ({
    isValid: !!value,
    message: "You must declare that the information provided is true and correct",
    messageFR: "Vous devez déclarer que les informations fournies sont vraies et correctes"
  }),

  // Legal Issue Validation Rules
  issueDescription: (value) => ({
    isValid: value && value.length >= 50,
    message: "Please provide a detailed description of at least 50 characters",
    messageFR: "Veuillez fournir une description détaillée d'au moins 50 caractères"
  }),

  opposingParties: (value) => ({
    isValid: !!value,
    message: "Please provide information about opposing parties or indicate if none",
    messageFR: "Veuillez fournir des informations sur les parties adverses ou indiquer si aucune"
  }),

  // Generic validation helper functions
  required: (value, fieldName) => ({
    isValid: !!value,
    message: `${fieldName} is required`,
    messageFR: `${fieldName} est requis`
  }),

  minLength: (value, minLength) => ({
    isValid: value && value.length >= minLength,
    message: `Must be at least ${minLength} characters long`,
    messageFR: `Doit comporter au moins ${minLength} caractères`
  }),

  maxLength: (value, maxLength) => ({
    isValid: value && value.length <= maxLength,
    message: `Must not exceed ${maxLength} characters`,
    messageFR: `Ne doit pas dépasser ${maxLength} caractères`
  }),

  numeric: (value) => ({
    isValid: !isNaN(value) && value >= 0,
    message: "Please enter a valid number",
    messageFR: "Veuillez entrer un nombre valide"
  })
  };
}

// Helper function to combine multiple validation rules
export const combineValidations = (rules) => (value, formData) => {
  for (const rule of rules) {
    const result = rule(value, formData);
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
}