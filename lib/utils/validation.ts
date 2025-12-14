
// Simple phone validation without external library for now
// Will be enhanced with react-international-phone once API is confirmed

export interface ValidationErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface FormData {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Common postal code patterns for major countries
const postalCodePatterns: { [key: string]: RegExp } = {
  IN: /^\d{6}$/, // India
  US: /^\d{5}(-\d{4})?$/, // United States
  GB: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i, // United Kingdom
  CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, // Canada
  AU: /^\d{4}$/, // Australia
  DE: /^\d{5}$/, // Germany
  FR: /^\d{5}$/, // France
  IT: /^\d{5}$/, // Italy
  ES: /^\d{5}$/, // Spain
};

// Country names mapping
const countryNames: { [key: string]: string } = {
  'IN': 'India',
  'US': 'United States',
  'GB': 'United Kingdom',
  'CA': 'Canada',
  'AU': 'Australia',
  'DE': 'Germany',
  'FR': 'France',
  'IT': 'Italy',
  'ES': 'Spain',
  'JP': 'Japan',
  'CN': 'China',
  'BR': 'Brazil',
  'RU': 'Russia',
  'MX': 'Mexico',
  'KR': 'South Korea',
  'NL': 'Netherlands',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'BE': 'Belgium',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'HU': 'Hungary',
  'GR': 'Greece',
  'PT': 'Portugal',
  'IE': 'Ireland',
  'IS': 'Iceland',
  'LU': 'Luxembourg',
  'MT': 'Malta',
  'CY': 'Cyprus',
  'EE': 'Estonia',
  'LV': 'Latvia',
  'LT': 'Lithuania',
  'SK': 'Slovakia',
  'SI': 'Slovenia',
  'RO': 'Romania',
  'BG': 'Bulgaria',
  'HR': 'Croatia',
};

// Validate email format
export const validateEmail = (email: string): string | undefined => {
  if (!email || email.trim() === '') {
    return 'Email is required';
  }
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return undefined;
};


// Validate phone number with international formatting
export const validatePhone = (phone: string, country?: string): string | undefined => {
  if (!phone || phone.trim() === '') {
    return 'Phone number is required';
  }

  // Remove all non-digit characters except +
  const cleanedPhone = phone.replace(/[^\d+]/g, '');
  
  // Basic phone validation - should have at least 10 digits (international minimum)
  const phoneDigits = cleanedPhone.replace(/\D/g, '');
  
  if (phoneDigits.length < 10) {
    return 'Please enter a valid phone number';
  }

  // If country is specified, add basic validation
  if (country) {
    const countryCode = country.toUpperCase();
    
    // Add basic country-specific validation rules
    switch (countryCode) {
      case 'IN': // India
        if (!cleanedPhone.startsWith('+91') && !cleanedPhone.startsWith('91') && phoneDigits.length !== 10) {
          return `Phone number should be 10 digits or include +91 for ${countryNames[countryCode]}`;
        }
        break;
      case 'US': // United States
        if (!cleanedPhone.startsWith('+1') && !cleanedPhone.startsWith('1') && phoneDigits.length !== 10) {
          return `Phone number should be 10 digits or include +1 for ${countryNames[countryCode]}`;
        }
        break;
      case 'GB': // United Kingdom
        if (!cleanedPhone.startsWith('+44') && phoneDigits.length < 10) {
          return `Phone number should include +44 for ${countryNames[countryCode]}`;
        }
        break;
    }
  }

  return undefined;
};

// Validate required text fields
export const validateRequired = (value: string, fieldName: string): string | undefined => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  return undefined;
};


// Validate postal code based on country
export const validatePostalCode = (postalCode: string, country: string): string | undefined => {
  // CRITICAL: Always fail if postal code is empty
  if (!postalCode || postalCode.trim() === '') {
    return 'Postal code is required';
  }

  // For country names (e.g., "India"), find the corresponding country code
  const countryCode = Object.keys(countryNames).find(code => 
    countryNames[code].toLowerCase() === country.toLowerCase()
  ) || country.toUpperCase();

  const pattern = postalCodePatterns[countryCode];
  
  if (pattern && !pattern.test(postalCode.replace(/\s/g, ''))) {
    return `Please enter a valid postal code for ${country}`;
  }

  return undefined;
};

// Main validation function
export const validateCheckoutForm = (formData: FormData): ValidationResult => {
  const errors: ValidationErrors = {};

  // Validate full name
  const fullNameError = validateRequired(formData.fullName, 'Full name');
  if (fullNameError) errors.fullName = fullNameError;

  // Validate email
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  // Validate phone
  const phoneError = validatePhone(formData.phone, formData.country);
  if (phoneError) errors.phone = phoneError;

  // Validate address fields
  const addressLine1Error = validateRequired(formData.addressLine1, 'Address line 1');
  if (addressLine1Error) errors.addressLine1 = addressLine1Error;

  const cityError = validateRequired(formData.city, 'City');
  if (cityError) errors.city = cityError;

  const stateError = validateRequired(formData.state, 'State');
  if (stateError) errors.state = stateError;


  const countryError = validateRequired(formData.country, 'Country');
  if (countryError) errors.country = countryError;

  // Validate postal code
  const postalCodeError = validatePostalCode(formData.postalCode, formData.country);
  if (postalCodeError) errors.postalCode = postalCodeError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};


// Format phone number to E.164 format for Razorpay
export const formatPhoneToE164 = (phone: string): string => {
  // Simple E.164 formatting
  const cleanedPhone = phone.replace(/[^\d+]/g, '');
  
  // If already in E.164 format, return as is
  if (cleanedPhone.startsWith('+')) {
    return cleanedPhone;
  }
  
  // If it starts with country code but no +, add +
  if (cleanedPhone.length > 10) {
    return '+' + cleanedPhone;
  }
  
  // If it's just local number, assume +91 (India) for now
  return '+91' + cleanedPhone;
};

// Get country display name
export const getCountryDisplayName = (countryCode: string): string => {
  return countryNames[countryCode] || countryCode;
};
