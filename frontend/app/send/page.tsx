"use client";

import Link from "next/link";
import { useState } from "react";

type SendType = "upi" | "mobile" | "bank";

export default function SendMoneyPage() {
  const [sendType, setSendType] = useState<SendType>("upi");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  return (
    <main className="min-h-screen bg-[#f5f7f6] flex justify-center">

      <div className="w-full max-w-130 min-h-screen bg-white shadow-xl flex flex-col">

        {/* Header */}
        <header className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">

            <Link
              href="/home"
              className="text-2xl text-[#071b35]"
            >
              ←
            </Link>

            <h1 className="text-xl font-bold text-[#071b35]">
              Send Money
            </h1>

          </div>
        </header>

        <section className="flex-1 px-6 pb-8">

          {/* Payment Type */}

          <div className="mt-3 p-1 bg-slate-100 rounded-xl flex">

            <button
              onClick={() => setSendType("upi")}
              className={`flex-1 h-11 rounded-lg text-sm font-semibold transition ${
                sendType === "upi"
                  ? "bg-[#071b35] text-white"
                  : "text-[#071b35]"
              }`}
            >
              UPI ID
            </button>

            <button
              onClick={() => setSendType("mobile")}
              className={`flex-1 h-11 rounded-lg text-sm font-semibold transition ${
                sendType === "mobile"
                  ? "bg-[#071b35] text-white"
                  : "text-[#071b35]"
              }`}
            >
              Mobile
            </button>

            <button
              onClick={() => setSendType("bank")}
              className={`flex-1 h-11 rounded-lg text-sm font-semibold transition ${
                sendType === "bank"
                  ? "bg-[#071b35] text-white"
                  : "text-[#071b35]"
              }`}
            >
              Bank Account
            </button>

          </div>


          {/* Recipient */}

          <div className="mt-6">

            <label className="block text-sm font-semibold text-[#071b35] mb-2">
              {sendType === "upi"
                ? "UPI ID"
                : sendType === "mobile"
                ? "Mobile Number"
                : "Bank Account"}
            </label>

            <div className="relative">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500">
                {sendType === "upi"
                  ? "@"
                  : sendType === "mobile"
                  ? "☎"
                  : "▣"}
              </span>

              <input
                type={sendType === "mobile" ? "tel" : "text"}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={
                  sendType === "upi"
                    ? "name@upi"
                    : sendType === "mobile"
                    ? "Enter mobile number"
                    : "Account number"
                }
                className="w-full h-14 pl-12 pr-4 border border-slate-200 rounded-xl outline-none focus:border-[#071b35] text-sm text-[#071b35] placeholder:text-slate-400"
              />

            </div>

          </div>


          {/* Amount */}

          <div className="mt-5">

            <label className="block text-sm font-semibold text-[#071b35] mb-2">
              Amount
            </label>

            <div className="relative">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-[#071b35]">
                ₹
              </span>

              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-14 pl-11 pr-4 border border-slate-200 rounded-xl outline-none focus:border-[#071b35] text-lg text-[#071b35] placeholder:text-slate-400"
              />

            </div>

          </div>


          {/* Quick Amount */}

          <div className="flex gap-2 mt-3">

            {["₹100", "₹500", "₹1,000"].map((value) => {

              const numericValue = value.replace(/[₹,]/g, "");

              return (
                <button
                  key={value}
                  onClick={() => setAmount(numericValue)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#071b35] hover:bg-slate-50"
                >
                  {value}
                </button>
              );
            })}

          </div>


          {/* Note */}

          <div className="mt-5">

            <label className="block text-sm font-semibold text-[#071b35] mb-2">
              Add a note <span className="font-normal text-slate-400">(optional)</span>
            </label>

            <div className="relative">

              <span className="absolute left-4 top-4 text-slate-500">
                ▣
              </span>

              <input
                type="text"
                placeholder="e.g. Lunch, Rent, etc."
                className="w-full h-14 pl-11 pr-4 border border-slate-200 rounded-xl outline-none focus:border-[#071b35] text-sm placeholder:text-slate-400"
              />

            </div>

          </div>


          {/* Offline Notice */}

          <div className="mt-6 rounded-xl bg-green-50 border border-green-100 p-4">

            <div className="flex gap-3">

              <div className="w-10 h-10 shrink-0 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-lg">
                  📶
                </span>
              </div>

              <div>

                <p className="text-sm font-semibold text-[#071b35]">
                  No Internet?
                </p>

                <p className="text-xs text-slate-600 mt-1 leading-4">
                  You can still create a secure offline payment.
                  It will be sent when you're back online.
                </p>

              </div>

            </div>

          </div>


          {/* Continue */}

          <button
            disabled={!recipient || !amount}
            className="
              mt-6
              w-full
              h-14
              rounded-xl
              bg-[#071b35]
              text-white
              font-semibold
              disabled:bg-slate-200
              disabled:text-slate-400
              transition
            "
          >
            Continue
          </button>

        </section>

      </div>

    </main>
  );
}