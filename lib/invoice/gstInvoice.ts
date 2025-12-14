import { Order } from '@/lib/types';

export interface GSTInvoice {
  invoiceNumber: string;
  invoiceDate: Date;
  financialYear: string;
  sellerDetails: {
    name: string;
    address: string;
    gstin: string;
    state: string;
    stateCode: string;
    email: string;
    phone: string;
  };
  buyerDetails: {
    name: string;
    email: string;
    phone: string;
    gstin?: string;
    address: string;
    city: string;
    state: string;
    stateCode: string;
    postalCode: string;
  };
  orderDetails: {
    orderId: string;
    razorpayOrderId: string;
    paymentId: string;
    orderDate: Date;
    paymentDate: Date;
  };
  items: InvoiceItem[];
  taxBreakdown: {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    grandTotal: number;
    currency: string;
  };
  terms: string[];
  placeOfSupply: string;
  reverseCharge: boolean;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  shade?: string;
  hsnCode: string; // Harmonized System Nomenclature code
  quantity: number;
  rate: number; // Price per unit (INR)
  taxableValue: number; // quantity * rate
  gstRate: number; // e.g., 18, 28
  cgstRate: number; // Usually half of GST rate
  sgstRate: number; // Usually half of GST rate
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number; // taxableValue + cgstAmount + sgstAmount
}

export interface InvoicePDF {
  html: string;
  pdfBuffer: Buffer;
  fileName: string;
}

// Indian state codes for GST
export const INDIAN_STATE_CODES: { [key: string]: string } = {
  'andhra pradesh': '37',
  'arunachal pradesh': '12',
  'assam': '18',
  'bihar': '10',
  'chhattisgarh': '22',
  'goa': '30',
  'gujarat': '24',
  'haryana': '06',
  'himachal pradesh': '02',
  'jharkhand': '20',
  'karnataka': '29',
  'kerala': '32',
  'madhya pradesh': '23',
  'maharashtra': '27',
  'manipur': '14',
  'meghalaya': '17',
  'mizoram': '15',
  'nagaland': '13',
  'odisha': '21',
  'punjab': '03',
  'rajasthan': '08',
  'sikkim': '11',
  'tamil nadu': '33',
  'telangana': '36',
  'tripura': '16',
  'uttar pradesh': '09',
  'uttarakhand': '05',
  'west bengal': '19',
  'delhi': '07',
  'chandigarh': '04',
  'puducherry': '34',
  'jammu and kashmir': '01',
  'ladakh': '38',
  'andaman and nicobar islands': '35',
  'dadra and nagar haveli and daman and diu': '26',
  'lakshadweep': '31',
  'lakshadweep islands': '31'
};

// HSN codes for cosmetics (Chapter 33)
export const COSMETICS_HSN_CODES = {
  'lipstick': '33049900',
  'eyeliner': '33042000',
  'blush': '33049900',
  'default': '33049900'
};

// GST rates for cosmetics
export const COSMETICS_GST_RATE = 18; // 18% GST

export function generateInvoiceNumber(orderDate: Date): string {
  const year = orderDate.getFullYear();
  const nextYear = year + 1;
  const financialYear = `${year}-${nextYear.toString().slice(-2)}`;
  
  // Generate sequential number based on timestamp
  const sequence = Math.floor(orderDate.getTime() / 1000).toString().slice(-6);
  
  return `XVC/${financialYear}/${sequence}`;
}

export function getStateCode(state: string): string {
  const normalizedState = state.toLowerCase().trim();
  return INDIAN_STATE_CODES[normalizedState] || '07'; // Default to Delhi
}

export function getHSNCode(productName: string): string {
  const name = productName.toLowerCase();
  
  if (name.includes('lipstick')) return COSMETICS_HSN_CODES.lipstick;
  if (name.includes('eyeliner') || name.includes('eyeliner')) return COSMETICS_HSN_CODES.eyeliner;
  if (name.includes('blush')) return COSMETICS_HSN_CODES.blush;
  
  return COSMETICS_HSN_CODES.default;
}

export function createInvoiceFromOrder(order: Order): GSTInvoice {
  const invoiceNumber = generateInvoiceNumber(order.createdAt.toDate());
  const financialYear = `${order.createdAt.toDate().getFullYear()}-${(order.createdAt.toDate().getFullYear() + 1).toString().slice(-2)}`;
  
  // Seller details (XVC)
  const sellerDetails = {
    name: 'XVC Cosmetics Pvt Ltd',
    address: '123 Beauty Lane, Mumbai, Maharashtra 400001',
    gstin: '27ABCDE1234F1Z5', // Replace with actual GSTIN
    state: 'Maharashtra',
    stateCode: '27',
    email: 'orders@xvc.com',
    phone: '+91-9876543210'
  };

  // Buyer details from order
  const buyerStateCode = getStateCode(order.shippingAddress.state);
  const isIntraState = sellerDetails.stateCode === buyerStateCode;
  
  // Calculate GST for each item
  const items: InvoiceItem[] = order.items.map(item => {
    const hsnCode = getHSNCode(item.productName);
    const gstRate = COSMETICS_GST_RATE;
    const cgstRate = isIntraState ? gstRate / 2 : 0;
    const sgstRate = isIntraState ? gstRate / 2 : 0;
    const igstRate = isIntraState ? 0 : gstRate;
    
    const taxableValue = item.price * item.quantity;
    const cgstAmount = (taxableValue * cgstRate) / 100;
    const sgstAmount = (taxableValue * sgstRate) / 100;
    const igstAmount = (taxableValue * igstRate) / 100;
    const totalAmount = taxableValue + cgstAmount + sgstAmount + igstAmount;
    
    return {
      productId: item.productId,
      productName: item.productName,
      shade: item.shade,
      hsnCode,
      quantity: item.quantity,
      rate: item.price,
      taxableValue,
      gstRate,
      cgstRate,
      sgstRate,
      cgstAmount,
      sgstAmount,
      totalAmount
    };
  });

  // Calculate totals
  const taxableAmount = items.reduce((sum, item) => sum + item.taxableValue, 0);
  const totalCGST = items.reduce((sum, item) => sum + item.cgstAmount, 0);
  const totalSGST = items.reduce((sum, item) => sum + item.sgstAmount, 0);
  const totalGST = totalCGST + totalSGST;
  const grandTotal = taxableAmount + totalGST;

  return {
    invoiceNumber,
    invoiceDate: new Date(),
    financialYear,
    sellerDetails,
    buyerDetails: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      address: `${order.shippingAddress.line1}${order.shippingAddress.line2 ? ', ' + order.shippingAddress.line2 : ''}`,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      stateCode: buyerStateCode,
      postalCode: order.shippingAddress.postalCode
    },
    orderDetails: {
      orderId: order.id,
      razorpayOrderId: order.razorpayOrderId,
      paymentId: order.razorpayPaymentId || '',
      orderDate: order.createdAt.toDate(),
      paymentDate: order.createdAt.toDate()
    },
    items,
    taxBreakdown: {
      taxableAmount,
      cgst: totalCGST,
      sgst: totalSGST,
      igst: 0, // Intra-state transaction
      totalTax: totalGST,
      grandTotal,
      currency: 'INR'
    },
    terms: [
      'Payment due within 30 days',
      'Subject to jurisdiction of Mumbai courts',
      'No warranty or guarantee on product performance',
      'Customer service: support@xvc.com'
    ],
    placeOfSupply: sellerDetails.state,
    reverseCharge: false
  };
}
