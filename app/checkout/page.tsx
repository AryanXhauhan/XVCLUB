'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/context/CartContext';
import Button from '@/components/ui/Button';
import PhoneInput from '@/components/ui/PhoneInput';
import CountrySelect from '@/components/ui/CountrySelect';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ShippingAddress } from '@/lib/types';
import { validateCheckoutForm, validateEmail, validateRequired, validatePostalCode, formatPhoneToE164 } from '@/lib/utils/validation';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotal } = useCart();
    const [mounted, setMounted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const [address, setAddress] = useState<ShippingAddress>({
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India', // Default to India (country name, not code)
    });

    // Validation state
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [touched, setTouched] = useState<{[key: string]: boolean}>({});

    useEffect(() => {
        setMounted(true);
        if (items.length === 0) {
            router.push('/cart');
        }
    }, [items, router]);

    useEffect(() => {
        // Validate form on every change
        const formData = {
            fullName,
            email,
            phone,
            addressLine1: address.line1,
            addressLine2: address.line2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
        };

        const validation = validateCheckoutForm(formData);
        

        // Only show errors for fields that have been touched
        const newErrors: {[key: string]: string} = {};
        Object.keys(validation.errors).forEach(field => {
            if (touched[field]) {
                const errorKey = field as keyof typeof validation.errors;
                const errorMessage = validation.errors[errorKey];
                if (errorMessage) {
                    newErrors[field] = errorMessage;
                }
            }
        });
        
        setErrors(newErrors);
    }, [fullName, email, phone, address, touched]);

    if (!mounted) {
        return (
            <main className="min-h-screen bg-xvc-offwhite">
                <section className="editorial-container py-20">
                    <p className="text-xvc-graphite">Loading...</p>
                </section>
            </main>
        );
    }

    if (items.length === 0) {
        return null; // Will redirect
    }


    const handleFieldChange = (field: string, value: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        
        switch (field) {
            case 'fullName':
                setFullName(value);
                break;
            case 'email':
                setEmail(value);
                break;
            case 'phone':
                setPhone(value);
                break;
            case 'addressLine1':
                setAddress(prev => ({ ...prev, line1: value }));
                break;
            case 'addressLine2':
                setAddress(prev => ({ ...prev, line2: value }));
                break;
            case 'city':
                setAddress(prev => ({ ...prev, city: value }));
                break;
            case 'state':
                setAddress(prev => ({ ...prev, state: value }));
                break;
            case 'postalCode':
                setAddress(prev => ({ ...prev, postalCode: value }));
                break;
            case 'country':
                setAddress(prev => ({ ...prev, country: value }));
                break;
        }
    };

    const handlePhoneCountryChange = (countryCode: string) => {
        // Map country code to country name
        const countryNameMap: { [key: string]: string } = {
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
        
        const countryName = countryNameMap[countryCode] || countryCode;
        setAddress(prev => ({ ...prev, country: countryName }));
        setTouched(prev => ({ ...prev, country: true }));
    };

    const handleFieldBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 🧪 STEP 6: QUICK TEST - Console log cart items
        console.log("CART ITEMS:", items);

        // Mark all fields as touched
        const allFields = ['fullName', 'email', 'phone', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
        const newTouched: {[key: string]: boolean} = {};
        allFields.forEach(field => {
            newTouched[field] = true;
        });
        setTouched(newTouched);

        // Validate entire form
        const formData = {
            fullName,
            email,
            phone,
            addressLine1: address.line1,
            addressLine2: address.line2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
        };

        const validation = validateCheckoutForm(formData);
        

        if (!validation.isValid) {
            // Convert ValidationErrors to plain object
            const plainErrors: {[key: string]: string} = {};
            Object.keys(validation.errors).forEach(field => {
                const errorKey = field as keyof typeof validation.errors;
                const errorMessage = validation.errors[errorKey];
                if (errorMessage) {
                    plainErrors[field] = errorMessage;
                }
            });
            setErrors(plainErrors);
            toast.error('Please fix the errors below');
            return;
        }

        setIsSubmitting(true);

        try {
            // Format phone number to E.164 format
            const formattedPhone = formatPhoneToE164(phone);

            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items,
                    customerName: fullName,
                    customerEmail: email,
                    customerPhone: formattedPhone,
                    shippingAddress: address,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create checkout session');
            }

            const { key, orderId, amount } = await response.json();

            if (!key || !orderId) {
                throw new Error('Invalid checkout response');
            }

            // Load Razorpay checkout script
            const loadRazorpay = () => new Promise<boolean>((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = () => resolve(true);
                script.onerror = () => resolve(false);
                document.body.appendChild(script);
            });

            const ok = await loadRazorpay();
            if (!ok) throw new Error('Failed to load Razorpay SDK');

            const options: any = {
                key,
                amount: amount,
                currency: 'INR',
                order_id: orderId,
                name: 'Xandre Valente Club',
                description: 'XVC Order',
                handler: function (response: any) {
                    // On success, redirect to order-success with identifiers
                    window.location.href = `/order-success?order_id=${response.razorpay_order_id}&payment_id=${response.razorpay_payment_id}`;
                },
                prefill: {
                    name: fullName,
                    email: email,
                    contact: formattedPhone,
                },
            };

            // @ts-ignore
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error: any) {
            console.error('Checkout error:', error);
            toast.error(error.message || 'Something went wrong. Please try again.');
            setIsSubmitting(false);
        }
    };

    // Check if form is valid
    const formData = {
        fullName,
        email,
        phone,
        addressLine1: address.line1,
        addressLine2: address.line2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
    };

    const validation = validateCheckoutForm(formData);
    const isFormValid = validation.isValid;
    const hasErrors = Object.keys(errors).length > 0;

    const subtotal = getTotal();
    const displaySubtotal = `₹${subtotal.toLocaleString()}`;

    return (
        <main className="min-h-screen bg-xvc-offwhite">
            <section className="editorial-container py-24 md:py-32 lg:py-40">
                <h1 className="text-xvc-black mb-16 text-5xl md:text-6xl lg:text-7xl">Checkout</h1>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Customer Details Form */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Customer Information */}
                        <div className="space-y-4">
                            <h2 className="text-xl text-xvc-black">Customer Information</h2>
                            
                            <div>
                                <label htmlFor="fullName" className="block text-sm text-xvc-graphite mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    value={fullName}
                                    onChange={(e) => handleFieldChange('fullName', e.target.value)}
                                    onBlur={() => handleFieldBlur('fullName')}
                                    className={`
                                        w-full px-4 py-2 border transition-colors duration-200 
                                        ${errors.fullName 
                                            ? 'border-red-500 bg-red-50' 
                                            : touched.fullName && !errors.fullName
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-xvc-taupe/30 bg-xvc-offwhite focus:border-xvc-black'
                                        }
                                        text-xvc-black focus:outline-none focus:bg-xvc-offwhite
                                    `}
                                    placeholder="Enter your full name"
                                />
                                {errors.fullName && (
                                    <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>
                                )}
                                {touched.fullName && !errors.fullName && fullName && (
                                    <p className="text-sm text-green-600 mt-1">✓ Looks good</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm text-xvc-graphite mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => handleFieldChange('email', e.target.value)}
                                    onBlur={() => handleFieldBlur('email')}
                                    className={`
                                        w-full px-4 py-2 border transition-colors duration-200 
                                        ${errors.email 
                                            ? 'border-red-500 bg-red-50' 
                                            : touched.email && !errors.email
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-xvc-taupe/30 bg-xvc-offwhite focus:border-xvc-black'
                                        }
                                        text-xvc-black focus:outline-none focus:bg-xvc-offwhite
                                    `}
                                    placeholder="Enter your email address"
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                                )}
                                {touched.email && !errors.email && email && (
                                    <p className="text-sm text-green-600 mt-1">✓ Valid email</p>
                                )}
                            </div>


                            <PhoneInput
                                value={phone}
                                onChange={(value) => handleFieldChange('phone', value)}
                                onCountryChange={handlePhoneCountryChange}
                                error={errors.phone}
                                label="Phone Number"
                                placeholder="Enter your phone number"
                                defaultCountry="IN"
                                className=""
                            />
                        </div>

                        {/* Shipping Address */}
                        <div className="space-y-4">
                            <h2 className="text-xl text-xvc-black">Shipping Address</h2>
                            
                            <div>
                                <label htmlFor="addressLine1" className="block text-sm text-xvc-graphite mb-2">
                                    Address Line 1 *
                                </label>
                                <input
                                    type="text"
                                    id="addressLine1"
                                    value={address.line1}
                                    onChange={(e) => handleFieldChange('addressLine1', e.target.value)}
                                    onBlur={() => handleFieldBlur('addressLine1')}
                                    className={`
                                        w-full px-4 py-2 border transition-colors duration-200 
                                        ${errors.addressLine1 
                                            ? 'border-red-500 bg-red-50' 
                                            : touched.addressLine1 && !errors.addressLine1
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-xvc-taupe/30 bg-xvc-offwhite focus:border-xvc-black'
                                        }
                                        text-xvc-black focus:outline-none focus:bg-xvc-offwhite
                                    `}
                                    placeholder="Street address, apartment, suite, unit, etc."
                                />
                                {errors.addressLine1 && (
                                    <p className="text-sm text-red-600 mt-1">{errors.addressLine1}</p>
                                )}
                                {touched.addressLine1 && !errors.addressLine1 && address.line1 && (
                                    <p className="text-sm text-green-600 mt-1">✓ Valid address</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="addressLine2" className="block text-sm text-xvc-graphite mb-2">
                                    Address Line 2
                                </label>
                                <input
                                    type="text"
                                    id="addressLine2"
                                    value={address.line2}
                                    onChange={(e) => handleFieldChange('addressLine2', e.target.value)}
                                    onBlur={() => handleFieldBlur('addressLine2')}
                                    className="w-full px-4 py-2 border border-xvc-taupe/30 bg-xvc-offwhite text-xvc-black focus:outline-none focus:border-xvc-black"
                                    placeholder="Building, floor, landmark (optional)"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="city" className="block text-sm text-xvc-graphite mb-2">
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        id="city"
                                        value={address.city}
                                        onChange={(e) => handleFieldChange('city', e.target.value)}
                                        onBlur={() => handleFieldBlur('city')}
                                        className={`
                                            w-full px-4 py-2 border transition-colors duration-200 
                                            ${errors.city 
                                                ? 'border-red-500 bg-red-50' 
                                                : touched.city && !errors.city
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-xvc-taupe/30 bg-xvc-offwhite focus:border-xvc-black'
                                            }
                                            text-xvc-black focus:outline-none focus:bg-xvc-offwhite
                                        `}
                                        placeholder="Enter city"
                                    />
                                    {errors.city && (
                                        <p className="text-sm text-red-600 mt-1">{errors.city}</p>
                                    )}
                                    {touched.city && !errors.city && address.city && (
                                        <p className="text-sm text-green-600 mt-1">✓ Valid city</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="state" className="block text-sm text-xvc-graphite mb-2">
                                        State *
                                    </label>
                                    <input
                                        type="text"
                                        id="state"
                                        value={address.state}
                                        onChange={(e) => handleFieldChange('state', e.target.value)}
                                        onBlur={() => handleFieldBlur('state')}
                                        className={`
                                            w-full px-4 py-2 border transition-colors duration-200 
                                            ${errors.state 
                                                ? 'border-red-500 bg-red-50' 
                                                : touched.state && !errors.state
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-xvc-taupe/30 bg-xvc-offwhite focus:border-xvc-black'
                                            }
                                            text-xvc-black focus:outline-none focus:bg-xvc-offwhite
                                        `}
                                        placeholder="Enter state/province"
                                    />
                                    {errors.state && (
                                        <p className="text-sm text-red-600 mt-1">{errors.state}</p>
                                    )}
                                    {touched.state && !errors.state && address.state && (
                                        <p className="text-sm text-green-600 mt-1">✓ Valid state</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="postalCode" className="block text-sm text-xvc-graphite mb-2">
                                        Postal Code *
                                    </label>
                                    <input
                                        type="text"
                                        id="postalCode"
                                        value={address.postalCode}
                                        onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                                        onBlur={() => handleFieldBlur('postalCode')}
                                        className={`
                                            w-full px-4 py-2 border transition-colors duration-200 
                                            ${errors.postalCode 
                                                ? 'border-red-500 bg-red-50' 
                                                : touched.postalCode && !errors.postalCode
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-xvc-taupe/30 bg-xvc-offwhite focus:border-xvc-black'
                                            }
                                            text-xvc-black focus:outline-none focus:bg-xvc-offwhite
                                        `}
                                        placeholder="Enter postal code"
                                    />
                                    {errors.postalCode && (
                                        <p className="text-sm text-red-600 mt-1">{errors.postalCode}</p>
                                    )}
                                    {touched.postalCode && !errors.postalCode && address.postalCode && (
                                        <p className="text-sm text-green-600 mt-1">✓ Valid postal code</p>
                                    )}
                                </div>

                                <CountrySelect
                                    value={address.country}
                                    onChange={(country) => handleFieldChange('country', country)}
                                    error={errors.country}
                                    label="Country"
                                    placeholder="Select your country"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="border border-xvc-taupe/30 p-6 space-y-6 sticky top-8">
                            <h2 className="text-xl text-xvc-black">Order Summary</h2>

                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div
                                        key={`${item.productId}-${item.shade || 'default'}-${index}`}
                                        className="flex justify-between text-sm text-xvc-graphite"
                                    >
                                        <span>
                                            {item.productName}
                                            {item.shade && ` (${item.shade})`} × {item.quantity}
                                        </span>
                                        <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-xvc-taupe/30 pt-4">
                                <div className="flex justify-between text-lg font-medium text-xvc-black">
                                    <span>Total</span>
                                    <span>{displaySubtotal}</span>
                                </div>
                            </div>

                            {/* Return Policy Callout */}
                            <div className="border-t border-xvc-taupe/30 pt-4">
                                <h3 className="text-sm font-medium text-xvc-black mb-2">
                                    Return Policy
                                </h3>
                                <p className="text-xs text-xvc-graphite mb-2">
                                    We offer a strict return policy. All sales are final unless the product is defective.
                                </p>
                                <Link
                                    href="/policies/returns"
                                    className="text-xs text-xvc-black underline hover:opacity-70"
                                >
                                    Read full return policy →
                                </Link>
                            </div>

                            {/* Form Validation Summary */}
                            {hasErrors && (
                                <div className="border-t border-xvc-taupe/30 pt-4">
                                    <p className="text-sm text-red-600 mb-2">
                                        Please fix the errors above to complete your order
                                    </p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isSubmitting || !isFormValid}
                                className={`
                                    w-full transition-all duration-200
                                    ${!isFormValid 
                                        ? 'opacity-50 cursor-not-allowed bg-xvc-taupe text-xvc-black' 
                                        : 'hover:bg-xvc-black hover:text-xvc-offwhite'
                                    }
                                `}
                            >
                                {isSubmitting ? 'Processing...' : 'Complete Order'}
                            </Button>
                            
                            {!isFormValid && hasErrors && (
                                <p className="text-xs text-center text-xvc-graphite">
                                    Complete all required fields to enable checkout
                                </p>
                            )}
                        </div>
                    </div>
                </form>
            </section>
        </main>
    );
}
