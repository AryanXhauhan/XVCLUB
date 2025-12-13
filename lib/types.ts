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
}

export interface ShippingAddress {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface Order {
    id: string;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: ShippingAddress;
    items: OrderItem[];
    total: number;
    status: 'paid' | 'shipped' | 'delivered';
    paymentStatus: 'paid';
    createdAt: any;
    updatedAt: any;
}
