"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

interface Recipient {
  _id: string;
  fullName: string;
  upiId: string;
}

interface TransactionResponse {
  success?: boolean;
  message?: string;
  transaction?: {
    _id?: string;
    status?: string;
    amount?: number;
  };
}

export default function SendMoneyPage() {
  const router = useRouter();

  // Recipient state
  const [recipientInput, setRecipientInput] = useState("");
  const [recipient, setRecipient] = useState<Recipient | null>(null);

  // Payment state
  const [amount, setAmount] = useState("");
  const [upiPin, setUpiPin] = useState("");
  const [offline, setOffline] = useState(false);

  // UI state
  const [isFindingRecipient, setIsFindingRecipient] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Find recipient using their UPI ID
  const findRecipient = async () => {
    const upiId = recipientInput.trim();

    setError("");
    setSuccess("");
    setRecipient(null);

    if (!upiId) {
      setError("Please enter the recipient's UPI ID.");
      return;
    }

    setIsFindingRecipient(true);

    try {
      const data = await apiRequest(
        `/api/users/recipient?upiId=${encodeURIComponent(upiId)}`,
        {
          method: "GET",
        }
      );

      if (!data?.user?._id) {
        throw new Error(
          data?.message || "Recipient not found. Please check the UPI ID."
        );
      }

      setRecipient({
        _id: data.user._id,
        fullName: data.user.fullName,
        upiId: data.user.upiId,
      });

      setSuccess("Recipient verified successfully.");
    } catch (err) {
      setRecipient(null);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to find recipient."
      );
    } finally {
      setIsFindingRecipient(false);
    }
  };

  // Send money through the backend
  const handlePayment = async () => {
    setError("");
    setSuccess("");

    if (!recipient) {
      setError("Please find and verify the recipient first.");
      return;
    }

    const numericAmount = Number(amount);

    if (!amount.trim() || !Number.isFinite(numericAmount)) {
      setError("Please enter a valid amount.");
      return;
    }

    if (numericAmount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    if (Math.round(numericAmount * 100) !== numericAmount * 100) {
      setError("Amount cannot have more than two decimal places.");
      return;
    }

    if (!upiPin.trim()) {
      setError("Please enter your UPI PIN.");
      return;
    }

    if (!/^\d{4,6}$/.test(upiPin)) {
      setError("Please enter a valid 4–6 digit UPI PIN.");
      return;
    }

    setIsSending(true);

    try {
      const data: TransactionResponse = await apiRequest(
        "/api/transactions/send",
        {
          method: "POST",
          body: JSON.stringify({
            receiverId: recipient._id,
            amount: numericAmount,
            offline,
            upiPin,
          }),
        }
      );

      setSuccess(
        data.message ||
          (offline
            ? "Payment queued for synchronization."
            : "Payment completed successfully.")
      );

      setAmount("");
      setUpiPin("");
      setOffline(false);

      // Navigate to transaction history after showing the result.
      setTimeout(() => {
        router.push("/transactions");
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Payment failed. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Navigation */}
        <header className="mb-10 flex items-center justify-between">
          <Link
            href="/home"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 text-xl font-bold shadow-lg shadow-blue-500/20">
              U
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Offline UPI
              </h1>
              <p className="text-xs text-slate-400">
                Simple. Secure. Seamless.
              </p>
            </div>
          </Link>

          <Link
            href="/home"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            ← Dashboard
          </Link>
        </header>

        {/* Page heading */}
        <section className="mb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
            Payments
          </p>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Send Money
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
            Transfer money securely using a recipient&apos;s UPI ID.
            You can also queue a payment for offline synchronization.
          </p>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Main payment form */}
          <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-8">
            {/* Step 1: Recipient */}
            <div className="mb-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-sm font-bold text-blue-400">
                  1
                </div>

                <div>
                  <h3 className="font-semibold">Recipient details</h3>
                  <p className="text-sm text-slate-400">
                    Enter the recipient&apos;s UPI ID.
                  </p>
                </div>
              </div>

              <label
                htmlFor="recipient"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Recipient UPI ID
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="recipient"
                  type="text"
                  value={recipientInput}
                  onChange={(e) => {
                    setRecipientInput(e.target.value);
                    setRecipient(null);
                    setError("");
                    setSuccess("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      findRecipient();
                    }
                  }}
                  placeholder="example@upi"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

                <button
                  type="button"
                  onClick={findRecipient}
                  disabled={isFindingRecipient || isSending}
                  className="rounded-xl bg-blue-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isFindingRecipient
                    ? "Searching..."
                    : "Find Recipient"}
                </button>
              </div>

              {/* Verified recipient */}
              {recipient && (
                <div className="mt-4 flex items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-lg font-bold text-emerald-400">
                    {recipient.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {recipient.fullName}
                    </p>

                    <p className="mt-1 truncate text-sm text-slate-400">
                      {recipient.upiId}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-xs font-medium text-emerald-400">
                      ✓ Verified
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-8 border-t border-white/10" />

            {/* Step 2: Amount */}
            <div className="mb-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-sm font-bold text-blue-400">
                  2
                </div>

                <div>
                  <h3 className="font-semibold">Payment amount</h3>
                  <p className="text-sm text-slate-400">
                    How much would you like to send?
                  </p>
                </div>
              </div>

              <label
                htmlFor="amount"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Amount (₹)
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">
                  ₹
                </span>

                <input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 py-5 pl-11 pr-4 text-3xl font-semibold outline-none transition placeholder:text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {quickAmounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(String(value))}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                      amount === String(value)
                        ? "border-blue-500 bg-blue-500/15 text-blue-300"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    + ₹{value}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8 border-t border-white/10" />

            {/* Step 3: Security */}
            <div className="mb-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-sm font-bold text-blue-400">
                  3
                </div>

                <div>
                  <h3 className="font-semibold">Security verification</h3>
                  <p className="text-sm text-slate-400">
                    Enter your UPI PIN to authorize the payment.
                  </p>
                </div>
              </div>

              <label
                htmlFor="upiPin"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                UPI PIN
              </label>

              <input
                id="upiPin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={upiPin}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d{0,6}$/.test(value)) {
                    setUpiPin(value);
                  }
                }}
                placeholder="Enter your 4–6 digit PIN"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3.5 text-sm tracking-[0.3em] outline-none transition placeholder:tracking-normal placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />

              <p className="mt-2 text-xs text-slate-500">
                Your PIN is sent to your backend for verification and is not
                stored in this page&apos;s state after a successful payment.
              </p>
            </div>

            <div className="mb-8 border-t border-white/10" />

            {/* Offline payment option */}
            <div className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
              <label className="flex cursor-pointer items-start gap-4">
                <input
                  type="checkbox"
                  checked={offline}
                  onChange={(e) => setOffline(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-amber-500"
                />

                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    Queue as an offline payment
                    <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Offline mode
                    </span>
                  </span>

                  <span className="mt-2 block text-sm leading-6 text-slate-400">
                    {offline
                      ? "The backend will attempt to queue the transaction for later synchronization. Your payment is not confirmed until synchronization succeeds."
                      : "Turn this on to request the backend's offline-payment flow. Your payment may remain pending until synchronization."}
                  </span>
                </span>
              </label>
            </div>

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                <span className="mr-2">⚠</span>
                {error}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
              >
                <span className="mr-2">✓</span>
                {success}
              </div>
            )}

            {/* Payment button */}
            <button
              type="button"
              onClick={handlePayment}
              disabled={isSending || isFindingRecipient || !recipient}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-500 px-6 py-4 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {isSending ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing Payment...
                </>
              ) : (
                <>
                  {offline ? "Queue Offline Payment" : "Send Money"}
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-slate-500">
              Please verify the recipient and amount before confirming.
            </p>
          </section>

          {/* Payment information sidebar */}
          <aside className="space-y-6">
            {/* Payment summary */}
            <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
              <h3 className="text-lg font-semibold">Payment summary</h3>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-400">Recipient</span>

                  <span className="max-w-45 truncate text-right text-sm font-medium">
                    {recipient?.fullName || "Not selected"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-400">UPI ID</span>

                  <span className="max-w-45 truncate text-right text-sm font-medium">
                    {recipient?.upiId || "—"}
                  </span>
                </div>

                <div className="border-t border-white/10" />

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-400">Amount</span>

                  <span className="text-2xl font-bold">
                    ₹
                    {amount && Number.isFinite(Number(amount))
                      ? Number(amount).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "0.00"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-400">Payment mode</span>

                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      offline
                        ? "bg-amber-500/10 text-amber-300"
                        : "bg-emerald-500/10 text-emerald-300"
                    }`}
                  >
                    {offline ? "Offline queue" : "Online"}
                  </span>
                </div>

                <div className="border-t border-white/10" />

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-400">
                    Transaction fee
                  </span>

                  <span className="text-sm font-medium text-emerald-400">
                    ₹0.00*
                  </span>
                </div>
              </div>

              <p className="mt-5 text-xs leading-5 text-slate-500">
                *The frontend displays no fee. Actual fees, if any, are
                determined by your payment system.
              </p>
            </section>

            {/* Security card */}
            <section className="rounded-3xl border border-emerald-500/15 bg-emerald-500/5 p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-xl">
                🔒
              </div>

              <h3 className="font-semibold">Secure payments</h3>

              <ul className="mt-4 space-y-3 text-sm leading-5 text-slate-400">
                <li className="flex gap-3">
                  <span className="text-emerald-400">✓</span>
                  Authenticated API requests
                </li>

                <li className="flex gap-3">
                  <span className="text-emerald-400">✓</span>
                  Backend UPI PIN verification
                </li>

                <li className="flex gap-3">
                  <span className="text-emerald-400">✓</span>
                  Transaction status tracking
                </li>

                <li className="flex gap-3">
                  <span className="text-emerald-400">✓</span>
                  Offline queue and synchronization support
                </li>
              </ul>
            </section>

            {/* Help card */}
            <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
              <h3 className="font-semibold">Need help?</h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Check your previous transactions to review payment statuses.
              </p>

              <Link
                href="/transactions"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition hover:text-blue-300"
              >
                View transaction history
                <span aria-hidden="true">→</span>
              </Link>
            </section>
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-10 border-t border-white/10 py-6 text-center text-xs text-slate-500">
          Offline UPI · Secure payment experience
        </footer>
      </div>
    </main>
  );
}