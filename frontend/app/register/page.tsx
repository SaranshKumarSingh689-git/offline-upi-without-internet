"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [upiId, setUpiId] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !upiId.trim() ||
      !password ||
      !confirmPassword ||
      !pin ||
      !confirmPin
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+$/.test(upiId.trim())) {
      setError("Please enter a valid UPI ID.");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError("UPI PIN must be exactly 4 digits.");
      return;
    }

    if (pin !== confirmPin) {
      setError("UPI PINs do not match.");
      return;
    }

    let accountCreated = false;
    let authenticated = false;

    try {
      setLoading(true);

      // STEP 1: Register the user.
      // The backend registration controller does not accept a UPI PIN.

      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone,
          upiId: upiId.trim(),
        }),
      });

      accountCreated = true;

      // STEP 2: Log in to obtain the JWT token.

      const loginData = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (!loginData?.token) {
        throw new Error(
          "Account created, but login did not return an authentication token."
        );
      }

      // Store the JWT before making authenticated requests.

      localStorage.setItem("token", loginData.token);
      authenticated = true;

      // STEP 3: Set the initial UPI PIN using the protected endpoint.

      await apiRequest("/api/users/set-pin", {
        method: "POST",
        body: JSON.stringify({
          pin,
        }),
      });

      // STEP 4: Registration and PIN setup are complete.

      setSuccess(
        "Account created successfully! Your UPI PIN is set."
      );

      // Remove sensitive values from component state.

      setPassword("");
      setConfirmPassword("");
      setPin("");
      setConfirmPin("");

      // Redirect to the existing dashboard route.

      setTimeout(() => {
        router.push("/home");
      }, 1000);
    } catch (err) {
      console.error("Registration flow error:", err);

      if (accountCreated) {
        if (!authenticated) {
          setError(
            "Your account was created, but automatic login failed. Please log in using your registered credentials."
          );

          setTimeout(() => {
            router.push("/login");
          }, 2500);
        } else {
          setError(
            "Your account was created and you are logged in, but UPI PIN setup failed. Please check the PIN endpoint and try again."
          );
        }
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8faf9] flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md bg-white rounded-[28px] shadow-xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}

        <header className="flex items-center px-6 pt-6">
          <Link
            href="/login"
            className="text-2xl text-[#071b35] hover:opacity-70"
            aria-label="Back to login"
          >
            ←
          </Link>

          <div className="flex-1 flex justify-center pr-7">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  A
                </span>
              </div>

              <span className="text-xl font-bold text-[#071b35]">
                Offline UPI
              </span>
            </div>
          </div>
        </header>

        {/* Registration Form */}

        <section className="flex-1 px-6 pt-10 pb-8">
          <h1 className="text-3xl font-extrabold text-[#071b35]">
            Create Account
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Register to start making secure payments.
          </p>

          <form onSubmit={handleRegister}>
            {/* Full Name */}

            <div className="mt-7">
              <label
                htmlFor="fullName"
                className="block text-sm font-semibold text-[#071b35] mb-2"
              >
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                maxLength={100}
                className="w-full h-14 px-4 border border-slate-200 rounded-xl outline-none focus:border-[#071b35] text-sm"
                disabled={loading}
                required
              />
            </div>

            {/* Email */}

            <div className="mt-4">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-[#071b35] mb-2"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                maxLength={254}
                className="w-full h-14 px-4 border border-slate-200 rounded-xl outline-none focus:border-[#071b35] text-sm"
                disabled={loading}
                required
              />
            </div>

            {/* Mobile Number */}

            <div className="mt-4">
              <label
                htmlFor="phone"
                className="block text-sm font-semibold text-[#071b35] mb-2"
              >
                Mobile Number
              </label>

              <div className="flex h-14 border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#071b35]">
                <div className="px-4 flex items-center bg-slate-50 border-r border-slate-200 text-sm font-semibold">
                  +91
                </div>

                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="Enter mobile number"
                  className="flex-1 min-w-0 px-4 outline-none text-sm"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* UPI ID */}

            <div className="mt-4">
              <label
                htmlFor="upiId"
                className="block text-sm font-semibold text-[#071b35] mb-2"
              >
                UPI ID
              </label>

              <input
                id="upiId"
                type="text"
                autoComplete="off"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. yourname@upi"
                maxLength={100}
                className="w-full h-14 px-4 border border-slate-200 rounded-xl outline-none focus:border-[#071b35] text-sm"
                disabled={loading}
                required
              />
            </div>

            {/* Password */}

            <div className="mt-4">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-[#071b35] mb-2"
              >
                Account Password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create account password"
                minLength={6}
                className="w-full h-14 px-4 border border-slate-200 rounded-xl outline-none focus:border-[#071b35] text-sm"
                disabled={loading}
                required
              />
            </div>

            {/* Confirm Password */}

            <div className="mt-4">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-[#071b35] mb-2"
              >
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Re-enter account password"
                minLength={6}
                className="w-full h-14 px-4 border border-slate-200 rounded-xl outline-none focus:border-[#071b35] text-sm"
                disabled={loading}
                required
              />
            </div>

            {/* Create UPI PIN */}

            <div className="mt-4">
              <label
                htmlFor="pin"
                className="block text-sm font-semibold text-[#071b35] mb-2"
              >
                Create UPI PIN
              </label>

              <div className="relative">
                <input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  autoComplete="new-password"
                  value={pin}
                  onChange={(e) =>
                    setPin(
                      e.target.value.replace(/\D/g, "").slice(0, 4)
                    )
                  }
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  placeholder="Create 4-digit PIN"
                  className="w-full h-14 px-4 pr-12 border border-slate-200 rounded-xl outline-none focus:border-[#071b35] text-sm"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  disabled={loading}
                >
                  {showPin ? "◉" : "◌"}
                </button>
              </div>
            </div>

            {/* Confirm UPI PIN */}

            <div className="mt-4">
              <label
                htmlFor="confirmPin"
                className="block text-sm font-semibold text-[#071b35] mb-2"
              >
                Confirm UPI PIN
              </label>

              <div className="relative">
                <input
                  id="confirmPin"
                  type={showConfirmPin ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPin}
                  onChange={(e) =>
                    setConfirmPin(
                      e.target.value.replace(/\D/g, "").slice(0, 4)
                    )
                  }
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  placeholder="Re-enter your PIN"
                  className="w-full h-14 px-4 pr-12 border border-slate-200 rounded-xl outline-none focus:border-[#071b35] text-sm"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPin(!showConfirmPin)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                  aria-label={
                    showConfirmPin ? "Hide PIN" : "Show PIN"
                  }
                  disabled={loading}
                >
                  {showConfirmPin ? "◉" : "◌"}
                </button>
              </div>
            </div>

            {/* Security Notice */}

            <div className="mt-5 p-4 rounded-xl bg-green-50 border border-green-100">
              <div className="flex gap-3">
                <span className="text-green-600">🔐</span>

                <div>
                  <p className="text-sm font-semibold text-[#071b35]">
                    Your account is secure
                  </p>

                  <p className="text-xs text-slate-500 mt-1 leading-5">
                    Your account password and UPI PIN are handled
                    separately by the backend. Your PIN is set
                    after successful authentication.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}

            {error && (
              <div
                role="alert"
                className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            {/* Success Message */}

            {success && (
              <div
                role="status"
                className="mt-4 p-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-600"
              >
                {success}
              </div>
            )}

            {/* Register Button */}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full h-14 rounded-xl bg-[#071b35] text-white font-semibold hover:bg-[#0d294d] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Login Link */}

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Login
            </Link>
          </p>
        </section>

        {/* Footer */}

        <footer className="px-6 pb-7 pt-5 text-center">
          <p className="text-[11px] text-slate-400">
            Secure payments • Online & Offline
          </p>
        </footer>
      </div>
    </main>
  );
}