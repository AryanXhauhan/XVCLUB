import { Order } from '@/lib/types';

export interface TaxCalculation {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  taxBreakdown: TaxBreakdown;
}

export interface TaxBreakdown {
  cgst?: number; // Central GST (India)
  sgst?: number; // State GST (India)
  igst?: number; // Integrated GST (India - inter-state)
  vat?: number;  // VAT (International)
  gst?: number;  // GST (International)
  country?: string;
  state?: string;
  taxType: TaxType;
}

export enum TaxType {
  GST_INDIA = 'gst_india',
  VAT_INTERNATIONAL = 'vat_international',
  NO_TAX = 'no_tax'
}

export interface CountryTaxConfig {
  countryCode: string;
  countryName: string;
  taxRate: number;
  taxType: TaxType;
  stateRequired: boolean;
  taxLabel: string;
  registrationRequired?: boolean;
  threshold?: number; // Registration threshold in local currency
}

export interface StateTaxConfig {
  stateCode: string;
  stateName: string;
  countryCode: string;
  taxRate: number; // State tax rate for GST
  isUnionTerritory: boolean;
}

export class GlobalTaxService {
  private static readonly TAX_CONFIGS: CountryTaxConfig[] = [
    // India - GST
    {
      countryCode: 'IN',
      countryName: 'India',
      taxRate: 18, // 18% GST
      taxType: TaxType.GST_INDIA,
      stateRequired: true,
      taxLabel: 'GST'
    },
    
    // European Union - VAT
    {
      countryCode: 'DE',
      countryName: 'Germany',
      taxRate: 19, // 19% VAT
      taxType: TaxType.VAT_INTERNATIONAL,
      stateRequired: false,
      taxLabel: 'VAT'
    },
    {
      countryCode: 'FR',
      countryName: 'France',
      taxRate: 20, // 20% VAT
      taxType: TaxType.VAT_INTERNATIONAL,
      stateRequired: false,
      taxLabel: 'VAT'
    },
    {
      countryCode: 'GB',
      countryName: 'United Kingdom',
      taxRate: 20, // 20% VAT
      taxType: TaxType.VAT_INTERNATIONAL,
      stateRequired: false,
      taxLabel: 'VAT'
    },
    
    // United States - State Sales Tax
    {
      countryCode: 'US',
      countryName: 'United States',
      taxRate: 0, // Varies by state
      taxType: TaxType.VAT_INTERNATIONAL,
      stateRequired: true,
      taxLabel: 'Sales Tax'
    },
    
    // Australia - GST
    {
      countryCode: 'AU',
      countryName: 'Australia',
      taxRate: 10, // 10% GST
      taxType: TaxType.VAT_INTERNATIONAL,
      stateRequired: false,
      taxLabel: 'GST'
    },
    
    // Canada - HST/GST/PST
    {
      countryCode: 'CA',
      countryName: 'Canada',
      taxRate: 0, // Varies by province
      taxType: TaxType.VAT_INTERNATIONAL,
      stateRequired: true,
      taxLabel: 'HST/GST/PST'
    },
    
    // No tax countries
    {
      countryCode: 'AE',
      countryName: 'United Arab Emirates',
      taxRate: 0,
      taxType: TaxType.NO_TAX,
      stateRequired: false,
      taxLabel: 'Tax'
    },
    {
      countryCode: 'SA',
      countryName: 'Saudi Arabia',
      taxRate: 0,
      taxType: TaxType.NO_TAX,
      stateRequired: false,
      taxLabel: 'Tax'
    },
    {
      countryCode: 'SG',
      countryName: 'Singapore',
      taxRate: 0,
      taxType: TaxType.NO_TAX,
      stateRequired: false,
      taxLabel: 'Tax'
    }
  ];

  private static readonly INDIAN_STATES: StateTaxConfig[] = [
    { stateCode: 'MH', stateName: 'Maharashtra', countryCode: 'IN', taxRate: 9, isUnionTerritory: false },
    { stateCode: 'DL', stateName: 'Delhi', countryCode: 'IN', taxRate: 9, isUnionTerritory: true },
    { stateCode: 'KA', stateName: 'Karnataka', countryCode: 'IN', taxRate: 9, isUnionTerritory: false },
    { stateCode: 'TN', stateName: 'Tamil Nadu', countryCode: 'IN', taxRate: 9, isUnionTerritory: false },
    { stateCode: 'GJ', stateName: 'Gujarat', countryCode: 'IN', taxRate: 9, isUnionTerritory: false },
    { stateCode: 'RJ', stateName: 'Rajasthan', countryCode: 'IN', taxRate: 9, isUnionTerritory: false },
    { stateCode: 'UP', stateName: 'Uttar Pradesh', countryCode: 'IN', taxRate: 9, isUnionTerritory: false },
    { stateCode: 'WB', stateName: 'West Bengal', countryCode: 'IN', taxRate: 9, isUnionTerritory: false },
    { stateCode: 'PB', stateName: 'Punjab', countryCode: 'IN', taxRate: 9, isUnionTerritory: false },
    { stateCode: 'HR', stateName: 'Haryana', countryCode: 'IN', taxRate: 9, isUnionTerritory: false }
  ];

