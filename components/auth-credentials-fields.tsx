"use client";

import { useMemo, useState } from "react";
import type { Language } from "../lib/translations";

type Country = {
  name: string;
  iso: string;
  dial: string;
  flag: string;
  placeholder: string;
};

const countries: Country[] = [
  { name: "Ethiopia", iso: "ET", dial: "+251", flag: "🇪🇹", placeholder: "9XXXXXXXX" },
  { name: "Eritrea", iso: "ER", dial: "+291", flag: "🇪🇷", placeholder: "7XXXXXX" },
  { name: "Kenya", iso: "KE", dial: "+254", flag: "🇰🇪", placeholder: "7XXXXXXXX" },
  { name: "Djibouti", iso: "DJ", dial: "+253", flag: "🇩🇯", placeholder: "77XXXXXX" },
  { name: "Somalia", iso: "SO", dial: "+252", flag: "🇸🇴", placeholder: "6XXXXXXX" },
  { name: "Sudan", iso: "SD", dial: "+249", flag: "🇸🇩", placeholder: "9XXXXXXXX" },
  { name: "South Sudan", iso: "SS", dial: "+211", flag: "🇸🇸", placeholder: "9XXXXXXXX" },
  { name: "Uganda", iso: "UG", dial: "+256", flag: "🇺🇬", placeholder: "7XXXXXXXX" },
  { name: "Tanzania", iso: "TZ", dial: "+255", flag: "🇹🇿", placeholder: "7XXXXXXXX" },
  { name: "Rwanda", iso: "RW", dial: "+250", flag: "🇷🇼", placeholder: "7XXXXXXXX" },
  { name: "Burundi", iso: "BI", dial: "+257", flag: "🇧🇮", placeholder: "7XXXXXXX" },
  { name: "Egypt", iso: "EG", dial: "+20", flag: "🇪🇬", placeholder: "10XXXXXXXX" },
  { name: "Nigeria", iso: "NG", dial: "+234", flag: "🇳🇬", placeholder: "8XXXXXXXXX" },
  { name: "Ghana", iso: "GH", dial: "+233", flag: "🇬🇭", placeholder: "2XXXXXXXX" },
  { name: "South Africa", iso: "ZA", dial: "+27", flag: "🇿🇦", placeholder: "7XXXXXXXX" },
  { name: "Morocco", iso: "MA", dial: "+212", flag: "🇲🇦", placeholder: "6XXXXXXXX" },
  { name: "Algeria", iso: "DZ", dial: "+213", flag: "🇩🇿", placeholder: "5XXXXXXXX" },
  { name: "Tunisia", iso: "TN", dial: "+216", flag: "🇹🇳", placeholder: "XXXXXXXX" },
  { name: "United Arab Emirates", iso: "AE", dial: "+971", flag: "🇦🇪", placeholder: "5XXXXXXXX" },
  { name: "Saudi Arabia", iso: "SA", dial: "+966", flag: "🇸🇦", placeholder: "5XXXXXXXX" },
  { name: "Qatar", iso: "QA", dial: "+974", flag: "🇶🇦", placeholder: "XXXXXXXX" },
  { name: "Kuwait", iso: "KW", dial: "+965", flag: "🇰🇼", placeholder: "XXXXXXXX" },
  { name: "Turkey", iso: "TR", dial: "+90", flag: "🇹🇷", placeholder: "5XXXXXXXXX" },
  { name: "United Kingdom", iso: "GB", dial: "+44", flag: "🇬🇧", placeholder: "7XXXXXXXXX" },
  { name: "United States", iso: "US", dial: "+1", flag: "🇺🇸", placeholder: "XXXXXXXXXX" },
  { name: "Canada", iso: "CA", dial: "+1", flag: "🇨🇦", placeholder: "XXXXXXXXXX" },
  { name: "Germany", iso: "DE", dial: "+49", flag: "🇩🇪", placeholder: "15XXXXXXXXX" },
  { name: "France", iso: "FR", dial: "+33", flag: "🇫🇷", placeholder: "6XXXXXXXX" },
  { name: "Italy", iso: "IT", dial: "+39", flag: "🇮🇹", placeholder: "3XXXXXXXXX" },
  { name: "Netherlands", iso: "NL", dial: "+31", flag: "🇳🇱", placeholder: "6XXXXXXXX" },
  { name: "Sweden", iso: "SE", dial: "+46", flag: "🇸🇪", placeholder: "7XXXXXXXX" },
  { name: "Norway", iso: "NO", dial: "+47", flag: "🇳🇴", placeholder: "XXXXXXXX" },
  { name: "Switzerland", iso: "CH", dial: "+41", flag: "🇨🇭", placeholder: "7XXXXXXXX" },
  { name: "India", iso: "IN", dial: "+91", flag: "🇮🇳", placeholder: "9XXXXXXXXX" },
  { name: "China", iso: "CN", dial: "+86", flag: "🇨🇳", placeholder: "1XXXXXXXXXX" },
  { name: "Japan", iso: "JP", dial: "+81", flag: "🇯🇵", placeholder: "9XXXXXXXXX" },
  { name: "Australia", iso: "AU", dial: "+61", flag: "🇦🇺", placeholder: "4XXXXXXXX" },
];

