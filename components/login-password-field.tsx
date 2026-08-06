"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./ui/icon";

export function LoginPasswordField({
  label,
  placeholder,
  forgotLabel,
  forgotHref,
}: {
  label: string;
  placeholder: string;
  forgotLabel: string;
  forgotHref: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="biloo-login-field">
      <div className="biloo-login-field-label-row">
        <label htmlFor="login-password">{label}</label>
        <Link href={forgotHref}>{forgotLabel}</Link>
      </div>
      <div className="biloo-login-input-shell biloo-login-password-shell">
        <Icon name="lock" size={18} />
        <input
          id="login-password"
          name="password"
          type={visible ? "text" : "password"}
          autoComplete="current-password"
          placeholder={placeholder}
          required
        />
        <button
          type="button"
          className="biloo-login-password-toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
