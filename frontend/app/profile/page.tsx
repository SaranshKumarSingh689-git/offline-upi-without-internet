"use client";

import Link from "next/link";
import { useState } from "react";

export default function ProfilePage() {
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);

  return (
    <main className="min-h-screen bg-[#f5f7f6] flex justify-center">

      <div className="w-full max-w-130 min-h-screen bg-white shadow-xl flex flex-col">

        {/* ================= HEADER ================= */}

        <header className="px-6 pt-6 pb-4">

          <div className="flex items-center gap-4">

            <Link
              href="/home"
              className="text-2xl text-[#071b35]"
            >
              ←
            </Link>

            <h1 className="text-xl font-bold text-[#071b35]">
              Profile & Settings
            </h1>

          </div>

        </header>


        {/* ================= CONTENT ================= */}

        <section className="flex-1 px-6 pb-8">

          {/* Profile Card */}

          <div className="mt-3 rounded-2xl bg-[#f8faf9] border border-slate-100 p-5">

            <div className="flex items-center gap-4">

              <div
                className="
                  w-16 h-16
                  rounded-full
                  bg-[#071b35]
                  text-white
                  flex items-center
                  justify-center
                  text-xl
                  font-bold
                "
              >
                S
              </div>

              <div className="flex-1">

                <h2 className="text-lg font-bold text-[#071b35]">
                  Saransh Kumar Singh
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  +91 98XXXXXX20
                </p>

                <p className="text-xs text-green-600 font-medium mt-1">
                  saransh@upi
                </p>

              </div>

              <button className="text-blue-600 text-sm font-semibold">
                Edit
              </button>

            </div>

          </div>


          {/* ================= ACCOUNT ================= */}

          <h2 className="mt-7 text-sm font-bold text-[#071b35]">
            Account
          </h2>

          <div className="mt-2 rounded-2xl border border-slate-100 overflow-hidden">

            <SettingsItem
              icon="👤"
              title="Personal Information"
              subtitle="Name, mobile number and UPI ID"
            />

            <SettingsItem
              icon="🔐"
              title="Change PIN"
              subtitle="Update your payment PIN"
            />

            <SettingsItem
              icon="🏦"
              title="Bank Accounts"
              subtitle="Manage linked accounts"
              last
            />

          </div>


          {/* ================= SECURITY ================= */}

          <h2 className="mt-7 text-sm font-bold text-[#071b35]">
            Security
          </h2>

          <div className="mt-2 rounded-2xl border border-slate-100 overflow-hidden">

            {/* Biometric */}

            <div className="flex items-center gap-3 px-4 py-4">

              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                🔒
              </div>

              <div className="flex-1">

                <p className="text-sm font-semibold text-[#071b35]">
                  Biometric Login
                </p>

                <p className="text-xs text-slate-500 mt-0.5">
                  Use fingerprint or face authentication
                </p>

              </div>

              <button
                onClick={() => setBiometric(!biometric)}
                className={`
                  w-11 h-6
                  rounded-full
                  p-1
                  transition
                  ${
                    biometric
                      ? "bg-green-500"
                      : "bg-slate-300"
                  }
                `}
              >
                <div
                  className={`
                    w-4 h-4
                    bg-white
                    rounded-full
                    transition
                    ${
                      biometric
                        ? "translate-x-5"
                        : "translate-x-0"
                    }
                  `}
                />
              </button>

            </div>


            {/* Notifications */}

            <div className="flex items-center gap-3 px-4 py-4 border-t border-slate-100">

              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                🔔
              </div>

              <div className="flex-1">

                <p className="text-sm font-semibold text-[#071b35]">
                  Notifications
                </p>

                <p className="text-xs text-slate-500 mt-0.5">
                  Payment and security alerts
                </p>

              </div>

              <button
                onClick={() => setNotifications(!notifications)}
                className={`
                  w-11 h-6
                  rounded-full
                  p-1
                  transition
                  ${
                    notifications
                      ? "bg-green-500"
                      : "bg-slate-300"
                  }
                `}
              >
                <div
                  className={`
                    w-4 h-4
                    bg-white
                    rounded-full
                    transition
                    ${
                      notifications
                        ? "translate-x-5"
                        : "translate-x-0"
                    }
                  `}
                />
              </button>

            </div>


            {/* Offline Security */}

            <div className="flex items-center gap-3 px-4 py-4 border-t border-slate-100">

              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                📶
              </div>

              <div className="flex-1">

                <p className="text-sm font-semibold text-[#071b35]">
                  Offline Security
                </p>

                <p className="text-xs text-slate-500 mt-0.5">
                  Secure offline transactions enabled
                </p>

              </div>

              <span className="text-green-600 text-xs font-semibold">
                Active
              </span>

            </div>

          </div>


          {/* ================= SUPPORT ================= */}

          <h2 className="mt-7 text-sm font-bold text-[#071b35]">
            Support
          </h2>

          <div className="mt-2 rounded-2xl border border-slate-100 overflow-hidden">

            <SettingsItem
              icon="❓"
              title="Help & Support"
              subtitle="Get help with your payments"
            />

            <SettingsItem
              icon="📄"
              title="Terms & Privacy"
              subtitle="Read our policies"
            />

            <SettingsItem
              icon="ℹ️"
              title="About Offline UPI"
              subtitle="Version 1.0.0"
              last
            />

          </div>


          {/* Logout */}

          <button
            className="
              mt-6
              w-full
              h-14
              rounded-xl
              border
              border-red-200
              bg-red-50
              text-red-600
              font-semibold
            "
          >
            Logout
          </button>


          <p className="text-center text-[11px] text-slate-400 mt-5">
            Offline UPI • Secure Payments
          </p>

        </section>


        {/* ================= BOTTOM NAV ================= */}

        <nav className="w-full bg-white border-t border-slate-200 px-6 py-3 shrink-0">

          <div className="flex items-center justify-between">

            <NavItem
              href="/home"
              icon="⌂"
              label="Home"
            />

            <NavItem
              href="/transactions"
              icon="≡"
              label="Transactions"
            />

            <NavItem
              href="/scan"
              icon="▦"
              label="Scan"
            />

            <NavItem
              href="/profile"
              icon="○"
              label="Profile"
              active
            />

          </div>

        </nav>

      </div>

    </main>
  );
}


/* ================================================= */
/* SETTINGS ITEM                                    */
/* ================================================= */

function SettingsItem({
  icon,
  title,
  subtitle,
  last = false,
}: {
  icon: string;
  title: string;
  subtitle: string;
  last?: boolean;
}) {
  return (
    <button
      className={`
        w-full
        flex
        items-center
        gap-3
        px-4
        py-4
        text-left
        hover:bg-slate-50
        transition
        ${!last ? "border-b border-slate-100" : ""}
      `}
    >

      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
        {icon}
      </div>

      <div className="flex-1">

        <p className="text-sm font-semibold text-[#071b35]">
          {title}
        </p>

        <p className="text-xs text-slate-500 mt-0.5">
          {subtitle}
        </p>

      </div>

      <span className="text-slate-400 text-xl">
        ›
      </span>

    </button>
  );
}


/* ================================================= */
/* NAV ITEM                                         */
/* ================================================= */

function NavItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        flex
        flex-col
        items-center
        gap-1
        ${
          active
            ? "text-[#071b35]"
            : "text-slate-400"
        }
      `}
    >

      <span className="text-xl">
        {icon}
      </span>

      <span
        className={`
          text-[10px]
          ${active ? "font-semibold" : ""}
        `}
      >
        {label}
      </span>

    </Link>
  );
}