const copy = {
  en: {
    country: "Country code",
    phone: "Mobile number",
    phoneHelp: "Ethiopia: enter 9 digits after +251, starting with 9 (the local form is 09XXXXXXXX).",
    otherPhoneHelp: "Enter the mobile number without spaces or the leading international + sign.",
    password: "Password",
    confirm: "Confirm password",
    mismatch: "Passwords must match.",
    strength: "Password strength",
    weak: "Weak",
    fair: "Fair",
    strong: "Strong",
    show: "Show",
    hide: "Hide",
  },
  am: {
    country: "የአገር ኮድ",
    phone: "የሞባይል ቁጥር",
    phoneHelp: "ኢትዮጵያ፦ ከ+251 በኋላ በ9 የሚጀምሩ 9 አሃዞችን ያስገቡ (የአገር ውስጥ ቅርጽ 09XXXXXXXX)።",
    otherPhoneHelp: "ቁጥሩን ያለ ክፍተትና ያለ + ምልክት ያስገቡ።",
    password: "የይለፍ ቃል",
    confirm: "የይለፍ ቃል ያረጋግጡ",
    mismatch: "የይለፍ ቃሎቹ መመሳሰል አለባቸው።",
    strength: "የይለፍ ቃል ጥንካሬ",
    weak: "ደካማ",
    fair: "መካከለኛ",
    strong: "ጠንካራ",
    show: "አሳይ",
    hide: "ደብቅ",
  },
  ti: {
    country: "ኮድ ሃገር",
    phone: "ቁጽሪ ሞባይል",
    phoneHelp: "ኢትዮጵያ፦ ድሕሪ +251 ብ9 ዝጅምሩ 9 ኣሃዛት ኣእትዉ (ናይ ውሽጢ ሃገር ቅርጺ 09XXXXXXXX)።",
    otherPhoneHelp: "ቁጽሪ ብዘይ ክፍተትን ብዘይ + ምልክትን ኣእትዉ።",
    password: "መሕለፊ ቃል",
    confirm: "መሕለፊ ቃል ኣረጋግጹ",
    mismatch: "መሕለፊ ቃላት ክመሳሰሉ ኣለዎም።",
    strength: "ጥንካረ መሕለፊ ቃል",
    weak: "ድኹም",
    fair: "ማእከላይ",
    strong: "ጽኑዕ",
    show: "ኣርኢ",
    hide: "ሕባእ",
  },
} as const;

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.7a2 2 0 002.8 2.8M9.9 4.2A10.8 10.8 0 0112 4c5.2 0 8.7 4.5 9.5 5.7a1.5 1.5 0 010 1.6 16 16 0 01-2.4 2.8M6.2 6.2A16.7 16.7 0 002.5 9.7a1.5 1.5 0 000 1.6C3.3 12.5 6.8 17 12 17a10 10 0 003.1-.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 9.7C3.3 8.5 6.8 4 12 4s8.7 4.5 9.5 5.7a1.5 1.5 0 010 1.6C20.7 12.5 17.2 17 12 17S3.3 12.5 2.5 11.3a1.5 1.5 0 010-1.6z" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="10.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8"/></svg>
  );
}