  /**
   * Calculate tax for an order based on shipping address
   */
  static calculateTax(
    subtotal: number,
    shippingAddress: {
      country: string;
      state?: string;
      postalCode?: string;
    }
  ): TaxCalculation {
    const countryCode = shippingAddress.country?.toUpperCase();
    const stateCode = shippingAddress.state?.toUpperCase();

    // Find country configuration
    const countryConfig = this.TAX_CONFIGS.find(config => config.countryCode === countryCode);
    
    if (!countryConfig) {
      // Unknown country - assume no tax
      return {
        subtotal,
        taxRate: 0,
        taxAmount: 0,
        total: subtotal,
        taxBreakdown: {
          taxType: TaxType.NO_TAX,
          country: shippingAddress.country,
          state: shippingAddress.state
        }
      };
    }

    if (countryConfig.taxType === TaxType.NO_TAX) {
      return {
        subtotal,
        taxRate: 0,
        taxAmount: 0,
        total: subtotal,
        taxBreakdown: {
          taxType: TaxType.NO_TAX,
          country: shippingAddress.country,
          state: shippingAddress.state
        }
      };
    }

    // Handle different tax systems
    switch (countryConfig.taxType) {
      case TaxType.GST_INDIA:
        return this.calculateGST(subtotal, countryCode, stateCode);
      
      case TaxType.VAT_INTERNATIONAL:
        return this.calculateVAT(subtotal, countryConfig);
      
      default:
        return {
          subtotal,
          taxRate: 0,
          taxAmount: 0,
          total: subtotal,
          taxBreakdown: {
            taxType: TaxType.NO_TAX,
            country: shippingAddress.country,
            state: shippingAddress.state
          }
        };
    }
  }

  /**
   * Calculate GST for India (intra-state vs inter-state)
   */
  private static calculateGST(subtotal: number, countryCode: string, stateCode?: string): TaxCalculation {
    const sellerStateCode = 'MH'; // Mumbai, Maharashtra - assumed seller location
    
    // Find state configuration
    const stateConfig = this.INDIAN_STATES.find(state => state.stateCode === stateCode);
    if (!stateConfig) {
      // Unknown state - default to no tax
      return {
        subtotal,
        taxRate: 0,
        taxAmount: 0,
        total: subtotal,
        taxBreakdown: {
          taxType: TaxType.GST_INDIA,
          country: 'India',
          state: stateCode
        }
      };
    }

    // Intra-state (same state) vs Inter-state (different state)
    const isIntraState = stateCode === sellerStateCode;
    const gstRate = 18; // 18% GST
    const taxAmount = (subtotal * gstRate) / 100;

    if (isIntraState) {
      // Intra-state: CGST + SGST (9% each)
      const cgst = taxAmount / 2;
      const sgst = taxAmount / 2;
      
      return {
        subtotal,
        taxRate: gstRate,
        taxAmount,
        total: subtotal + taxAmount,
        taxBreakdown: {
          cgst,
          sgst,
          taxType: TaxType.GST_INDIA,
          country: 'India',
          state: stateConfig.stateName
        }
      };
    } else {
      // Inter-state: IGST (18%)
      return {
        subtotal,
        taxRate: gstRate,
        taxAmount,
        total: subtotal + taxAmount,
        taxBreakdown: {
          igst: taxAmount,
          taxType: TaxType.GST_INDIA,
          country: 'India',
          state: stateConfig.stateName
        }
      };
    }
  }

  /**
   * Calculate VAT for international orders
   */
  private static calculateVAT(subtotal: number, countryConfig: CountryTaxConfig): TaxCalculation {
    const taxRate = countryConfig.taxRate;
    const taxAmount = (subtotal * taxRate) / 100;

    return {
      subtotal,
      taxRate,
      taxAmount,
      total: subtotal + taxAmount,
      taxBreakdown: {
        vat: taxAmount,
        taxType: TaxType.VAT_INTERNATIONAL,
        country: countryConfig.countryName
      }
    };
  }

