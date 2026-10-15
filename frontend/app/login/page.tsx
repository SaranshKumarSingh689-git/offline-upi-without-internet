"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [showPin, setShowPin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      console.log("Login successful:", data);

      // Store JWT
      localStorage.setItem("token", data.token);

      // Redirect to home/dashboard
      router.push("/home");
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8faf9] flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md min-h-[calc(100vh-48px)] bg-white rounded-[28px] shadow-xl border border-slate-100 overflow-hidden flex flex-col">

        {/* Header */}
        <header className="flex items-center px-6 pt-6">
          <Link
            href="/"
            className="text-2xl text-[#071b35] hover:opacity-70 transition"
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

        {/* Main */}
        <section className="flex-1 px-6 pt-14">

          {/* Heading */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#071b35]">
              Welcome Back
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Login to your account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin}>

            {/* Email */}
            <div className="mt-8">
              <label className="block text-sm font-semibold text-[#071b35] mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full h-14 px-4 border border-slate-200 rounded-xl outline-none focus:border-[#071b35] text-sm text-[#071b35] placeholder:text-slate-400"
              />
            </div>

            {/* Password */}
            <div className="mt-4 relative">
              <label className="block text-sm font-semibold text-[#071b35] mb-2">
                Account Password
              </label>

              <input
                type={showPin ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                className="w-full h-14 px-4 pr-12 border border-slate-200 rounded-xl outline-none focus:border-[#071b35] text-sm text-[#071b35] placeholder:text-slate-400"
              />

              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 bottom-4 text-slate-500 text-lg"
              >
                {showPin ? "◉" : "◌"}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Forgot Password */}
            <div className="flex justify-end mt-3">
              <button
                type="button"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login */}
            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full h-14 rounded-xl bg-[#071b35] text-white font-semibold hover:bg-[#0d294d] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          {/* OR */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-200" />

            <span className="text-xs text-slate-400 font-medium">
              OR
            </span>

            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Biometric */}
          <button
            type="button"
            className="w-full h-14 rounded-xl border border-slate-300 flex items-center justify-center gap-3 text-sm font-semibold text-[#071b35] hover:bg-slate-50 transition"
          >
            <span className="text-xl">
              ◎
            </span>

            Login with Biometric
          </button>

          {/* Register */}
          <p className="text-center text-sm text-slate-500 mt-7">
            Don't have an account?{" "}

            <Link
              href="/register"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Register
            </Link>
          </p>

        </section>

        {/* Bottom */}
        <div className="px-6 pb-7 pt-5 text-center">
          <p className="text-[11px] text-slate-400">
            Secure payments • Online & Offline
          </p>
        </div>

      </div>
    </main>
  );
}