export function AuthCredentialsFields({ mode, language, passwordHelp }: { mode: "sign-in" | "sign-up"; language: Language; passwordHelp?: string }) {
  const c = copy[language];
  const [countryIso, setCountryIso] = useState("ET");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const country = countries.find((item) => item.iso === countryIso) || countries[0];
  const isEthiopia = country.iso === "ET";
  const phoneValid = isEthiopia ? /^9\d{8}$/.test(phone) : /^\d{6,14}$/.test(phone);
  const passwordScore = useMemo(() => {
    let score = 0;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const strengthLabel = passwordScore <= 1 ? c.weak : passwordScore <= 3 ? c.fair : c.strong;

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, "");
    setPhone(digits.slice(0, isEthiopia ? 9 : 14));
  }

  return (
    <div className="auth-credentials">
      <input type="hidden" name="countryCode" value={country.dial}/>
      <div className="phone-field-group">
        <label className="premium-field country-field">
          <span className="field-label">{c.country}</span>
          <span className="field-control country-control">
            <span className="country-flag" aria-hidden="true">{country.flag}</span>
            <select
              name="country"
              value={country.iso}
              aria-label={c.country}
              onChange={(event) => {
                setCountryIso(event.target.value);
                setPhone("");
              }}
            >
              {countries.map((item) => <option key={item.iso} value={item.iso}>{item.flag} {item.name} ({item.dial})</option>)}
            </select>
          </span>
        </label>

        <label className="premium-field phone-number-field">
          <span className="field-label">{c.phone}</span>
          <span className={`field-control phone-control ${phone && phoneValid ? "is-valid" : ""}`}>
            <span className="dial-prefix">{country.dial}</span>
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(event) => handlePhoneChange(event.target.value)}
              placeholder={country.placeholder}
              minLength={isEthiopia ? 9 : 6}
              maxLength={isEthiopia ? 9 : 14}
              pattern={isEthiopia ? "9[0-9]{8}" : "[0-9]{6,14}"}
              required
              aria-describedby="phone-guidance"
            />
            <span className="valid-check" aria-hidden="true">✓</span>
          </span>
        </label>
      </div>
      <small id="phone-guidance" className="phone-guidance">{isEthiopia ? c.phoneHelp : c.otherPhoneHelp}</small>

      <label className="premium-field">
        <span className="field-label">{c.password}</span>
        <span className="field-control password-control">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            minLength={mode === "sign-in" ? 8 : 10}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? c.hide : c.show}>
            <EyeIcon hidden={!showPassword}/>
          </button>
        </span>
      </label>

      {mode === "sign-up" && (
        <>
          <div className="password-strength" data-score={passwordScore}>
            <div className="strength-heading"><span>{c.strength}</span><strong>{strengthLabel}</strong></div>
            <div className="strength-track"><i/><i/><i/><i/></div>
          </div>
          {passwordHelp && <small className="password-help">{passwordHelp}</small>}
          <label className="premium-field">
            <span className="field-label">{c.confirm}</span>
            <span className={`field-control password-control ${confirmPassword && password === confirmPassword ? "is-valid" : ""}`}>
              <input
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                minLength={10}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                pattern={password ? password.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : undefined}
                title={c.mismatch}
                required
              />
              <span className="valid-check" aria-hidden="true">✓</span>
              <button className="password-toggle" type="button" onClick={() => setShowConfirm((value) => !value)} aria-label={showConfirm ? c.hide : c.show}>
                <EyeIcon hidden={!showConfirm}/>
              </button>
            </span>
          </label>
          {confirmPassword && password !== confirmPassword && <small className="field-error">{c.mismatch}</small>}
        </>
      )}
    </div>
  );
}
