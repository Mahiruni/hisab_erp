"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "../lib/actions/auth";
import type { UserContext } from "../lib/data/types";
import { Icon } from "./ui/icon";

type MenuUser = Pick<UserContext, "fullName" | "email" | "organizationName" | "role" | "avatarUrl" | "provider">;

function initials(name: string) {
  const value = name.trim();
  if (!value) return "U";
  return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function roleLabel(role: MenuUser["role"]) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function providerLabel(provider: string | null) {
  if (provider === "google") return "Signed in with Google";
  if (provider === "apple") return "Signed in with Apple";
  if (provider === "phone") return "Signed in with mobile";
  return "Secure account";
}

export function UserMenu({ user }: { user: MenuUser }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); }
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div className="sticky-user-menu" ref={rootRef}>
      <button className="sticky-user-trigger" type="button" aria-haspopup="menu" aria-expanded={open} aria-label="Open user account menu" onClick={() => setOpen((current) => !current)}>
        <span className="sticky-user-avatar" aria-hidden="true">{user.avatarUrl ? <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer"/> : initials(user.fullName)}</span>
        <span className="sticky-user-online" aria-hidden="true"/>
      </button>
      {open ? (
        <section className="sticky-user-popover" role="menu" aria-label="User account">
          <div className="sticky-user-profile"><span className="sticky-user-profile-avatar" aria-hidden="true">{user.avatarUrl ? <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer"/> : initials(user.fullName)}</span><div><strong>{user.fullName}</strong><span>{user.email || providerLabel(user.provider)}</span></div></div>
          <div className="sticky-user-context"><span>{user.organizationName}</span><strong>{roleLabel(user.role)}</strong></div>
          <nav aria-label="Account navigation">
            <Link role="menuitem" href="/account" onClick={() => setOpen(false)}><Icon name="shield-check" size={20}/><div><strong>Account &amp; security</strong><small>{providerLabel(user.provider)}</small></div><Icon name="chevron-right" size={18}/></Link>
            <Link role="menuitem" href="/billing" onClick={() => setOpen(false)}><Icon name="wallet" size={20}/><div><strong>Payments &amp; paid access</strong><small>Chapa payments, plan and access period</small></div><Icon name="chevron-right" size={18}/></Link>
          </nav>
          <form action={signOut}><button className="sticky-user-logout button-with-icon" type="submit" role="menuitem"><Icon name="log-out" size={18}/><strong>Log out</strong></button></form>
        </section>
      ) : null}
    </div>
  );
}
