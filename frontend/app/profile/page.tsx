"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type UserProfile = {
  _id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  upiId?: string;
  balance?: number;
};

type ProfileResponse = {
  success?: boolean;
  message?: string;
  user?: UserProfile;
  profile?: UserProfile;
} & UserProfile;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

function formatBalance(balance?: number): string {
  if (typeof balance !== "number" || !Number.isFinite(balance)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(balance);
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [activeDialog, setActiveDialog] = useState<"personal" | "pin" | "bank" | "support" | "terms" | "about" | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = (await apiRequest("/api/users/profile")) as ProfileResponse;
      const user = response?.user ?? response?.profile ?? response;

      if (!user || typeof user !== "object") {
        throw new Error(response?.message || "The server returned an invalid profile.");
      }

      setProfile(user);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleLogout = () => {
    setSigningOut(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      router.replace("/login");
    } catch {
      setError("Unable to log out. Please try again.");
      setSigningOut(false);
    }
  };

  const displayName = profile?.fullName || profile?.name || "Your profile";
  const displayPhone = profile?.phone || "Phone number not provided";
  const displayUpiId = profile?.upiId || "UPI ID not set";
  const displayEmail = profile?.email || "Email not provided";

  return (
    <main className="min-h-screen flex justify-center bg-[#f5f7f6]">
      <div className="flex min-h-screen w-full max-w-130 flex-col bg-white shadow-xl">
        <header className="px-6 pb-4 pt-6">
          <div className="flex items-center gap-4">
            <Link href="/home" aria-label="Back to home" className="text-2xl text-[#071b35]">
              ←
            </Link>
            <h1 className="text-xl font-bold text-[#071b35]">Profile &amp; Settings</h1>
          </div>
        </header>

        <section className="flex-1 px-6 pb-8">
          <div className="mt-3 rounded-2xl border border-slate-100 bg-[#f8faf9] p-5">
            {loading ? (
              <div className="flex items-center gap-4" aria-live="polite">
                <div className="h-16 w-16 animate-pulse rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#071b35] text-xl font-bold text-white">
                  {initials(displayName)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="wrap-break-wordbreak-words text-lg font-bold text-[#071b35]">{displayName}</h2>
                  <p className="mt-1 wrap-break-word text-sm text-slate-500">{displayPhone}</p>
                  <p className="mt-1 wrap-break-word text-xs font-medium text-green-600">{displayUpiId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDialog("personal")}
                  className="shrink-0 text-sm font-semibold text-blue-600"
                >
                  View
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p>{error}</p>
                <button type="button" onClick={() => void loadProfile()} className="mt-2 font-semibold underline">
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-sm text-slate-500">Available balance</span>
                <span className="font-bold text-[#071b35]">{formatBalance(profile?.balance)}</span>
              </div>
            )}
          </div>

          <h2 className="mt-7 text-sm font-bold text-[#071b35]">Account</h2>
          <div className="mt-2 overflow-hidden rounded-2xl border border-slate-100">
            <SettingsItem icon="👤" title="Personal Information" subtitle="Name, email, mobile number and UPI ID" onClick={() => setActiveDialog("personal")} />
            <SettingsItem icon="🔐" title="Change PIN" subtitle="Payment PIN settings" onClick={() => setActiveDialog("pin")} />
            <SettingsItem icon="🏦" title="Bank Accounts" subtitle="Linked bank accounts" onClick={() => setActiveDialog("bank")} last />
          </div>

          <h2 className="mt-7 text-sm font-bold text-[#071b35]">Security</h2>
          <div className="mt-2 overflow-hidden rounded-2xl border border-slate-100">
            <ToggleItem
              icon="🔒"
              title="Biometric Login"
              subtitle="Preference for fingerprint or face authentication"
              enabled={biometric}
              onToggle={() => setBiometric((value) => !value)}
            />
            <ToggleItem
              icon="🔔"
              title="Notifications"
              subtitle="Payment and security alerts preference"
              enabled={notifications}
              onToggle={() => setNotifications((value) => !value)}
              borderTop
            />
            <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">📶</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#071b35]">Offline Security</p>
                <p className="mt-0.5 text-xs text-slate-500">Signed packets and replay protection</p>
              </div>
              <span className="text-xs font-semibold text-green-600">Enabled</span>
            </div>
          </div>

          <h2 className="mt-7 text-sm font-bold text-[#071b35]">Support</h2>
          <div className="mt-2 overflow-hidden rounded-2xl border border-slate-100">
            <SettingsItem icon="❓" title="Help & Support" subtitle="Get help with your payments" onClick={() => setActiveDialog("support")} />
            <SettingsItem icon="📄" title="Terms & Privacy" subtitle="Read our policies" onClick={() => setActiveDialog("terms")} />
            <SettingsItem icon="ℹ️" title="About Offline UPI" subtitle="Version 1.0.0" onClick={() => setActiveDialog("about")} last />
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="mt-6 h-14 w-full rounded-xl border border-red-200 bg-red-50 font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signingOut ? "Logging out..." : "Logout"}
          </button>

          <p className="mt-5 text-center text-[11px] text-slate-400">Offline UPI • Secure Payments</p>
        </section>

        <nav className="shrink-0 border-t border-slate-200 bg-white px-6 py-3">
          <div className="flex items-center justify-between">
            <NavItem href="/home" icon="⌂" label="Home" />
            <NavItem href="/transactions" icon="≡" label="Transactions" />
            <NavItem href="/scan" icon="▦" label="Scan" />
            <NavItem href="/profile" icon="○" label="Profile" active />
          </div>
        </nav>
      </div>

      {activeDialog && (
        <Dialog title={dialogTitle(activeDialog)} onClose={() => setActiveDialog(null)}>
          {activeDialog === "personal" && (
            <div className="space-y-4">
              <DetailRow label="Full name" value={displayName} />
              <DetailRow label="Email" value={displayEmail} />
              <DetailRow label="Mobile number" value={displayPhone} />
              <DetailRow label="UPI ID" value={displayUpiId} />
              <p className="text-xs leading-5 text-slate-500">
                These details are read from your authenticated profile. Profile editing is not enabled here because an update endpoint has not been confirmed.
              </p>
            </div>
          )}
          {activeDialog === "pin" && (
            <p className="text-sm leading-6 text-slate-600">
              Your payment PIN is used when authorizing a payment. This screen does not change your PIN because the backend PIN-update endpoint and required verification flow have not been confirmed.
            </p>
          )}
          {activeDialog === "bank" && (
            <p className="text-sm leading-6 text-slate-600">
              Bank account management is not connected to the current backend profile API. Your app currently uses its internal wallet balance for the offline-payment flow.
            </p>
          )}
          {activeDialog === "support" && (
            <p className="text-sm leading-6 text-slate-600">
              For this project, check the backend and frontend terminal logs first. If a payment issue occurs, keep the transaction ID and its status for troubleshooting.
            </p>
          )}
          {activeDialog === "terms" && (
            <p className="text-sm leading-6 text-slate-600">
              This is an academic offline-payment project. Do not use it to transfer real money. Offline payments remain pending until synchronization and server-side verification complete.
            </p>
          )}
          {activeDialog === "about" && (
            <div className="space-y-2 text-sm text-slate-600">
              <p className="font-semibold text-[#071b35]">Offline UPI</p>
              <p>Version 1.0.0</p>
              <p>Next.js frontend with an authenticated Express backend and signed offline transaction packets.</p>
            </div>
          )}
        </Dialog>
      )}
    </main>
  );
}

function dialogTitle(type: NonNullable<ProfilePageDialog>) {
  const titles: Record<NonNullable<ProfilePageDialog>, string> = {
    personal: "Personal Information",
    pin: "Change PIN",
    bank: "Bank Accounts",
    support: "Help & Support",
    terms: "Terms & Privacy",
    about: "About Offline UPI",
  };
  return titles[type];
}

type ProfilePageDialog = "personal" | "pin" | "bank" | "support" | "terms" | "about" | null;

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 pb-3 last:border-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 wrap-break-word text-sm font-semibold text-[#071b35]">{value}</p>
    </div>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-120 rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[#071b35]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100">×</button>
        </div>
        {children}
        <button type="button" onClick={onClose} className="mt-6 h-11 w-full rounded-xl bg-[#071b35] font-semibold text-white hover:bg-[#102b4e]">
          Done
        </button>
      </section>
    </div>
  );
}

function SettingsItem({
  icon,
  title,
  subtitle,
  last = false,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  last?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50 ${!last ? "border-b border-slate-100" : ""}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[#071b35]">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>
      <span className="text-xl text-slate-400">›</span>
    </button>
  );
}

function ToggleItem({
  icon,
  title,
  subtitle,
  enabled,
  onToggle,
  borderTop = false,
}: {
  icon: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: () => void;
  borderTop?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-4 ${borderTop ? "border-t border-slate-100" : ""}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[#071b35]">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${title} ${enabled ? "enabled" : "disabled"}`}
        onClick={onToggle}
        className={`relative h-6 w-11 rounded-full p-1 transition ${enabled ? "bg-green-500" : "bg-slate-300"}`}
      >
        <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string; icon: string; label: string; active?: boolean }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 ${active ? "text-[#071b35]" : "text-slate-400"}`}>
      <span className="text-xl">{icon}</span>
      <span className={`text-[10px] ${active ? "font-semibold" : ""}`}>{label}</span>
    </Link>
  );
}
