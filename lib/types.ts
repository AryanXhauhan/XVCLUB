
export interface Product {
    id: string;
    name: string;
    slug: string;
    category: 'lips' | 'eyes' | 'glow';
    price: {
        inr: number;
        usd?: number;
    };
    currency: string;
    description: string;
    shortDescription: string;
    shades?: { name: string; code: string }[];
    images: string[];
    stock: number;
    createdAt: any;
}


export interface OrderItem {
    productId: string;
    productName: string;
    shade?: string;
    price: number;
    quantity: number;
    currency?: string;
}

export interface ShippingAddress {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string; // ISO 3166-1 alpha-2 country code (e.g., 'IN', 'US', 'GB')
}

export interface InternationalPhoneInfo {
    phone: string; // E.164 format (e.g., +919876543210)
    country: string; // ISO 3166-1 alpha-2 country code
    countryName: string; // Full country name
    countryCode: string; // Dialing code (e.g., '91', '1', '44')
}



export interface Order {
    id: string;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string; // E.164 format
    customerPhoneInfo?: InternationalPhoneInfo;
    shippingAddress: ShippingAddress;
    billingAddress?: ShippingAddress; // Optional billing address
    items: OrderItem[];
    total: number;
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'pending_review' | 'blocked';
    paymentStatus: 'paid' | 'pending' | 'refunded';
    createdAt: any;
    updatedAt: any;
    lastUpdated?: any;
    fulfillmentNotes?: string;
    // Tax-related fields
    subtotal?: number;
    taxAmount?: number;
    taxBreakdown?: any;
    finalAmount?: number;
    shippingCost?: number;
    discountAmount?: number;
    // Shipping information
    shipping?: {
        shipmentId?: string;
        awbCode?: string;
        courierName?: string;
        trackingUrl?: string;
        status?: string;
    };
    // Fraud detection fields
    fraudFlagId?: string;
    fraudFlags?: any[];
    heldAt?: any;
    heldReason?: string;
    blockedAt?: any;
    blockedReason?: string;
}
