"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

interface User {
  _id?: string;
  fullName: string;
  email: string;
  phone: string;
  upiId: string;
  balance: number;
}

interface TransactionUser {
  _id?: string;
  fullName?: string;
  upiId?: string;
}

interface Transaction {
  _id: string;
  sender: TransactionUser | string;
  receiver: TransactionUser | string;
  amount: number;
  status: string;
  offline: boolean;
  transactionId?: string;
  createdAt?: string;
  syncedAt?: string;
}

function getOtherParty(
  transaction: Transaction,
  currentUserId?: string
) {
  const isSender =
    typeof transaction.sender === "object" &&
    transaction.sender !== null &&
    currentUserId &&
    transaction.sender._id === currentUserId;

  const otherParty = isSender
    ? transaction.receiver
    : transaction.sender;

  if (typeof otherParty === "string") {
    return "Unknown user";
  }

  return otherParty?.fullName || otherParty?.upiId || "Unknown user";
}

function formatAmount(
  transaction: Transaction,
  currentUserId?: string
) {
  const isSender =
    typeof transaction.sender === "object" &&
    transaction.sender !== null &&
    currentUserId &&
    transaction.sender._id === currentUserId;

  const sign = isSender ? "−" : "+";

  return `${sign}₹${Number(transaction.amount).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatTransactionTime(date?: string) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusStyle(status: string) {
  switch (status.toUpperCase()) {
    case "SUCCESS":
      return "text-green-600";

    case "PENDING":
      return "text-orange-500";

    case "FAILED":
      return "text-red-500";

    default:
      return "text-slate-500";
  }
}

export default function HomePage() {
  const router = useRouter();

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [transactionError, setTransactionError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/login");
          return;
        }

        const profileData = await apiRequest("/api/users/profile", {
          method: "GET",
        });

        if (!profileData?.user) {
          throw new Error("Unable to load your profile.");
        }

        if (cancelled) return;

        setUser(profileData.user);

        try {
          const transactionData = await apiRequest(
            "/api/transactions/history",
            { method: "GET" }
          );

          if (cancelled) return;

          setTransactions(
            Array.isArray(transactionData?.transactions)
              ? transactionData.transactions
              : []
          );
        } catch (err) {
          console.error("Transaction history error:", err);

          if (!cancelled) {
            setTransactionError(
              err instanceof Error
                ? err.message
                : "Could not load recent transactions."
            );
          }
        }
      } catch (err) {
        console.error("Dashboard loading error:", err);

        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to load your account.";

          if (
            message.toLowerCase().includes("token") ||
            message.toLowerCase().includes("unauthorized")
          ) {
            localStorage.removeItem("token");
            router.replace("/login");
            return;
          }

          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("token");
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[rgb(245,247,246)] flex justify-center">
        <div className="w-full max-w-130 min-h-screen bg-white shadow-xl flex items-center justify-center">
          <p className="text-sm text-slate-500">
            Loading your account...
          </p>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="min-h-screen bg-[#f5f7f6] flex justify-center">
        <div className="w-full max-w-130 min-h-screen bg-white shadow-xl flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-red-500 font-semibold">
              {error || "Unable to load your account."}
            </p>

            <Link
              href="/login"
              className="inline-block mt-4 px-5 py-2 rounded-lg bg-[#071b35] text-white text-sm font-semibold"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const firstLetter = user.fullName?.charAt(0).toUpperCase() || "U";

  return (
    <main className="min-h-screen bg-linear-to-br flex justify-center">
      <div className="w-full max-w-130 min-h-screen bg-white shadow-xl flex flex-col">
        {/* Header */}

        <header className="px-6 pt-6 pb-3">
          <div className="flex items-center justify-between">
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

            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                aria-label="Open profile"
                className="w-10 h-10 rounded-full bg-[#071b35] text-white font-semibold flex items-center justify-center"
              >
                {firstLetter}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-semibold text-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}

        <section className="flex-1 px-6 pb-6">
          {/* Greeting */}

          <div className="mt-4">
            <h1 className="text-[28px] leading-8 font-extrabold text-[#071b35]">
              Hello,
              <br />
              {user.fullName} 👋
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Good to see you!
            </p>

            <p className="text-xs text-slate-500 mt-2">
              UPI ID: {user.upiId}
            </p>
          </div>

          {/* Wallet balance */}

          <div className="mt-5 rounded-2xl p-5 bg-linear-to-br from-green-500 to-green-600 text-white shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">UPI Balance</p>

              <button
                type="button"
                onClick={() => setBalanceVisible(!balanceVisible)}
                aria-label={
                  balanceVisible ? "Hide balance" : "Show balance"
                }
                className="text-xl"
              >
                {balanceVisible ? "◉" : "○"}
              </button>
            </div>

            <p className="text-[32px] leading-9 font-bold mt-2">
              {balanceVisible
                ? `₹${Number(user.balance).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "₹••••••"}
            </p>

            <p className="mt-2 text-xs text-green-50">
              Available wallet balance
            </p>
          </div>

          {/* Quick actions */}

          <div className="grid grid-cols-2 gap-3 mt-4">
            <Link
              href="/send"
              className="h-24 rounded-2xl bg-[#eef5ff] flex flex-col items-center justify-center hover:bg-blue-50 transition"
            >
              <span className="text-2xl text-blue-600">➤</span>

              <span className="mt-2 text-sm font-semibold text-[#071b35]">
                Send Money
              </span>
            </Link>

            <Link
              href="/scan"
              className="h-24 rounded-2xl bg-[#eef5ff] flex flex-col items-center justify-center hover:bg-blue-50 transition"
            >
              <span className="text-2xl text-blue-600">▦</span>

              <span className="mt-2 text-sm font-semibold text-[#071b35]">
                Scan & Pay
              </span>
            </Link>

            <Link
              href="/profile"
              className="h-24 rounded-2xl bg-[#eef5ff] flex flex-col items-center justify-center hover:bg-blue-50 transition"
            >
              <span className="text-2xl text-blue-600">○</span>

              <span className="mt-2 text-sm font-semibold text-[#071b35]">
                My Profile
              </span>
            </Link>

            <Link
              href="/transactions?filter=pending"
              className="h-24 rounded-2xl bg-[#eef5ff] flex flex-col items-center justify-center hover:bg-blue-50 transition"
            >
              <span className="text-2xl text-blue-600">◉</span>

              <span className="mt-2 text-sm font-semibold text-[#071b35]">
                Offline Payments
              </span>
            </Link>
          </div>

          {/* Connection status */}

          <div className="mt-4 rounded-xl bg-green-50 border border-green-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-lg">📶</span>
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-[#071b35]">
                  Connected to server
                </p>

                <p className="text-xs text-slate-500 mt-0.5">
                  Your account information is loaded.
                </p>
              </div>
            </div>
          </div>

          {/* Recent transactions */}

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#071b35]">
                Recent Transactions
              </h2>

              <Link
                href="/transactions"
                className="text-sm font-semibold text-blue-600"
              >
                See All
              </Link>
            </div>

            {transactionError && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-100 p-3">
                <p className="text-sm text-red-600">
                  {transactionError}
                </p>
              </div>
            )}

            {!transactionError && transactions.length === 0 && (
              <div className="mt-4 py-8 text-center border border-dashed border-slate-200 rounded-xl">
                <p className="text-2xl">↔</p>

                <p className="mt-2 text-sm font-semibold text-[#071b35]">
                  No transactions yet
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Your recent payments will appear here.
                </p>
              </div>
            )}

            <div className="mt-2">
              {transactions.map((transaction) => {
                const name = getOtherParty(
                  transaction,
                  user._id
                );

                const isSender =
                  typeof transaction.sender === "object" &&
                  transaction.sender !== null &&
                  user._id === transaction.sender._id;

                return (
                  <div
                    key={transaction._id}
                    className="flex items-center gap-3 py-3 border-b border-slate-100"
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold ${
                        transaction.status.toUpperCase() === "SUCCESS"
                          ? "bg-green-100 text-green-600"
                          : transaction.status.toUpperCase() === "PENDING"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#071b35] truncate">
                        {name}
                      </p>

                      <p className="text-xs text-slate-500 mt-0.5">
                        {isSender ? "Paid" : "Received"} ·{" "}
                        {formatTransactionTime(
                          transaction.createdAt
                        )}
                      </p>

                      {transaction.offline && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          Offline payment
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[#071b35]">
                        {formatAmount(transaction, user._id)}
                      </p>

                      <p
                        className={`text-xs font-medium mt-0.5 ${getStatusStyle(
                          transaction.status
                        )}`}
                      >
                        {transaction.status}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bottom navigation */}

        <nav className="w-full bg-white border-t border-slate-200 px-6 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <Link
              href="/home"
              className="flex flex-col items-center gap-1 text-[#071b35]"
            >
              <span className="text-xl">⌂</span>
              <span className="text-[10px] font-semibold">Home</span>
            </Link>

            <Link
              href="/transactions"
              className="flex flex-col items-center gap-1 text-slate-400"
            >
              <span className="text-xl">≡</span>
              <span className="text-[10px]">Transactions</span>
            </Link>

            <Link
              href="/scan"
              className="flex flex-col items-center gap-1 text-slate-400"
            >
              <span className="text-xl">▦</span>
              <span className="text-[10px]">Scan</span>
            </Link>

            <Link
              href="/profile"
              className="flex flex-col items-center gap-1 text-slate-400"
            >
              <span className="text-xl">○</span>
              <span className="text-[10px]">Profile</span>
            </Link>
          </div>
        </nav>
      </div>
    </main>
  );
}