  /**
   * Get supported countries for tax calculation
   */
  static getSupportedCountries(): Array<{
    code: string;
    name: string;
    taxRate: number;
    taxLabel: string;
    requiresState: boolean;
  }> {
    return this.TAX_CONFIGS.map(config => ({
      code: config.countryCode,
      name: config.countryName,
      taxRate: config.taxRate,
      taxLabel: config.taxLabel,
      requiresState: config.stateRequired
    }));
  }

  /**
   * Get states for a country (currently only India)
   */
  static getStatesForCountry(countryCode: string): Array<{
    code: string;
    name: string;
  }> {
    const states = this.INDIAN_STATES.filter(state => state.countryCode === countryCode);
    return states.map(state => ({
      code: state.stateCode,
      name: state.stateName
    }));
  }

  /**
   * Validate if tax registration is required for a country
   */
  static isTaxRegistrationRequired(countryCode: string, annualRevenue: number = 0): boolean {
    const countryConfig = this.TAX_CONFIGS.find(config => config.countryCode === countryCode);
    
    if (!countryConfig?.registrationRequired || !countryConfig.threshold) {
      return false;
    }

    return annualRevenue >= countryConfig.threshold;
  }

  /**
   * Format tax information for display
   */
  static formatTaxBreakdown(taxBreakdown: TaxBreakdown): string {
    switch (taxBreakdown.taxType) {
      case TaxType.GST_INDIA:
        if (taxBreakdown.cgst && taxBreakdown.sgst) {
          return `CGST: ₹${taxBreakdown.cgst.toFixed(2)} + SGST: ₹${taxBreakdown.sgst.toFixed(2)}`;
        } else if (taxBreakdown.igst) {
          return `IGST: ₹${taxBreakdown.igst.toFixed(2)}`;
        }
        break;
      
      case TaxType.VAT_INTERNATIONAL:
        if (taxBreakdown.vat) {
          return `VAT: ${taxBreakdown.country} ${taxBreakdown.vat.toFixed(2)}`;
        }
        break;
      
      case TaxType.NO_TAX:
        return 'No tax applicable';
    }
    
    return '';
  }

  /**
   * Check if tax is included in prices (common in some countries)
   */
  static isTaxInclusive(countryCode: string): boolean {
    // Most EU countries are tax-inclusive, but e-commerce is usually tax-exclusive
    const taxInclusiveCountries = ['AU']; // Australia sometimes includes GST in displayed prices
    
    return taxInclusiveCountries.includes(countryCode.toUpperCase());
  }
}

/**
 * Extend Order interface to include tax information
 */
export interface OrderWithTax extends Order {
  taxBreakdown: TaxBreakdown;
  taxAmount: number;
  subtotal: number; // Before tax
}

/**
 * Utility function to calculate tax for an order
 */
export function calculateOrderTax(
  orderItems: Array<{ price: number; quantity: number }>,
  shippingAddress: {
    country: string;
    state?: string;
    postalCode?: string;
  }
): TaxCalculation {
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return GlobalTaxService.calculateTax(subtotal, shippingAddress);
}

/**
 * Firestore tax schema
 */
export const TAX_SCHEMA = {
  collections: {
    tax_configurations: {
      description: 'Tax configuration per country/region',
      fields: {
        countryCode: 'string (e.g., IN, US, DE)',
        countryName: 'string',
        taxRate: 'number (percentage)',
        taxType: 'enum (gst_india, vat_international, no_tax)',
        stateRequired: 'boolean',
        taxLabel: 'string (e.g., GST, VAT, Sales Tax)',
        registrationRequired: 'boolean',
        threshold: 'number (registration threshold)',
        isActive: 'boolean',
        createdAt: 'timestamp',
        updatedAt: 'timestamp'
      },
      indexes: ['countryCode', 'isActive', 'taxType']
    },
    
    tax_calculations: {
      description: 'Historical tax calculations for audit',
      fields: {
        orderId: 'string',
        countryCode: 'string',
        stateCode: 'string',
        subtotal: 'number',
        taxRate: 'number',
        taxAmount: 'number',
        taxType: 'enum',
        taxBreakdown: 'object',
        calculationDate: 'timestamp',
        version: 'string (tax rule version)'
      },
      indexes: ['orderId', 'calculationDate', 'countryCode']
    }
  }
};
