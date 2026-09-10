'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CountryCodeItem {
  name: string;
  dialCode: string;
  flag: string;
  digits: string;
}

export const COUNTRY_CODES: CountryCodeItem[] = [
  { name: 'Türkiye', dialCode: '+90', flag: '🇹🇷', digits: '90' },
  { name: 'Azerbaycan', dialCode: '+994', flag: '🇦🇿', digits: '994' },
  { name: 'Almanya', dialCode: '+49', flag: '🇩🇪', digits: '49' },
  { name: 'Hollanda', dialCode: '+31', flag: '🇳🇱', digits: '31' },
  { name: 'Fransa', dialCode: '+33', flag: '🇫🇷', digits: '33' },
  { name: 'Birleşik Krallık', dialCode: '+44', flag: '🇬🇧', digits: '44' },
  { name: 'ABD / Kanada', dialCode: '+1', flag: '🇺🇸', digits: '1' },
  { name: 'Avusturya', dialCode: '+43', flag: '🇦🇹', digits: '43' },
  { name: 'Belçika', dialCode: '+32', flag: '🇧🇪', digits: '32' },
  { name: 'İsviçre', dialCode: '+41', flag: '🇨🇭', digits: '41' },
  { name: 'İsveç', dialCode: '+46', flag: '🇸🇪', digits: '46' },
  { name: 'Norveç', dialCode: '+47', flag: '🇳🇴', digits: '47' },
  { name: 'Danimarka', dialCode: '+45', flag: '🇩🇰', digits: '45' },
  { name: 'İtalya', dialCode: '+39', flag: '🇮🇹', digits: '39' },
  { name: 'İspanya', dialCode: '+34', flag: '🇪🇸', digits: '34' },
  { name: 'Yunanistan', dialCode: '+30', flag: '🇬🇷', digits: '30' },
  { name: 'BAE', dialCode: '+971', flag: '🇦🇪', digits: '971' },
  { name: 'Suudi Arabistan', dialCode: '+966', flag: '🇸🇦', digits: '966' },
  { name: 'Kazakistan', dialCode: '+7', flag: '🇰🇿', digits: '7' },
  { name: 'Özbekistan', dialCode: '+998', flag: '🇺🇿', digits: '998' },
  { name: 'Türkmenistan', dialCode: '+993', flag: '🇹🇲', digits: '993' },
  { name: 'Kırgızistan', dialCode: '+996', flag: '🇰🇬', digits: '996' },
  { name: 'Rusya', dialCode: '+7', flag: '🇷🇺', digits: '7' },
  { name: 'Kıbrıs', dialCode: '+357', flag: '🇨🇾', digits: '357' },
];

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = '5XX XXX XX XX',
  required = false,
  disabled = false,
  className = '',
  id,
}: PhoneInputProps) {
  const isTypingRef = useRef(false);

  // Parse external value into country dialCode and local 10-digit number
  const parseValue = (val: string) => {
    if (!val) return { dialCode: '+90', local: '' };
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) return { dialCode: '+90', local: '' };

    // Match country code by digits length descending
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.digits.length - a.digits.length);
    for (const c of sorted) {
      if (clean.startsWith(c.digits) && clean.length > c.digits.length) {
        const local = clean.slice(c.digits.length).replace(/^0+/, '').slice(0, 10);
        return { dialCode: c.dialCode, local };
      }
    }
    // Fallback default: Turkey +90, strip any leading zero, limit to 10 digits
    return { dialCode: '+90', local: clean.replace(/^0+/, '').slice(0, 10) };
  };

  const initial = parseValue(value);
  const [countryDialCode, setCountryDialCode] = useState<string>(initial.dialCode);
  const [localNumber, setLocalNumber] = useState<string>(initial.local);

  useEffect(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      return;
    }
    const { dialCode, local } = parseValue(value);
    setCountryDialCode(dialCode);
    setLocalNumber(local);
  }, [value]);

  const handleCountryChange = (newDialCode: string) => {
    isTypingRef.current = true;
    setCountryDialCode(newDialCode);
    const country = COUNTRY_CODES.find((c) => c.dialCode === newDialCode);
    const digits = country ? country.digits : '90';
    if (!localNumber) {
      onChange('');
    } else {
      onChange(`${digits}${localNumber}`);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isTypingRef.current = true;
    let raw = e.target.value.replace(/\D/g, '');

    // If user pasted a full international number with country code (e.g. 905524185530)
    const currentCountry = COUNTRY_CODES.find((c) => c.dialCode === countryDialCode);
    const countryDigits = currentCountry ? currentCountry.digits : '90';
    if (raw.startsWith(countryDigits) && raw.length > 10) {
      raw = raw.slice(countryDigits.length);
    }

    // Strip leading 0 and cap at 10 digits
    const clean = raw.replace(/^0+/, '').slice(0, 10);
    setLocalNumber(clean);

    if (!clean) {
      onChange('');
    } else {
      onChange(`${countryDigits}${clean}`);
    }
  };

  return (
    <div
      className={`relative flex items-stretch w-full rounded-xl border border-gray-200 bg-white transition focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-200 overflow-hidden shadow-xs ${
        disabled ? 'opacity-60 pointer-events-none bg-gray-50' : ''
      } ${className}`}
    >
      {/* Country Code Bar */}
      <div className="relative flex items-center bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition shrink-0">
        <select
          value={countryDialCode}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={disabled}
          className="h-full pl-3 pr-7 py-2.5 bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer appearance-none select-none"
          title="Ülke Kodu Seçin"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={`${c.dialCode}-${c.name}`} value={c.dialCode}>
              {c.flag} {c.dialCode} ({c.name})
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
      </div>

      {/* 10-Digit Local Phone Input */}
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={10}
        placeholder={placeholder}
        value={localNumber}
        onChange={handleNumberChange}
        required={required}
        disabled={disabled}
        className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-800 outline-none bg-transparent placeholder:text-gray-400"
      />

      {/* Character counter / Completed Indicator */}
      <div className="flex items-center pr-3 shrink-0 select-none">
        {localNumber.length === 10 ? (
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
            <Check className="h-3 w-3" /> 10
          </span>
        ) : localNumber.length > 0 ? (
          <span className="text-[10px] font-bold text-gray-400">
            {localNumber.length}/10
          </span>
        ) : null}
      </div>
    </div>
  );
}
