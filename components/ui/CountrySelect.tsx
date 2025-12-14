
import React, { useMemo } from 'react';
import Select from 'react-select';

// Country data mapping - simplified approach
const countries = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
];

interface CountrySelectProps {
  value: string;
  onChange: (country: string) => void;
  error?: string;
  className?: string;
  label?: string;
  placeholder?: string;
}

interface CountryOption {
  value: string;
  label: string;
  flag: string;
}

const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  error,
  className = '',
  label = 'Country',
  placeholder = 'Select a country'
}) => {
  // Transform countries data for react-select
  const countryOptions: CountryOption[] = useMemo(() => {
    return countries.map(country => ({
      value: country.code,
      label: country.name,
      flag: country.flag
    }));
  }, []);

  // Find selected country option
  const selectedOption = useMemo(() => {
    return countryOptions.find(option => option.value === value);
  }, [value, countryOptions]);

  // Custom styles to match luxury brand
  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '42px',
      border: `1px solid ${error ? '#ef4444' : 'rgba(139, 121, 94, 0.3)'}`,
      backgroundColor: '#faf9f7',
      borderRadius: '0',
      fontSize: '14px',
      color: '#1a1a1a',
      boxShadow: 'none',
      '&:hover': {
        borderColor: error ? '#ef4444' : '#1a1a1a',
      },
      '&:focus-within': {
        borderColor: error ? '#ef4444' : '#1a1a1a',
        boxShadow: `0 0 0 1px ${error ? '#ef4444' : '#1a1a1a'}`,
      },
    }),
    input: (provided: any) => ({
      ...provided,
      color: '#1a1a1a',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: 'rgba(139, 121, 94, 0.6)',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#1a1a1a',
      display: 'flex',
      alignItems: 'center',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#1a1a1a' : state.isFocused ? 'rgba(139, 121, 94, 0.1)' : '#faf9f7',
      color: state.isSelected ? '#faf9f7' : '#1a1a1a',
      fontSize: '14px',
      padding: '8px 12px',
      '&:hover': {
        backgroundColor: state.isSelected ? '#1a1a1a' : 'rgba(139, 121, 94, 0.2)',
      },
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      color: 'rgba(139, 121, 94, 0.5)',
      '&:hover': {
        color: 'rgba(139, 121, 94, 0.8)',
      },
    }),
    indicatorSeparator: (provided: any) => ({
      ...provided,
      backgroundColor: 'rgba(139, 121, 94, 0.3)',
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: '#faf9f7',
      border: '1px solid rgba(139, 121, 94, 0.3)',
      borderRadius: '0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    }),
    menuList: (provided: any) => ({
      ...provided,
      maxHeight: '200px',
      '&::-webkit-scrollbar': {
        width: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#faf9f7',
      },
      '&::-webkit-scrollbar-thumb': {
        background: 'rgba(139, 121, 94, 0.3)',
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: 'rgba(139, 121, 94, 0.5)',
      },
    }),
  };

  // Custom option component to show flag
  const CustomOption = ({ innerProps, isFocused, isSelected, data }: any) => (
    <div
      {...innerProps}
      className={`
        flex items-center p-3 cursor-pointer transition-colors
        ${isFocused ? 'bg-xvc-taupe/10' : ''}
        ${isSelected ? 'bg-xvc-black text-xvc-offwhite' : ''}
      `}
    >
      <span className="mr-3 text-lg">{data.flag}</span>
      <span className="font-medium">{data.label}</span>
    </div>
  );

  // Custom single value component to show flag
  const CustomSingleValue = ({ data }: any) => (
    <div className="flex items-center">
      <span className="mr-2 text-lg">{data.flag}</span>
      <span>{data.label}</span>
    </div>
  );

  const displayError = error && error.trim() !== '';

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm text-xvc-graphite mb-2">
        {label} *
      </label>
      

      <Select
        value={selectedOption}
        onChange={(selected) => {
          const countryName = selected?.label || '';
          onChange(countryName);
        }}
        options={countryOptions}
        placeholder={placeholder}
        isSearchable
        isClearable
        styles={customStyles}
        components={{
          Option: CustomOption,
          SingleValue: CustomSingleValue,
        }}
        className={`country-select ${displayError ? 'country-select-error' : ''}`}
      />
      
      {displayError && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
      
      <style jsx>{`
        .country-select-error .Select-control {
          border-color: #ef4444 !important;
          background-color: #fef2f2;
        }
        
        .country-select-error .Select-control:hover {
          border-color: #dc2626 !important;
          background-color: #fef2f2;
        }
        
        .country-select-error .Select-control:focus-within {
          border-color: #dc2626 !important;
          box-shadow: 0 0 0 1px #dc2626;
          background-color: #fef2f2;
        }
      `}</style>
    </div>
  );
};

export default CountrySelect;
