
import React, { useState, useEffect } from 'react';
import { PhoneInput as InternationalPhoneInput, defaultCountries } from 'react-international-phone';
import 'react-international-phone/style.css';


interface PhoneInputProps {
  value: string;
  onChange: (phone: string) => void;
  onCountryChange?: (countryCode: string) => void;
  error?: string;
  className?: string;
  placeholder?: string;
  defaultCountry?: string;
  label?: string;
}


const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  onCountryChange,
  error,
  className = '',
  placeholder = 'Enter phone number',
  defaultCountry = 'IN',
  label = 'Phone Number'
}) => {
  const [phone, setPhone] = useState(value || '');

  useEffect(() => {
    setPhone(value || '');
  }, [value]);


  const handlePhoneChange = (phoneValue: string, countryData?: any) => {
    setPhone(phoneValue);
    onChange(phoneValue);
    
    // If country changed and callback provided, notify parent
    if (countryData && countryData.countryCode && onCountryChange) {
      onCountryChange(countryData.countryCode);
    }
  };

  // Custom styling to match the luxury brand
  const customStyles = {
    '--PhoneInputCountryFlag-height': '1.2em',
    '--PhoneInputCountrySelectArrow-opacity': '0.5',
    '--PhoneInputCountrySelectArrow-opacity--focus': '0.8',
    '--PhoneInputCountrySelectArrow-transform': 'translateY(-50%)',
    '--PhoneInputCountrySelectArrow-margin-left': '8px',
  } as React.CSSProperties;



  const displayError = error && error.trim() !== '';

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm text-xvc-graphite mb-2">
        {label} *
      </label>
      
      <div className="relative">
        <InternationalPhoneInput
          value={phone}
          onChange={handlePhoneChange}
          defaultCountry={defaultCountry}
          placeholder={placeholder}
          className={`
            phone-input-custom
            ${displayError ? 'phone-error' : ''}
          `}
          style={customStyles}
        />
      </div>
      
      {displayError && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
      
      <style jsx>{`
        .phone-input-custom {
          width: 100%;
        }
        
        .phone-input-custom input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid ${displayError ? '#ef4444' : 'rgba(139, 121, 94, 0.3)'};
          background-color: #faf9f7;
          color: #1a1a1a;
          border-radius: 0;
          font-size: 14px;
          line-height: 1.5;
          transition: border-color 0.2s ease;
        }
        
        .phone-input-custom input:focus {
          outline: none;
          border-color: ${displayError ? '#ef4444' : '#1a1a1a'};
          background-color: #faf9f7;
        }
        
        .phone-input-custom .PhoneInputCountrySelect {
          background-color: transparent;
          border: none;
          padding: 8px 4px;
          margin-right: 8px;
          color: #1a1a1a;
        }
        
        .phone-input-custom .PhoneInputCountrySelect:focus {
          outline: none;
        }
        
        .phone-input-custom .PhoneInputCountryFlag {
          margin-right: 4px;
        }
        
        .phone-input-custom .PhoneInputCountrySelectArrow {
          border-left: 3px solid transparent;
          border-right: 3px solid transparent;
          border-top: 4px solid rgba(139, 121, 94, 0.5);
          margin-left: 6px;
          transition: opacity 0.2s ease;
        }
        
        .phone-input-custom .PhoneInputCountrySelect:focus-within .PhoneInputCountrySelectArrow {
          border-top-color: rgba(139, 121, 94, 0.8);
        }
        
        .phone-error input {
          border-color: #ef4444 !important;
          background-color: #fef2f2;
        }
        
        .phone-error input:focus {
          border-color: #dc2626 !important;
          background-color: #fef2f2;
        }
      `}</style>
    </div>
  );
};

export default PhoneInput;
